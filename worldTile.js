
var Tile = require("./tile").Tile;

var worldTileTypeSet = {
    empty: 0,
    barrier: 1,
    matterite: 2,
    energite: 3,
    player: 4
}

// type is a number.
function WorldTile(type) {
    this.type = type;
}

WorldTile.prototype = Object.create(Tile.prototype);
WorldTile.prototype.constructor = WorldTile;

WorldTile.prototype.addEvent = function(world, pos) {
    // Do nothing.
}

WorldTile.prototype.removeEvent = function() {
    // Do nothing.
}

function SimpleWorldTile(type) {
    WorldTile.call(this, type);
}

SimpleWorldTile.prototype = Object.create(WorldTile.prototype);
SimpleWorldTile.prototype.constructor = SimpleWorldTile;

SimpleWorldTile.prototype.getClientJson = function() {
    return this.type;
}

var barrierWorldTile = new SimpleWorldTile(worldTileTypeSet.barrier);
var matteriteWorldTile = new SimpleWorldTile(worldTileTypeSet.matterite);
var energiteWorldTile = new SimpleWorldTile(worldTileTypeSet.energite);

function EmptyWorldTile() {
    SimpleWorldTile.call(this, worldTileTypeSet.empty);
}

EmptyWorldTile.prototype = Object.create(SimpleWorldTile.prototype);
EmptyWorldTile.prototype.constructor = EmptyWorldTile;

var emptyWorldTile = new EmptyWorldTile();

function ComplexWorldTile(type) {
    WorldTile.call(this, type);
    this.world = null;
    this.pos = null;
}

ComplexWorldTile.prototype = Object.create(WorldTile.prototype);
ComplexWorldTile.prototype.constructor = ComplexWorldTile;

ComplexWorldTile.prototype.getClientJson = function() {
    return {
        type: this.type
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

ComplexWorldTile.prototype.addToWorld = function(world, pos) {
    world.setTile(pos, this);
}

ComplexWorldTile.prototype.removeFromWorld = function() {
    this.world.setTile(this.pos, emptyWorldTile);
}

function PlayerWorldTile(player) {
    ComplexWorldTile.call(this, worldTileTypeSet.player);
    this.player = player;
}

PlayerWorldTile.prototype = Object.create(ComplexWorldTile.prototype);
PlayerWorldTile.prototype.constructor = PlayerWorldTile;

PlayerWorldTile.prototype.getClientJson = function() {
    var output = ComplexWorldTile.prototype.getClientJson.call(this);
    output.username = this.player.username;
    return output;
}

PlayerWorldTile.prototype.addEvent = function(world, pos) {
    ComplexWorldTile.prototype.addEvent.call(this, world, pos);
    this.world.playerTileList.push(this);
}

PlayerWorldTile.prototype.removeEvent = function() {
    var tempWorld = this.world;
    ComplexWorldTile.prototype.removeEvent.call(this);
    var index = tempWorld.findPlayerTile(this.player);
    tempWorld.playerTileList.splice(index, 1);
}

module.exports = {
    worldTileTypeSet: worldTileTypeSet,
    emptyWorldTile: emptyWorldTile,
    barrierWorldTile: barrierWorldTile,
    matteriteWorldTile: matteriteWorldTile,
    energiteWorldTile: energiteWorldTile,
    EmptyWorldTile: EmptyWorldTile,
    PlayerWorldTile: PlayerWorldTile
};


