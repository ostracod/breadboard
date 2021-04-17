
import { simpleSpiritMap, complexSpiritMap } from "./globalData.js";
import { SpiritReferenceJson, SimpleSpiritReferenceJson, ComplexSpiritReferenceJson } from "./interfaces.js";
import { Spirit, SimpleSpirit, ComplexSpirit } from "./spirit.js";

// A SpiritReference is used to identify unique
// instances of Spirits.

export abstract class SpiritReference {
    
    constructor() {
        
    }
    
    abstract getJson(): SpiritReferenceJson;
    
    abstract equals(spiritReference: SpiritReference): boolean;
    
    abstract getSpirit(): Spirit;
}

export class SimpleSpiritReference extends SpiritReference {
    
    serialInteger: number;
    
    constructor(serialInteger: number) {
        super();
        this.serialInteger = serialInteger;
    }
    
    getJson(): SimpleSpiritReferenceJson {
        return {
            type: "simple",
            serialInteger: this.serialInteger,
        };
    }
    
    equals(spiritReference: SpiritReference): boolean {
        if (!(spiritReference instanceof SimpleSpiritReference)) {
            return false;
        }
        return (this.serialInteger === spiritReference.serialInteger);
    }
    
    getSpirit(): SimpleSpirit {
        return simpleSpiritMap[this.serialInteger];
    }
}

export class ComplexSpiritReference extends SpiritReference {
    
    id: number;
    
    constructor(id: number) {
        super();
        this.id = id;
    }
    
    getJson(): ComplexSpiritReferenceJson {
        return {
            type: "complex",
            id: this.id,
        };
    }
    
    equals(spiritReference: SpiritReference): boolean {
        if (!(spiritReference instanceof ComplexSpiritReference)) {
            return false;
        }
        return (this.id === spiritReference.id);
    }
    
    getSpirit(): ComplexSpirit {
        if (this.id in complexSpiritMap) {
            return complexSpiritMap[this.id];
        } else {
            return null;
        }
    }
}

export const convertJsonToSpiritReference = (data: SpiritReferenceJson): SpiritReference => {
    if (data.type === "simple") {
        return new SimpleSpiritReference((data as SimpleSpiritReferenceJson).serialInteger);
    } else {
        return new ComplexSpiritReference((data as ComplexSpiritReferenceJson).id);
    }
};


