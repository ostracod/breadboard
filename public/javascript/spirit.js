
// Negative spirit IDs are assigned by the client, and are
// intended to be replaced by the server.
// Non-negative spirit IDs are assigned by the server.
let nextComplexSpiritId = -1;

class Spirit {
    
    // Concrete subclasses of Spirit must implement these methods:
    // getReference, getDisplayName
    
    constructor(spiritType) {
        this.spiritType = spiritType;
    }
    
    // Server-side we can afford to use === between spirits because
    // the server maintains more strict instances of spirits.
    // Client-side we should favor using hasSameIdentity.
    hasSameIdentity(spirit) {
        return this.getReference().equals(spirit.getReference());
    }
    
    getSprites() {
        return this.spiritType.spriteList;
    }
    
    getDisplayName() {
        return this.spiritType.getDisplayName();
    }
    
    canBeMined() {
        return this.spiritType.canBeMined();
    }
    
    canBeInspected() {
        return this.spiritType.canBeInspected();
    }
    
    addToCache() {
        // Do nothing.
    }
    
    getRecycleProducts() {
        return this.spiritType.getBaseRecycleProducts();
    }
}

class SimpleSpirit extends Spirit {
    
    constructor(spiritType) {
        super(spiritType);
        this.serialInteger = this.spiritType.serialInteger;
        this.reference = new SimpleSpiritReference(this.serialInteger);
        simpleSpiritSet[this.spiritType.baseName] = this;
        simpleSpiritMap[this.serialInteger] = this;
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
    
    canBeInspected() {
        if (!super.canBeInspected()) {
            return false;
        }
        return (this.id >= 0);
    }
    
    addToCache() {
        let index = findComplexSpiritInCache(this.id);
        if (index >= 0) {
            complexSpiritCache[index].spirit = this;
            return;
        }
        complexSpiritCache.push({
            spirit: this,
            updateRequestCount,
        });
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

class CircuitSpirit extends ComplexSpirit {
    
}

class ConstantLogicSpirit extends ComplexSpirit {
    
    constructor(spiritType, id, constantValue) {
        super(spiritType, id);
        this.constantValue = constantValue;
    }
}

const findComplexSpiritInCache = (spiritId) => {
    for (let index = 0; index < complexSpiritCache.length; index++) {
        let tempItem = complexSpiritCache[index];
        if (tempItem.spirit.id === spiritId) {
            return index;
        }
    }
    return -1;
};

const removeStaleSpiritsInCache = () => {
    for (let index = complexSpiritCache.length - 1; index >= 0; index--) {
        let tempItem = complexSpiritCache[index];
        if (tempItem.updateRequestCount < updateRequestCount - 10) {
            complexSpiritCache.splice(index, 1);
        }
    }
};


