
import {SimpleSpiritReference, ComplexSpiritReference} from "./spiritReference.js";
import {Inventory} from "./inventory.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let dbUtils = ostracodMultiplayer.dbUtils;

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
    
    constructor(spiritType) {
        this.spiritType = spiritType;
    }
    
    hasSameIdentity(spirit) {
        return this.getReference().equals(spirit.getReference());
    }
    
    canBeMined() {
        return this.spiritType.canBeMined();
    }
    
    setParentSpirit(spirit) {
        // Do nothing.
    }
}

export class SimpleSpirit extends Spirit {
    
    constructor(spiritType) {
        super(spiritType);
        this.serialInteger = this.spiritType.serialInteger;
        this.reference = new SimpleSpiritReference(this.serialInteger);
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

export class ComplexSpirit extends Spirit {
    
    constructor(spiritType, id) {
        super(spiritType);
        this.classId = this.spiritType.spiritClassId;
        this.parentSpirit = null;
        if (id === null) {
            this.id = nextComplexSpiritId;
            nextComplexSpiritId += 1;
            this.markAsDirty();
        } else {
            this.id = id;
        }
        this.reference = new ComplexSpiritReference(this.id);
        this.hasDbRow = false;
    }
    
    markAsDirty() {
        dirtyComplexSpiritSet[this.id] = this;
        if (!this.hasDbRow && this.parentSpirit !== null) {
            this.parentSpirit.markAsDirty();
        }
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
    
    setParentSpirit(spirit) {
        this.parentSpirit = spirit;
        this.markAsDirty();
    }
    
    shouldHaveDbRow() {
        // TODO: Optimize nesting logic.
        return (this.parentSpirit === null);
    }
    
    persist() {
        let tempShouldHaveDbRow = this.shouldHaveDbRow();
        return new Promise((resolve, reject) => {
            
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
                if (tempShouldHaveDbRow) {
                    dbUtils.performQuery(
                        "UPDATE ComplexSpirits SET attributeData = ?, containerData = ? WHERE id = ?",
                        [attributeData, containerData, this.id],
                        queryCallback
                    );
                } else {
                    dbUtils.performQuery(
                        "DELETE FROM ComplexSpirits WHERE id = ?",
                        [this.id],
                        queryCallback
                    );
                }
            } else {
                if (tempShouldHaveDbRow) {
                    this.hasDbRow = true;
                    dbUtils.performQuery(
                        "INSERT INTO ComplexSpirits (id, parentId, classId, attributeData, containerData) VALUES (?, NULL, ?, ?, ?)",
                        [this.id, this.classId, attributeData, containerData],
                        queryCallback
                    );
                } else {
                    resolve();
                }
            }
        });
    }
}

export class InventorySpirit extends ComplexSpirit {
    
    constructor(spiritType, id, inventory) {
        super(spiritType, id);
        if (inventory === null) {
            inventory = new Inventory();
        }
        this.inventory = inventory;
        this.inventory.parentSpirit = this;
        this.inventory.addObserver(this);
    }
    
    inventoryChangeEvent(inventory, item) {
        this.markAsDirty();
    }
    
    getContainerDbJson() {
        return this.inventory.getDbJson();
    }
}

export class PlayerSpirit extends InventorySpirit {
    
    constructor(spiritType, player, inventory = null) {
        let lastId = player.extraFields.complexSpiritId;
        super(spiritType, lastId, inventory);
        if (lastId === null) {
            player.extraFields.complexSpiritId = this.id;
        }
        this.player = player;
        this.inventoryUpdates = [];
    }
    
    inventoryChangeEvent(inventory, item) {
        super.inventoryChangeEvent(inventory, item);
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

export class MachineSpirit extends InventorySpirit {
    
    constructor(spiritType, id, inventory = null) {
        super(spiritType, id, inventory);
        this.colorIndex = this.spiritType.colorIndex;
    }
    
    getClientJson() {
        let output = super.getClientJson();
        output.colorIndex = this.colorIndex;
        return output;
    }
    
    getAttributeDbJson() {
        return {
            colorIndex: this.colorIndex
        };
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


