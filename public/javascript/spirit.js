
// Map from serial integer to SimpleSpirit.
let simpleSpiritSet = {};
// Negative spirit IDs are assigned by the client, and are
// intended to be replaced by the server.
// Non-negative spirit IDs are assigned by the server.
let nextComplexSpiritId = -1;

class Spirit {
    
    // Concrete subclasses of Spirit must implement these methods:
    // getReference, getSprite, getDisplayName
    
    constructor(spiritType) {
        this.spiritType = spiritType;
    }
    
    hasSameIdentity(spirit) {
        return this.getReference().equals(spirit.getReference());
    }
    
    getSprite() {
        return this.spiritType.getSprite();
    }
    
    getDisplayName() {
        return this.spiritType.getDisplayName();
    }
    
    canBeMined() {
        return this.spiritType.canBeMined();
    }
}

class SimpleSpirit extends Spirit {
    
    constructor(spiritType) {
        super(spiritType);
        this.serialInteger = this.spiritType.serialInteger;
        this.reference = new SimpleSpiritReference(this.serialInteger);
        simpleSpiritSet[this.serialInteger] = this;
    }
    
    getReference() {
        return this.reference;
    }
}

class ComplexSpirit extends Spirit {
    
    constructor(spiritType, id) {
        super(spiritType);
        this.classId = spiritType.spiritClassId;
        if (id === null) {
            this.id = nextComplexSpiritId;
            nextComplexSpiritId -= 1;
        } else {
            this.id = id;
        }
        this.reference = new ComplexSpiritReference(this.id);
    }
    
    getReference() {
        return this.reference;
    }
    
    getDisplayName() {
        if (this.id < 0) {
            return "Loading...";
        }
        return super.getDisplayName();
    }
}

class PlayerSpirit extends ComplexSpirit {
    
    constructor(spiritType, id, username) {
        super(spiritType, id);
        this.username = username;
    }
    
    getDisplayName() {
        return this.username;
    }
}

class MachineSpirit extends ComplexSpirit {
    
}


