
var Pos = require("./pos").Pos;
var TileGrid = require("./tileGrid").TileGrid;

var tempResource = require("./worldTile");
var emptyWorldTile = tempResource.emptyWorldTile;
var barrierWorldTile = tempResource.barrierWorldTile;
var matteriteWorldTile = tempResource.matteriteWorldTile;
var energiteWorldTile = tempResource.energiteWorldTile;

function World(width, height) {
    this.width = width;
    this.height = height;
    this.tileGrid = new TileGrid(
        this.width,
        this.height,
        emptyWorldTile,
        barrierWorldTile
    );
    var tempCount = 0;
    while (tempCount < 300) {
        var tempTile;
        if (Math.random() < 0.5) {
            tempTile = matteriteWorldTile;
        } else {
            tempTile = energiteWorldTile;
        }
        var tempPos = new Pos(
            Math.floor(Math.random() * this.width),
            Math.floor(Math.random() * this.height)
        );
        this.tileGrid.setTile(tempPos, tempTile);
        tempCount += 1;
    }
    this.playerTileList = [];
}

var world = new World(100, 100);

World.prototype.getTile = function(pos) {
    return this.tileGrid.getTile(pos);
}

World.prototype.setTile = function(pos, tile) {
    var tempOldTile = this.tileGrid.getTile(pos);
    this.tileGrid.setTile(pos, tile);
    tempOldTile.removeEvent();
    tile.addEvent(this, pos);
}

World.prototype.swapTiles = function(pos1, pos2) {
    var tempTile1 = this.tileGrid.getTile(pos1);
    var tempTile2 = this.tileGrid.getTile(pos2);
    this.tileGrid.setTile(pos2, tempTile1);
    this.tileGrid.setTile(pos1, tempTile2);
    tempTile1.moveEvent(pos2);
    tempTile2.moveEvent(pos1);
}

World.prototype.getClientJson = function(pos, width, height) {
    return this.tileGrid.getWindowClientJson(pos, width, height);
}

World.prototype.findPlayerTile = function(player) {
    var index = 0;
    while (index < this.playerTileList.length) {
        var tempTile = this.playerTileList[index];
        if (tempTile.player.username == player.username) {
            return index;
        }
        index += 1;
    }
    return -1;
}

World.prototype.getPlayerTile = function(player) {
    var index = this.findPlayerTile(player);
    return this.playerTileList[index];
}

World.prototype.tick = function() {
    // TODO: Put something here.
    
}

module.exports = {
    world: world
};


