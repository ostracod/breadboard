
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
}

var world = new World(100, 100);

World.prototype.getClientJson = function(pos, width, height) {
    return this.tileGrid.getWindowClientJson(pos, width, height);
}

module.exports = {
    world: world
};


