
// Map from spirit serial integer to SimpleSpiritType.
let simpleSpiritTypeMap = {};
// Map from spirit class ID to list of ComplexSpiritType.
let complexSpiritTypeMap = {};

// TODO: Associate SpiritType with each Spirit so that we may
// get sprite and display name without invoking craft method.

class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpirit, matchesSpiritJson, matchesJson, convertJsonToSpirit
    
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
    
    matchesSpiritJson(data) {
        return (typeof data === "number" && this.spirit.serialInteger === data);
    }
    
    matchesJson(data) {
        return (data.type === "simple" && this.spirit.serialInteger === data.serialInteger);
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
        if (!(this.spiritClassId in complexSpiritTypeMap)) {
            complexSpiritTypeMap[this.spiritClassId] = [];
        }
        complexSpiritTypeMap[this.spiritClassId].push(this);
    }
    
    matchesSpirit(spirit) {
        return (spirit instanceof ComplexSpirit
            && this.spiritClassId === spirit.classId);
    }
    
    matchesSpiritJson(data) {
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

    convertJsonToSpirit(data) {
        return new PlayerSpirit(data.id, data.username);
    }
}

class MachineSpiritType extends ComplexSpiritType {
    
    constructor(colorIndex) {
        super(complexSpiritClassIdSet.machine);
        this.colorIndex = colorIndex;
    }
    
    matchesSpirit(spirit) {
        return (super.matchesSpirit(spirit) && this.colorIndex === spirit.colorIndex);
    }
    
    matchesSpiritJson(data) {
        return (super.matchesSpiritJson(data) && this.colorIndex === data.colorIndex);
    }
    
    matchesJson(data) {
        return (super.matchesJson(data) && this.colorIndex === data.colorIndex);
    }
    
    convertJsonToSpirit(data) {
        return new MachineSpirit(data.id, this.colorIndex);
    }
    
    craft() {
        return new MachineSpirit(null, this.colorIndex);
    }
}

new PlayerSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new MachineSpiritType(colorIndex);
}

function convertJsonToSpirit(data) {
    let tempType;
    if (typeof data === "number") {
        tempType = simpleSpiritTypeMap[data];
    } else {
        let tempTypeList = complexSpiritTypeMap[data.classId];
        for (let spiritType of tempTypeList) {
            if (spiritType.matchesSpiritJson(data)) {
                tempType = spiritType;
                break;
            }
        }
    }
    return tempType.convertJsonToSpirit(data);
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


