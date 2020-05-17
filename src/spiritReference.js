
// A SpiritReference is used to identify unique
// instances of Spirits.

class SpiritReference {
    
    // Concrete subclasses of SpiritReference must implement these methods:
    // equals
    
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
}

export function convertJsonToSpiritReference(data) {
    if (typeof data === "number") {
        return new SimpleSpiritReference(data);
    } else {
        return new ComplexSpiritReference(data.id);
    }
}


