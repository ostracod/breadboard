
// Map from spirit class ID to ComplexWorldTileFactory.
var complexWorldTileFactoryMap = {};

function ComplexWorldTileFactory(spiritClassId) {
    complexWorldTileFactoryMap[spiritClassId] = this;
}

// Concrete subclasses of ComplexWorldTileFactory must implement these methods:
// convertJsonToTile

function PlayerWorldTileFactory() {
    ComplexWorldTileFactory.call(this, complexSpiritClassIdSet.player);
}

PlayerWorldTileFactory.prototype = Object.create(ComplexWorldTileFactory.prototype);
PlayerWorldTileFactory.prototype.constructor = PlayerWorldTileFactory;

PlayerWorldTileFactory.prototype.convertJsonToTile = function(data, spirit, pos) {
    var tempController = convertJsonToWalkController(data.walkController);
    return new PlayerWorldTile(spirit, pos, tempController);
}

new PlayerWorldTileFactory();

function convertJsonToWorldTile(data, pos) {
    if (typeof data === "number") {
        return simpleWorldTileMap[data];
    } else {
        var tempFactory = complexWorldTileFactoryMap[data.spirit.classId];
        var tempSpirit = convertJsonToSpirit(data.spirit);
        return tempFactory.convertJsonToTile(data, tempSpirit, pos);
    }
}


