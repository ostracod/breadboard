
class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpiritClientJson, matchesJson, convertClientJsonToSpirit, craft,
    // getDisplayName
    
    constructor(spriteList, baseName) {
        this.spriteList = spriteList
        this.baseName = baseName;
    }
    
    matchesSpirit(spirit) {
        return (spirit.spiritType === this);
    }
    
    canBeMined() {
        return false;
    }
    
    canBeInspected() {
        return false;
    }
    
    // Returns a list of RecipeComponent.
    getBaseRecycleProducts() {
        return [];
    }
}

class SimpleSpiritType extends SpiritType {
    
    constructor(spriteList, baseName, offset = 0) {
        super(spriteList, baseName);
        this.serialInteger = simpleSpiritSerialIntegerSet[this.baseName] + offset;
        this.spirit = new SimpleSpirit(this);
        simpleSpiritTypeSet[this.baseName] = this;
        simpleSpiritTypeMap[this.serialInteger] = this;
    }
    
    matchesSpiritClientJson(data) {
        return (typeof data === "number" && this.spirit.serialInteger === data);
    }
    
    matchesJson(data) {
        return (data.type === "simple" && this.spirit.serialInteger === data.serialInteger);
    }
    
    convertClientJsonToSpirit(data) {
        return this.spirit;
    }
    
    craft() {
        return this.spirit;
    }
}

class LoadingSpiritType extends SimpleSpiritType {
    
    constructor() {
        super([loadingSprite], "loading");
    }
    
    getDisplayName() {
        return "Loading";
    }
}

class EmptySpiritType extends SimpleSpiritType {
    
    constructor() {
        super([], "empty");
    }
    
    getDisplayName() {
        return "Empty";
    }
}

class BarrierSpiritType extends SimpleSpiritType {
    
    constructor() {
        super([barrierSprite], "barrier");
    }
    
    getDisplayName() {
        return "Barrier";
    }
}

class ResourceSpiritType extends SimpleSpiritType {
    
    constructor(baseName, paletteIndex) {
        let tempSprite = new Sprite(resourceSpriteSet, 0, paletteIndex);
        super([tempSprite], baseName);
    }
    
    canBeMined() {
        return true;
    }
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(this, 1)];
    }
}

class MatteriteSpiritType extends ResourceSpiritType {
    
    constructor() {
        super("matterite", 0);
    }
    
    getDisplayName() {
        return "Matterite";
    }
}

class EnergiteSpiritType extends ResourceSpiritType {
    
    constructor() {
        super("energite", 1);
    }
    
    getDisplayName() {
        return "Energite";
    }
}

class BlockSpiritType extends SimpleSpiritType {
    
    constructor(colorIndex) {
        let tempSprite = new Sprite(blockSpriteSet, 0, colorIndex);
        super([tempSprite], "block", colorIndex);
        this.colorIndex = colorIndex;
        this.color = spiritColorSet[this.colorIndex];
    }
    
    getDisplayName() {
        return this.color.name + " Block";
    }
    
    canBeMined() {
        return true;
    }
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(simpleSpiritTypeSet.matterite, 1.5)];
    }
}

class WireSpiritType extends SimpleSpiritType {
    
    constructor(arrangement) {
        let tempSpriteList;
        if (arrangement < 11) {
            tempSpriteList = [new Sprite(wireSpriteSet, arrangement, 0)];
        } else {
            tempSpriteList = [
                new Sprite(wireSpriteSet, 0, 0),
                new Sprite(wireSpriteSet, 1, 0)
            ];
        }
        super(tempSpriteList, "wire", arrangement);
        this.arrangement = arrangement;
    }
    
    getDisplayName() {
        return "Wire";
    }
}

class ComplexSpiritType extends SpiritType {
    
    constructor(spriteList, baseName) {
        super(spriteList, baseName);
        this.spiritClassId = complexSpiritClassIdSet[this.baseName];
        if (!(this.spiritClassId in complexSpiritTypeMap)) {
            complexSpiritTypeMap[this.spiritClassId] = [];
        }
        complexSpiritTypeMap[this.spiritClassId].push(this);
    }
    
    matchesSpiritClientJson(data) {
        return (typeof data !== "number" && this.spiritClassId === data.classId);
    }
    
    matchesJson(data) {
        return (data.type === "complex" && this.spiritClassId === data.classId);
    }
}

class PlayerSpiritType extends ComplexSpiritType {
    
    constructor() {
        super([playerSprite], "player");
    }
    
    convertClientJsonToSpirit(data) {
        return new PlayerSpirit(this, data.id, data.username);
    }
    
    craft() {
        throw new Error("Cannot craft player.");
    }
    
    getDisplayName() {
        return "Player";
    }
}

class MachineSpiritType extends ComplexSpiritType {
    
    constructor(colorIndex) {
        let tempSprite = new Sprite(machineSpriteSet, 0, colorIndex);
        super([tempSprite], "machine");
        this.colorIndex = colorIndex;
        this.color = spiritColorSet[this.colorIndex];
    }
    
    matchesSpiritClientJson(data) {
        return (super.matchesSpiritClientJson(data) && this.colorIndex === data.colorIndex);
    }
    
    matchesJson(data) {
        return (super.matchesJson(data) && this.colorIndex === data.colorIndex);
    }
    
    convertClientJsonToSpirit(data) {
        return new MachineSpirit(this, data.id);
    }
    
    craft() {
        return new MachineSpirit(this, null);
    }
    
    getDisplayName() {
        return this.color.name + " Machine";
    }
    
    canBeMined() {
        return true;
    }
    
    canBeInspected() {
        return true;
    }
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(simpleSpiritTypeSet.matterite, 2.25)];
    }
}

class CircuitSpiritType extends ComplexSpiritType {
    
    constructor() {
        let tempSprite = new Sprite(circuitSpriteSet, 0, 0);
        super([tempSprite], "circuit");
    }
    
    convertClientJsonToSpirit(data) {
        return new CircuitSpirit(this, data.id);
    }
    
    craft() {
        return new CircuitSpirit(this, null);
    }
    
    getDisplayName() {
        return "Circuit";
    }
    
    canBeMined() {
        return true;
    }
    
    canBeInspected() {
        return true;
    }
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(simpleSpiritTypeSet.matterite, 0.75)];
    }
}

function convertClientJsonToSpirit(data) {
    let tempType;
    if (typeof data === "number") {
        tempType = simpleSpiritTypeMap[data];
    } else {
        let tempTypeList = complexSpiritTypeMap[data.classId];
        for (let spiritType of tempTypeList) {
            if (spiritType.matchesSpiritClientJson(data)) {
                tempType = spiritType;
                break;
            }
        }
    }
    return tempType.convertClientJsonToSpirit(data);
}

function convertJsonToSpiritType(data) {
    if (data.type == "simple") {
        return simpleSpiritTypeMap[data.serialInteger];
    }
    if (data.type == "complex") {
        let tempTypeList = complexSpiritTypeMap[data.classId];
        for (let spiritType of tempTypeList) {
            if (spiritType.matchesJson(data)) {
                return spiritType;
            }
        }
    }
    return null;
}


