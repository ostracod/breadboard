
// Map from spirit serial integer to SimpleSpiritType.
var simpleSpiritTypeMap = {};
// Map from spirit class ID to ComplexSpiritType.
var complexSpiritTypeMap = {};

function SpiritType() {
    
}

SpiritType.prototype.craft = function() {
    return null;
}

// Concrete subclasses of SpiritType must implement these methods:
// matchesSpirit, convertJsonToSpirit

function SimpleSpiritType(spirit) {
    SpiritType.call(this);
    this.spirit = spirit;
    simpleSpiritTypeMap[this.spirit.getSerialInteger()] = this;
}

SimpleSpiritType.prototype = Object.create(SpiritType.prototype);
SimpleSpiritType.prototype.constructor = SimpleSpiritType;

SimpleSpiritType.prototype.matchesSpirit = function(spirit) {
    return (this.spirit.getSerialInteger() == spirit.getSerialInteger());
}

SimpleSpiritType.prototype.convertJsonToSpirit = function(data) {
    return this.spirit;
}

SimpleSpiritType.prototype.craft = function() {
    return this.spirit;
}

function ComplexSpiritType(spiritClassId) {
    SpiritType.call(this);
    this.spiritClassId = spiritClassId;
    complexSpiritTypeMap[spiritClassId] = this;
}

ComplexSpiritType.prototype = Object.create(SpiritType.prototype);
ComplexSpiritType.prototype.constructor = ComplexSpiritType;

ComplexSpiritType.prototype.matchesSpirit = function(spirit) {
    return (this.spiritClassId == spirit.classId);
}

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


