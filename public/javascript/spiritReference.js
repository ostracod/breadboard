
// A SpiritReference is used to identify unique
// instances of Spirits.

class SpiritReference {
    
    // Concrete subclasses of SpiritReference must implement these methods:
    // equals, getJson, getCachedSpirit
    
    constructor() {
        
    }
}

class SimpleSpiritReference extends SpiritReference {
    
    constructor(serialInteger) {
        super();
        this.serialInteger = serialInteger;
    }
    
    equals(spiritReference) {
        if (!(spiritReference instanceof SimpleSpiritReference)) {
            return false;
        }
        return (this.serialInteger === spiritReference.serialInteger);
    }
    
    getJson() {
        return {
            type: "simple",
            serialInteger: this.serialInteger,
        };
    }
    
    getCachedSpirit() {
        return simpleSpiritMap[this.serialInteger];
    }
}

class ComplexSpiritReference extends SpiritReference {
    
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
    
    getJson() {
        return {
            type: "complex",
            id: this.id,
        };
    }
    
    getCachedSpirit() {
        const index = findComplexSpiritInCache(this.id);
        if (index < 0) {
            return null;
        } else {
            return complexSpiritCache[index].spirit;
        }
    }
}

const convertJsonToSpiritReference = (data) => {
    if (data.type === "simple") {
        return new SimpleSpiritReference(data.serialInteger);
    } else {
        return new ComplexSpiritReference(data.id);
    }
};


