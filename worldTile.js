
var Tile = require("./tile").Tile;
var tempResource = require("./spirit");
var EmptySpirit = tempResource.EmptySpirit;
var emptySpirit = tempResource.emptySpirit;
var barrierSpirit = tempResource.barrierSpirit;
var matteriteSpirit = tempResource.matteriteSpirit;
var energiteSpirit = tempResource.energiteSpirit;

// Map from spirit serial integer to WorldTile.
var simpleWorldTileMap = {};

function WorldTile(spirit) {
    Tile.call(this, spirit);
}

WorldTile.prototype = Object.create(Tile.prototype);
WorldTile.prototype.constructor = WorldTile;

WorldTile.prototype.addEvent = function(world, pos) {
    // Do nothing.
}

WorldTile.prototype.removeEvent = function() {
    // Do nothing.
}

WorldTile.prototype.moveEvent = function(pos) {
    // Do nothing.
}

WorldTile.prototype.canBeMined = function() {
    return this.spirit.canBeMined();
}

function SimpleWorldTile(simpleSpirit) {
    WorldTile.call(this, simpleSpirit);
    var tempSerialInteger = this.spirit.getSerialInteger();
    simpleWorldTileMap[tempSerialInteger] = this;
}

SimpleWorldTile.prototype = Object.create(WorldTile.prototype);
SimpleWorldTile.prototype.constructor = SimpleWorldTile;

SimpleWorldTile.prototype.getClientJson = function() {
    return this.spirit.getClientJson();
}

var emptyWorldTile = new SimpleWorldTile(emptySpirit);
var barrierWorldTile = new SimpleWorldTile(barrierSpirit);
var matteriteWorldTile = new SimpleWorldTile(matteriteSpirit);
var energiteWorldTile = new SimpleWorldTile(energiteSpirit);

function ComplexWorldTile(spirit) {
    WorldTile.call(this, spirit);
    this.world = null;
    this.pos = null;
}

ComplexWorldTile.prototype = Object.create(WorldTile.prototype);
ComplexWorldTile.prototype.constructor = ComplexWorldTile;

ComplexWorldTile.prototype.getClientJson = function() {
    return {
        spirit: this.spirit.getClientJson()
    };
}

ComplexWorldTile.prototype.addEvent = function(world, pos) {
    WorldTile.prototype.addEvent.call(this, world, pos);
    this.world = world;
    this.pos = pos.copy();
}

ComplexWorldTile.prototype.removeEvent = function() {
    WorldTile.prototype.removeEvent.call(this);
    this.world = null;
    this.pos = null;
}

ComplexWorldTile.prototype.moveEvent = function(pos) {
    WorldTile.prototype.moveEvent.call(this, pos);
    this.pos.set(pos);
}

ComplexWorldTile.prototype.addToWorld = function(world, pos) {
    world.setTile(pos, this);
}

ComplexWorldTile.prototype.removeFromWorld = function() {
    this.world.setTile(this.pos, emptyWorldTile);
}

ComplexWorldTile.prototype.move = function(offset) {
    var tempNextPos = this.pos.copy();
    tempNextPos.add(offset);
    var tempTile = this.world.getTile(tempNextPos);
    if (!(tempTile.spirit instanceof EmptySpirit)) {
        return false;
    }
    this.world.swapTiles(this.pos, tempNextPos);
    return true;
}

function TimeBudget(maximumTime) {
    this.maximumTime = maximumTime;
    this.time = this.maximumTime;
    this.lastTimestamp = Date.now() / 1000;
}

TimeBudget.prototype.spendTime = function(amount) {
    
    // Update the amount of time we can spend.
    var tempTimestamp = Date.now() / 1000;
    this.time += tempTimestamp - this.lastTimestamp;
    if (this.time > this.maximumTime) {
        this.time = this.maximumTime;
    }
    this.lastTimestamp = tempTimestamp;
    
    // Determine if we have enough time to spend.
    if (this.time <= 0) {
        return false
    }
    
    // Spend the time.
    this.time -= amount;
    return true;
}

function PlayerWorldTile(playerSpirit) {
    ComplexWorldTile.call(this, playerSpirit);
    this.walkControllerData = null;
    this.walkTimeBudget = new TimeBudget(6);
    this.mineTimeBudget = new TimeBudget(6);
}

PlayerWorldTile.prototype = Object.create(ComplexWorldTile.prototype);
PlayerWorldTile.prototype.constructor = PlayerWorldTile;

PlayerWorldTile.prototype.getClientJson = function() {
    var output = ComplexWorldTile.prototype.getClientJson.call(this);
    output.walkController = this.walkControllerData;
    return output;
}

PlayerWorldTile.prototype.addEvent = function(world, pos) {
    ComplexWorldTile.prototype.addEvent.call(this, world, pos);
    this.world.playerTileList.push(this);
}

PlayerWorldTile.prototype.removeEvent = function() {
    var tempWorld = this.world;
    ComplexWorldTile.prototype.removeEvent.call(this);
    var index = tempWorld.findPlayerTile(this.spirit.player);
    tempWorld.playerTileList.splice(index, 1);
}

PlayerWorldTile.prototype.walk = function(offset) {
    var tempResult = this.walkTimeBudget.spendTime(0.08);
    if (!tempResult) {
        return;
    }
    this.move(offset);
}

PlayerWorldTile.prototype.mine = function(pos) {
    var tempResult = this.mineTimeBudget.spendTime(1.44);
    if (!tempResult) {
        return null;
    }
    var tempTile = this.world.getTile(pos);
    if (!tempTile.canBeMined()) {
        return null;
    }
    this.world.setTile(pos, emptyWorldTile);
    return this.spirit.inventory.incrementItemCountBySpirit(tempTile.spirit);
}

PlayerWorldTile.prototype.placeWorldTile = function(pos, spiritReference) {
    var tempTile = this.world.getTile(pos);
    if (!(tempTile.spirit instanceof EmptySpirit)) {
        return null;
    }
    var tempItem = this.spirit.inventory.getItemBySpiritReference(spiritReference);
    if (tempItem === null) {
        return null;
    }
    if (tempItem.count < 1) {
        return null;
    }
    tempItem.setCount(tempItem.count - 1);
    var tempTile = getWorldTileWithSpirit(tempItem.spirit);
    this.world.setTile(pos, tempTile);
    return tempItem;
}

module.exports = {
    PlayerWorldTile: PlayerWorldTile,
    
    emptyWorldTile: emptyWorldTile,
    barrierWorldTile: barrierWorldTile,
    matteriteWorldTile: matteriteWorldTile,
    energiteWorldTile: energiteWorldTile,
    
    simpleWorldTileMap: simpleWorldTileMap
};

var getWorldTileWithSpirit = require("./worldTileFactory").getWorldTileWithSpirit;


