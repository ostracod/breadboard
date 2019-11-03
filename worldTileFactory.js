
var tempResource = require("./spirit");
var SimpleSpirit = tempResource.SimpleSpirit;
var ComplexSpirit = tempResource.ComplexSpirit;
var complexSpiritClassIdSet = tempResource.complexSpiritClassIdSet;
var tempResource = require("./worldTile");
var simpleWorldTileMap = tempResource.simpleWorldTileMap;
var PlayerWorldTile = tempResource.PlayerWorldTile;

// Map from spirit class ID to ComplexWorldTileFactory.
var complexWorldTileFactoryMap = {};

function ComplexWorldTileFactory(spiritClassId) {
    complexWorldTileFactoryMap[spiritClassId] = this;
}

// Concrete subclasses of ComplexWorldTileFactory must implement these methods:
// createTileWithSpirit

function PlayerWorldTileFactory() {
    ComplexWorldTileFactory.call(this, complexSpiritClassIdSet.player);
}

PlayerWorldTileFactory.prototype = Object.create(ComplexWorldTileFactory.prototype);
PlayerWorldTileFactory.prototype.constructor = PlayerWorldTileFactory;

PlayerWorldTileFactory.prototype.createTileWithSpirit = function(spirit) {
    return new PlayerWorldTile(spirit);
}

new PlayerWorldTileFactory();

function getWorldTileWithSpirit(spirit) {
    if (spirit instanceof SimpleSpirit) {
        return simpleWorldTileMap[spirit.getSerialInteger()];
    }
    if (spirit instanceof ComplexSpirit) {
        var tempFactory = complexWorldTileFactoryMap[spirit.classId];
        return tempFactory.createTileWithSpirit(spirit);
    }
    return null;
}

module.exports = {
    getWorldTileWithSpirit: getWorldTileWithSpirit
};


