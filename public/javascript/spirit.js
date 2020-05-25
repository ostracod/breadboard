
let simpleSpiritSet = [];

class Spirit {
    
    // Concrete subclasses of Spirit must implement these methods:
    // getReference, getSprite, getDisplayName
    
    constructor() {
        
    }
    
    hasSameIdentity(spirit) {
        return this.getReference().equals(spirit.getReference());
    }
    
    canBeMined() {
        return false;
    }
}

class LoadingSpirit extends Spirit {
    
    getReference() {
        return null;
    }
    
    getSprite() {
        return loadingSprite;
    }
    
    getDisplayName() {
        return "Loading";
    }
}

let loadingSpirit = new LoadingSpirit();

class SimpleSpirit extends Spirit {
    
    constructor(serialInteger) {
        super();
        this.serialInteger = serialInteger
        this.reference = new SimpleSpiritReference(this.serialInteger);
        new SimpleSpiritType(this);
        simpleSpiritSet.push(this);
    }
    
    getReference() {
        return this.reference;
    }
}

class EmptySpirit extends SimpleSpirit {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.empty);
    }
    
    getSprite() {
        return null;
    }
    
    getDisplayName() {
        return "Empty";
    }
}

class BarrierSpirit extends SimpleSpirit {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.barrier);
    }
    
    getSprite() {
        return barrierSprite;
    }
    
    getDisplayName() {
        return "Barrier";
    }
}

class ResourceSpirit extends SimpleSpirit {
    
    constructor(serialInteger, paletteIndex) {
        super(serialInteger);
        this.sprite = new Sprite(resourceSpriteSet, 0, paletteIndex);
    }
    
    getSprite() {
        return this.sprite;
    }
    
    canBeMined() {
        return true;
    }
}

class MatteriteSpirit extends ResourceSpirit {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.matterite, 0);
    }
    
    getDisplayName() {
        return "Matterite";
    }
}

class EnergiteSpirit extends ResourceSpirit {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.energite, 1);
    }
    
    getDisplayName() {
        return "Energite";
    }
}

class BlockSpirit extends SimpleSpirit {
    
    constructor(colorIndex) {
        super(simpleSpiritSerialIntegerSet.block + colorIndex);
        this.colorIndex = colorIndex;
        this.sprite = new Sprite(blockSpriteSet, 0, this.colorIndex);
        this.color = spiritColorSet[this.colorIndex];
    }
    
    getSprite() {
        return this.sprite;
    }
    
    getDisplayName() {
        return this.color.name + " Block";
    }
    
    canBeMined() {
        return true;
    }
}

new EmptySpirit();
new BarrierSpirit();
new MatteriteSpirit();
new EnergiteSpirit();

for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new BlockSpirit(colorIndex);
}

class ComplexSpirit extends Spirit {
    
    constructor(classId, id) {
        super();
        this.classId = classId;
        this.id = id;
        this.reference = new ComplexSpiritReference(this.id);
    }
    
    getReference() {
        return this.reference;
    }
}

class PlayerSpirit extends ComplexSpirit {
    
    constructor(id, username) {
        super(complexSpiritClassIdSet.player, id);
        this.username = username;
    }
    
    getSprite() {
        return playerSprite;
    }
    
    getDisplayName() {
        return this.username;
    }
}

class MachineSpirit extends ComplexSpirit {
    
    constructor(id, colorIndex) {
        super(complexSpiritClassIdSet.machine, id);
        this.colorIndex = colorIndex;
        this.sprite = new Sprite(machineSpriteSet, 0, this.colorIndex);
        this.color = spiritColorSet[this.colorIndex];
    }
    
    getSprite() {
        return this.sprite;
    }
    
    getDisplayName() {
        return this.color.name + " Machine";
    }
}


