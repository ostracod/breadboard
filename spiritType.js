
// Map from serial integer to SimpleSpiritType.
var simpleSpiritTypeMap = {};

// A SpiritType serves the following purposes:
// > Identify whether a spirit instance matches particular criteria
// > Create new instances of spirits

function SpiritType() {
    
}

// Concrete subclasses of SpiritType must implement these methods:
// getClientJson, craft

function SimpleSpiritType(spirit) {
    SpiritType.call(this);
    this.spirit = spirit;
    simpleSpiritTypeMap[this.spirit.getSerialInteger()] = this;
}

SimpleSpiritType.prototype = Object.create(SpiritType.prototype);
SimpleSpiritType.prototype.constructor = SimpleSpiritType;

SimpleSpiritType.prototype.getClientJson = function() {
    return {
        type: "simple",
        serialInteger: this.spirit.getSerialInteger()
    };
}

SimpleSpiritType.prototype.craft = function() {
    return this.spirit;
}

module.exports = {
    SimpleSpiritType: SimpleSpiritType,
    simpleSpiritTypeMap: simpleSpiritTypeMap
}


