
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
    }
    
    getReference() {
        return this.reference;
    }
}

class ComplexSpirit extends Spirit {
    
    constructor(spiritType, id) {
        super(spiritType);
        this.classId = spiritType.spiritClassId;
        this.id = id;
        this.reference = new ComplexSpiritReference(this.id);
    }
    
    getReference() {
        return this.reference;
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


