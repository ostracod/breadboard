
// Map from serial integer to SimpleSpiritType.
let simpleSpiritTypeMap = {};
// Map from class ID to list of ComplexSpiritType.
let complexSpiritTypeMap = {};

let wireArrangementAmount = 12;

class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpiritClientJson, matchesJson, convertClientJsonToSpirit, craft,
    // getDisplayName
    
    constructor(spriteList) {
        this.spriteList = spriteList
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
    
    constructor(spriteList, serialInteger) {
        super(spriteList);
        this.serialInteger = serialInteger;
        this.spirit = new SimpleSpirit(this);
        simpleSpiritTypeMap[this.spirit.serialInteger] = this;
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
        super([loadingSprite], simpleSpiritSerialIntegerSet.loading);
    }
    
    getDisplayName() {
        return "Loading";
    }
}

class EmptySpiritType extends SimpleSpiritType {
    
    constructor() {
        super([], simpleSpiritSerialIntegerSet.empty);
    }
    
    getDisplayName() {
        return "Empty";
    }
}

class BarrierSpiritType extends SimpleSpiritType {
    
    constructor() {
        super([barrierSprite], simpleSpiritSerialIntegerSet.barrier);
    }
    
    getDisplayName() {
        return "Barrier";
    }
}

class ResourceSpiritType extends SimpleSpiritType {
    
    constructor(serialInteger, paletteIndex) {
        let tempSprite = new Sprite(resourceSpriteSet, 0, paletteIndex);
        super([tempSprite], serialInteger);
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
        super(simpleSpiritSerialIntegerSet.matterite, 0);
    }
    
    getDisplayName() {
        return "Matterite";
    }
}

class EnergiteSpiritType extends ResourceSpiritType {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.energite, 1);
    }
    
    getDisplayName() {
        return "Energite";
    }
}

class BlockSpiritType extends SimpleSpiritType {
    
    constructor(colorIndex) {
        let tempSprite = new Sprite(blockSpriteSet, 0, colorIndex);
        super([tempSprite], simpleSpiritSerialIntegerSet.block + colorIndex);
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
        return [new RecipeComponent(matteriteSpiritType, 1.5)];
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
        super(tempSpriteList, simpleSpiritSerialIntegerSet.wire + arrangement);
        this.arrangement = arrangement;
    }
    
    getDisplayName() {
        return "Wire";
    }
}

let loadingSpiritType = new LoadingSpiritType();
let loadingSpirit = loadingSpiritType.spirit;
let emptySpiritType = new EmptySpiritType();
let emptySpirit = emptySpiritType.spirit;
new BarrierSpiritType();
let matteriteSpiritType = new MatteriteSpiritType();
new EnergiteSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new BlockSpiritType(colorIndex);
}
for (let arrangement = 0; arrangement < wireArrangementAmount; arrangement++) {
    new WireSpiritType(arrangement);
}

class ComplexSpiritType extends SpiritType {
    
    constructor(spriteList, spiritClassId) {
        super(spriteList);
        this.spiritClassId = spiritClassId;
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
        super([playerSprite], complexSpiritClassIdSet.player);
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
        super([tempSprite], complexSpiritClassIdSet.machine);
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
        return [new RecipeComponent(matteriteSpiritType, 2.25)];
    }
}

class CircuitSpiritType extends ComplexSpiritType {
    
    constructor() {
        let tempSprite = new Sprite(circuitSpriteSet, 0, 0);
        super([tempSprite], complexSpiritClassIdSet.circuit);
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
        return [new RecipeComponent(matteriteSpiritType, 0.75)];
    }
}

new PlayerSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new MachineSpiritType(colorIndex);
}
new CircuitSpiritType();

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


