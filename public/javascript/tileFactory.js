
// Map from spirit class ID to ComplexWorldTileFactory.
var complexWorldTileFactoryMap = {};

function ComplexWorldTileFactory(spiritClassId) {
    complexWorldTileFactoryMap[spiritClassId] = this;
}

// Concrete subclasses of ComplexWorldTileFactory must implement these methods:
// convertJsonToTile, createTileWithSpirit

function PlayerWorldTileFactory() {
    ComplexWorldTileFactory.call(this, complexSpiritClassIdSet.player);
}

PlayerWorldTileFactory.prototype = Object.create(ComplexWorldTileFactory.prototype);
PlayerWorldTileFactory.prototype.constructor = PlayerWorldTileFactory;

PlayerWorldTileFactory.prototype.convertJsonToTile = function(data, spirit, pos) {
    var tempController = convertJsonToWalkController(data.walkController);
    return new PlayerWorldTile(spirit, pos, tempController);
}

PlayerWorldTileFactory.prototype.createTileWithSpirit = function(spirit, pos) {
    var tempController = createDefaultWalkController();
    return new PlayerWorldTile(spirit, pos, tempController);
}

new PlayerWorldTileFactory();

function getWorldTileWithSpirit(spirit, pos) {
    if (spirit instanceof SimpleSpirit) {
        return simpleWorldTileMap[spirit.getSerialInteger()];
    }
    if (spirit instanceof ComplexSpirit) {
        var tempFactory = complexWorldTileFactoryMap[spirit.classId];
        return tempFactory.createTileWithSpirit(spirit, pos);
    }
    return null;
}

function convertJsonToWorldTile(data, pos) {
    if (typeof data === "number") {
        return simpleWorldTileMap[data];
    } else {
        var tempSpirit = convertJsonToSpirit(data.spirit);
        var tempFactory = complexWorldTileFactoryMap[tempSpirit.classId];
        return tempFactory.convertJsonToTile(data, tempSpirit, pos);
    }
}


