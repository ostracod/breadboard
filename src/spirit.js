
import {SimpleSpiritReference, ComplexSpiritReference} from "./spiritReference.js";
import {Inventory} from "./inventory.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let dbUtils = ostracodMultiplayer.dbUtils;

export const simpleSpiritSerialIntegerSet = {
    empty: 0,
    barrier: 1,
    matterite: 2,
    energite: 3,
    block: 4
};

export const complexSpiritClassIdSet = {
    player: 0
};

export const spiritColorAmount = 16;

export let simpleSpiritSet = [];
let nextComplexSpiritId = 0;
// Map from complex spirit ID to ComplexSpirit.
export let dirtyComplexSpiritSet = {};

// The idea is that a Spirit is something which may
// exist as a Tile or Item.
// A SimpleSpirit holds no state, and may be
// serialized as a single integer.
// A ComplexSpirit holds custom state, and must
// be serialized as a JSON dictionary.

class Spirit {
    
    // Concrete subclasses of Spirit must implement these methods:
    // getClientJson, getNestedDbJson, getReference
    
    constructor() {
        
    }
    
    hasSameIdentity(spirit) {
        return this.getReference().equals(spirit.getReference());
    }
    
    canBeMined() {
        return false;
    }
}

export class SimpleSpirit extends Spirit {
    
    constructor(serialInteger) {
        super();
        this.serialInteger = serialInteger
        this.reference = new SimpleSpiritReference(this.serialInteger);
        simpleSpiritSet.push(this);
    }
    
    getClientJson() {
        return this.serialInteger;
    }
    
    getNestedDbJson() {
        return this.serialInteger;
    }
    
    getReference() {
        return this.reference;
    }
}

export class EmptySpirit extends SimpleSpirit {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.empty);
    }
}

export class BarrierSpirit extends SimpleSpirit {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.barrier);
    }
}

class ResourceSpirit extends SimpleSpirit {
    
    canBeMined() {
        return true;
    }
}

export class MatteriteSpirit extends ResourceSpirit {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.matterite);
    }
}

export class EnergiteSpirit extends ResourceSpirit {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.energite);
    }
}

export class BlockSpirit extends SimpleSpirit {
    
    constructor(colorIndex) {
        super(simpleSpiritSerialIntegerSet.block + colorIndex);
    }
    
    canBeMined() {
        return true;
    }
}

export let emptySpirit = new EmptySpirit();
new BarrierSpirit();
new MatteriteSpirit();
new EnergiteSpirit();

for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new BlockSpirit(colorIndex);
}

export class ComplexSpirit extends Spirit {
    
    constructor(classId, id) {
        super();
        this.classId = classId;
        if (id === null) {
            this.id = nextComplexSpiritId;
            nextComplexSpiritId += 1;
            dirtyComplexSpiritSet[this.id] = this;
        } else {
            this.id = id;
        }
        this.reference = new ComplexSpiritReference(this.id);
        this.hasDbRow = false;
    }
    
    getClientJson() {
        return {
            classId: this.classId,
            id: this.id
        };
    }
    
    getAttributeDbJson() {
        return null;
    }
    
    getContainerDbJson() {
        return null;
    }
    
    getNestedDbJson() {
        return {
            id: this.id,
            classId: this.classId,
            attributeData: this.getAttributeDbJson(),
            containerData: this.getContainerDbJson()
        };
    }
    
    getReference() {
        return this.reference;
    }
    
    persist() {
        return new Promise((resolve, reject) => {
            // TODO: Handle nested complex spirits.
            
            function queryCallback(error, results, fields) {
                if (error) {
                    reject(dbUtils.convertSqlErrorToText(error));
                    return;
                }
                resolve();
            }
            
            let attributeData = JSON.stringify(this.getAttributeDbJson());
            let containerData = JSON.stringify(this.getContainerDbJson());
            if (this.hasDbRow) {
                dbUtils.performQuery(
                    "UPDATE ComplexSpirits SET attributeData = ?, containerData = ? WHERE id = ?",
                    [attributeData, containerData, this.id],
                    queryCallback
                );
            } else {
                this.hasDbRow = true;
                dbUtils.performQuery(
                    "INSERT INTO ComplexSpirits (id, parentId, classId, attributeData, containerData) VALUES (?, NULL, ?, ?, ?)",
                    [this.id, this.classId, attributeData, containerData],
                    queryCallback
                );
            }
        });
    }
}

export class PlayerSpirit extends ComplexSpirit {
    
    constructor(player) {
        let lastId = player.extraFields.complexSpiritId;
        super(complexSpiritClassIdSet.player, lastId);
        if (lastId === null) {
            player.extraFields.complexSpiritId = this.id;
        }
        this.player = player;
        this.inventory = new Inventory();
        this.inventory.addObserver(this);
        this.inventoryUpdates = [];
    }
    
    inventoryChangeEvent(inventory, item) {
        for (let index = 0; index < this.inventoryUpdates.length; index++) {
            let tempItem = this.inventoryUpdates[index];
            if (item.spirit === tempItem.spirit) {
                this.inventoryUpdates[index] = item;
                return;
            }
        }
        this.inventoryUpdates.push(item);
    }
    
    getClientJson() {
        let output = super.getClientJson();
        output.username = this.player.username;
        return output;
    }
    
    getAttributeDbJson() {
        return {
            username: this.player.username
        };
    }
    
    getNestedDbJson() {
        // Player spirit should never be persisted in a container.
        return null;
    }
}

export function getNextComplexSpiritId() {
    return nextComplexSpiritId;
}

export function setNextComplexSpiritId(id) {
    nextComplexSpiritId = id;
}

export function persistAllComplexSpirits() {
    let operationList = [];
    for (let id in dirtyComplexSpiritSet) {
        let tempSpirit = dirtyComplexSpiritSet[id];
        operationList.push(() => tempSpirit.persist());
    }
    dirtyComplexSpiritSet = {};
    if (operationList.length <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        dbUtils.performTransaction(callback => {
            operationList.reduce((accumulator, operation) => {
                if (accumulator === null) {
                    return operation();
                } else {
                    return accumulator.then(operation);
                }
            }, null).then(callback);
        }, resolve);
    });
}


