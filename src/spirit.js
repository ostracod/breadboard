
import {SimpleSpiritReference, ComplexSpiritReference} from "./spiritReference.js";
import {Inventory} from "./inventory.js";
import {SimpleSpiritType} from "./spiritType.js";

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
        new SimpleSpiritType(this);
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
    }
    
    getClientJson() {
        return {
            classId: this.classId,
            id: this.id
        };
    }
    
    getNestedDbJson() {
        throw new Error("Not yet implemented.");
    }
    
    getReference() {
        return this.reference;
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

export function loadComplexSpirit(id) {
    if (id in dirtyComplexSpiritSet) {
        return Promise.resolve(dirtyComplexSpiritSet[id]);
    }
    // TODO: Load spirit from DB.
    
}


