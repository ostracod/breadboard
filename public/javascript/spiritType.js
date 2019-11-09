
// Map from spirit serial integer to SimpleSpiritType.
var simpleSpiritTypeMap = {};
// Map from spirit class ID to ComplexSpiritType.
var complexSpiritTypeMap = {};

function SpiritType() {
    
}

// Concrete subclasses of SpiritType must implement these methods:
// convertJsonToSpirit

function SimpleSpiritType(spirit) {
    SpiritType.call(this);
    this.spirit = this;
    simpleSpiritTypeMap[this.spirit.getSerialInteger()] = this;
}

SimpleSpiritType.prototype = Object.create(SpiritType.prototype);
SimpleSpiritType.prototype.constructor = SimpleSpiritType;

SimpleSpiritType.prototype.convertJsonToSpirit = function(data) {
    return this.spirit;
}

function ComplexSpiritType(spiritClassId) {
    SpiritType.call(this);
    complexSpiritTypeMap[spiritClassId] = this;
}

ComplexSpiritType.prototype = Object.create(SpiritType.prototype);
ComplexSpiritType.prototype.constructor = ComplexSpiritType;

function PlayerSpiritType() {
    ComplexSpiritType.call(this, complexSpiritClassIdSet.player);
}

PlayerSpiritType.prototype = Object.create(ComplexSpiritType.prototype);
PlayerSpiritType.prototype.constructor = PlayerSpiritType;

PlayerSpiritType.prototype.convertJsonToSpirit = function(data) {
    return new PlayerSpirit(data.id, data.username);
}

new PlayerSpiritType();

function convertJsonToSpirit(data) {
    var tempType;
    if (typeof data === "number") {
        tempType = simpleSpiritTypeMap[data];
        return simpleSpiritMap[data];
    } else {
        tempType = complexSpiritTypeMap[data.classId];
    }
    return tempType.convertJsonToSpirit(data);
}


