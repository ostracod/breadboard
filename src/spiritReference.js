
import {simpleSpiritMap, complexSpiritMap} from "./globalData.js";

// A SpiritReference is used to identify unique
// instances of Spirits.

class SpiritReference {
    
    // Concrete subclasses of SpiritReference must implement these methods:
    // equals, getSpirit
    
    constructor() {
        
    }
}

export class SimpleSpiritReference extends SpiritReference {
    
    constructor(serialInteger) {
        super();
        this.serialInteger = serialInteger;
    }
    
    equals(spiritReference) {
        if (!(spiritReference instanceof SimpleSpiritReference)) {
            return false;
        }
        return (this.serialInteger == spiritReference.serialInteger);
    }
    
    getSpirit() {
        return simpleSpiritMap[this.serialInteger];
    }
}

export class ComplexSpiritReference extends SpiritReference {
    
    constructor(id) {
        super();
        this.id = id;
    }
    
    equals(spiritReference) {
        if (!(spiritReference instanceof ComplexSpiritReference)) {
            return false;
        }
        return (this.id === spiritReference.id);
    }
    
    getSpirit() {
        if (this.id in simpleSpiritMap) {
            return complexSpiritMap[this.id];
        } else {
            return null;
        }
    }
}

export function convertJsonToSpiritReference(data) {
    if (data.type === "simple") {
        return new SimpleSpiritReference(data.serialInteger);
    } else {
        return new ComplexSpiritReference(data.id);
    }
}


