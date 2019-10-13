
var Tile = require("./tile").Tile;

// type is a number.
function WorldTile(type) {
    this.type = type;
}

WorldTile.prototype = Object.create(Tile.prototype);
WorldTile.prototype.constructor = WorldTile;

function SimpleWorldTile(type) {
    WorldTile.call(this, type);
}

SimpleWorldTile.prototype = Object.create(WorldTile.prototype);
SimpleWorldTile.prototype.constructor = SimpleWorldTile;

SimpleWorldTile.prototype.getClientJson = function() {
    return this.type;
}

var emptyWorldTile = new SimpleWorldTile(0);
var barrierWorldTile = new SimpleWorldTile(1);
var matteriteWorldTile = new SimpleWorldTile(2);
var energiteWorldTile = new SimpleWorldTile(3);

module.exports = {
    emptyWorldTile: emptyWorldTile,
    barrierWorldTile: barrierWorldTile,
    matteriteWorldTile: matteriteWorldTile,
    energiteWorldTile: energiteWorldTile
};


