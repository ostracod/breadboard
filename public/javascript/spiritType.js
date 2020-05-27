
let simpleSpiritSet = [];
// Map from spirit serial integer to SimpleSpiritType.
let simpleSpiritTypeMap = {};
// Map from spirit class ID to list of ComplexSpiritType.
let complexSpiritTypeMap = {};

class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpiritClientJson, matchesJson, convertClientJsonToSpirit, craft,
    // getSprite, getDisplayName
    
    constructor() {
    
    }
    
    matchesSpirit(spirit) {
        return (spirit.spiritType === this);
    }
    
    canBeMined() {
        return false;
    }
}

class SimpleSpiritType extends SpiritType {
    
    constructor(serialInteger) {
        super();
        this.serialInteger = serialInteger;
        this.spirit = new SimpleSpirit(this);
        simpleSpiritSet.push(this.spirit);
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
        super(simpleSpiritSerialIntegerSet.loading);
    }
    
    getSprite() {
        return loadingSprite;
    }
    
    getDisplayName() {
        return "Loading";
    }
}

class EmptySpiritType extends SimpleSpiritType {
    
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

class BarrierSpiritType extends SimpleSpiritType {
    
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

class ResourceSpiritType extends SimpleSpiritType {
    
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

let loadingSpiritType = new LoadingSpiritType();
let loadingSpirit = loadingSpiritType.spirit;
let emptySpiritType = new EmptySpiritType();
let emptySpirit = emptySpiritType.spirit;
new BarrierSpiritType();
new MatteriteSpiritType();
new EnergiteSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new BlockSpiritType(colorIndex);
}

class ComplexSpiritType extends SpiritType {
    
    constructor(spiritClassId) {
        super();
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
        super(complexSpiritClassIdSet.player);
    }
    
    convertClientJsonToSpirit(data) {
        return new PlayerSpirit(this, data.id, data.username);
    }
    
    craft() {
        throw new Error("Cannot craft player.");
    }
    
    getSprite() {
        return playerSprite;
    }
    
    getDisplayName() {
        return "Player";
    }
}

class MachineSpiritType extends ComplexSpiritType {
    
    constructor(colorIndex) {
        super(complexSpiritClassIdSet.machine);
        this.colorIndex = colorIndex;
        this.sprite = new Sprite(machineSpriteSet, 0, this.colorIndex);
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
    
    getSprite() {
        return this.sprite;
    }
    
    getDisplayName() {
        return this.color.name + " Machine";
    }
    
    canBeMined() {
        return true;
    }
}

new PlayerSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new MachineSpiritType(colorIndex);
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


