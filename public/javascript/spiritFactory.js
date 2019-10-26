
// Map from spirit class ID to ComplexSpiritFactory.
var complexSpiritFactoryMap = {};

function ComplexSpiritFactory(spiritClassId) {
    complexSpiritFactoryMap[spiritClassId] = this;
}

// Concrete subclasses of ComplexSpiritFactory must implement these methods:
// convertJsonToSpirit

function PlayerSpiritFactory() {
    ComplexSpiritFactory.call(this, complexSpiritClassIdSet.player);
}

PlayerSpiritFactory.prototype = Object.create(ComplexSpiritFactory.prototype);
PlayerSpiritFactory.prototype.constructor = PlayerSpiritFactory;

PlayerSpiritFactory.prototype.convertJsonToSpirit = function(data) {
    return new PlayerSpirit(data.id, data.username);
}

new PlayerSpiritFactory();

function convertJsonToSpirit(data) {
    if (typeof data === "number") {
        return simpleSpiritMap[data];
    } else {
        var tempFactory = complexSpiritFactoryMap[data.classId];
        return tempFactory.convertJsonToSpirit(data);
    }
}


