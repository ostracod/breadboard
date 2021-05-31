
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
    
    convertClientJsonToWorldTile(data) {
        return null;
    }
    
    convertClientJsonToCircuitTile(data) {
        return null;
    }
    
    getWorldTile() {
        return null;
    }
    
    getCircuitTile() {
        return null;
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
        this.worldTile = new SimpleWorldTile(this);
        this.circuitTile = new SimpleCircuitTile(this);
    }
    
    getReference() {
        return this.reference;
    }
    
    convertClientJsonToWorldTile(data) {
        return this.worldTile;
    }
    
    convertClientJsonToCircuitTile(data) {
        return this.circuitTile;
    }
    
    getWorldTile() {
        return this.worldTile;
    }
    
    getCircuitTile() {
        return this.circuitTile;
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
        const index = findComplexSpiritInCache(this.id);
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
    
    convertClientJsonToWorldTile(data) {
        return new ComplexWorldTile(this);
    }
    
    convertClientJsonToCircuitTile(data) {
        return new ComplexCircuitTile(this);
    }
    
    getWorldTile() {
        return new ComplexWorldTile(this);
    }
    
    getCircuitTile() {
        return new ComplexCircuitTile(this);
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
    
    convertClientJsonToWorldTile(data) {
        const tempController = convertJsonToWalkController(data.walkController);
        return new PlayerWorldTile(this, tempController);
    }
    
    getWorldTile() {
        const tempController = createDefaultWalkController();
        return new PlayerWorldTile(this, tempController);
    }
}

class MachineSpirit extends ComplexSpirit {
    
    convertClientJsonToWorldTile(data) {
        return new MachineWorldTile(this);
    }
    
    getWorldTile() {
        return new MachineWorldTile(this);
    }
}

class LogicPort {
    
    // Concrete subclasses of LogicPort must implement these methods:
    // getPaletteIndex
    
    constructor(name) {
        this.name = name;
    }
}

class InputLogicPort extends LogicPort {
    
    getPaletteIndex() {
        return 1;
    }
}

class OutputLogicPort extends LogicPort {
    
    getPaletteIndex() {
        return 0;
    }
}

class CircuitSpirit extends ComplexSpirit {
    
    getLogicPorts() {
        // TODO: Implement.
        return [];
    }
}

class ConstantLogicSpirit extends ComplexSpirit {
    
    constructor(spiritType, id, constantValue) {
        super(spiritType, id);
        this.constantValue = constantValue;
        this.logicPorts = [new OutputLogicPort("Output")];
    }
    
    getLogicPorts() {
        return this.logicPorts;
    }
    
    convertClientJsonToCircuitTile(data) {
        return new ChipCircuitTile(this, data.sidePortIndexes);
    }
    
    getCircuitTile() {
        return new ChipCircuitTile(this);
    }
}

const findComplexSpiritInCache = (spiritId) => {
    for (let index = 0; index < complexSpiritCache.length; index++) {
        const tempItem = complexSpiritCache[index];
        if (tempItem.spirit.id === spiritId) {
            return index;
        }
    }
    return -1;
};

const removeStaleSpiritsInCache = () => {
    for (let index = complexSpiritCache.length - 1; index >= 0; index--) {
        const tempItem = complexSpiritCache[index];
        if (tempItem.updateRequestCount < updateRequestCount - 10) {
            complexSpiritCache.splice(index, 1);
        }
    }
};


