
// Map from spirit serial integer to SimpleSpiritType.
let simpleSpiritTypeMap = {};
// Map from spirit class ID to ComplexSpiritType.
let complexSpiritTypeMap = {};

class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpirit, convertJsonToSpirit
    
    craft() {
        return null;
    }
}

class SimpleSpiritType extends SpiritType {
    
    constructor(spirit) {
        super();
        this.spirit = spirit;
        simpleSpiritTypeMap[this.spirit.serialInteger] = this;
    }
    
    matchesSpirit(spirit) {
        return (spirit instanceof SimpleSpirit
            && this.spirit.serialInteger === spirit.serialInteger);
    }
    
    convertJsonToSpirit(data) {
        return this.spirit;
    }
    
    craft() {
        return this.spirit;
    }
}

class ComplexSpiritType extends SpiritType {
    
    constructor(spiritClassId) {
        super();
        this.spiritClassId = spiritClassId;
        complexSpiritTypeMap[this.spiritClassId] = this;
    }
    
    matchesSpirit(spirit) {
        return (spirit instanceof ComplexSpirit
            && this.spiritClassId === spirit.classId);
    }
}

class PlayerSpiritType extends ComplexSpiritType {
    
    constructor() {
        super(complexSpiritClassIdSet.player);
    }

    convertJsonToSpirit(data) {
        return new PlayerSpirit(data.id, data.username);
    }
}

new PlayerSpiritType();

function convertJsonToSpirit(data) {
    let tempType;
    if (typeof data === "number") {
        tempType = simpleSpiritTypeMap[data];
    } else {
        tempType = complexSpiritTypeMap[data.classId];
    }
    return tempType.convertJsonToSpirit(data);
}

function convertJsonToSpiritType(data) {
    if (data.type == "simple") {
        return simpleSpiritTypeMap[data.serialInteger];
    }
    if (data.type == "complex") {
        return complexSpiritTypeMap[data.classId];
    }
    return null;
}


