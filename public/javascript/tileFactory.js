
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

PlayerWorldTileFactory.prototype.convertJsonToTile = function(data, pos) {
    return new PlayerWorldTile(
        new PlayerSpirit(data.spirit.username),
        pos,
        convertJsonToWalkController(data.walkController)
    );
}

new PlayerWorldTileFactory();

function convertJsonToWorldTile(data, pos) {
    if (typeof data === "number") {
        return simpleWorldTileMap[data];
    } else {
        var tempFactory = complexWorldTileFactoryMap[data.spirit.classId];
        return tempFactory.convertJsonToTile(data, pos);
    }
}


