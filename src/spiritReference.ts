
import {simpleSpiritMap, complexSpiritMap} from "./globalData.js";
import {SpiritReferenceJson, SimpleSpiritReferenceJson, ComplexSpiritReferenceJson} from "./interfaces.js";
import {Spirit} from "./spirit.js";

// A SpiritReference is used to identify unique
// instances of Spirits.

export abstract class SpiritReference {
    
    constructor() {
        
    }
    
    abstract getJson(): SpiritReferenceJson;
    
    abstract equals(spiritReference): boolean;
    
    abstract getSpirit(): Spirit;
}

export class SimpleSpiritReference extends SpiritReference {
    
    serialInteger: number;
    
    constructor(serialInteger) {
        super();
        this.serialInteger = serialInteger;
    }
    
    getJson(): SimpleSpiritReferenceJson {
        return {
            type: "simple",
            serialInteger: this.serialInteger
        };
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
    
    id: number;
    
    constructor(id) {
        super();
        this.id = id;
    }
    
    getJson(): ComplexSpiritReferenceJson {
        return {
            type: "complex",
            id: this.id
        };
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


