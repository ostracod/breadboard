
var Pos = require("./pos").Pos;

function TileGrid(width, height, fillTile, outsideTile) {
    this.width = width;
    this.height = height;
    this.outsideTile = outsideTile;
    this.length = this.width * this.height;
    this.tileList = [];
    while (this.tileList.length < this.length) {
        this.tileList.push(fillTile);
    }
}

TileGrid.prototype.convertPosToIndex = function(pos) {
    if (pos.x < 0 || pos.x >= this.width
            || pos.y < 0 || pos.x >= this.height) {
        return null;
    }
    return pos.x + pos.y * this.width;
}

TileGrid.prototype.getTile = function(pos) {
    var index = this.convertPosToIndex(pos);
    if (index === null) {
        return this.outsideTile;
    }
    return this.tileList[index];
}

TileGrid.prototype.setTile = function(pos, tile) {
    var index = this.convertPosToIndex(pos);
    if (index === null) {
        return;
    }
    this.tileList[index] = tile;
}

TileGrid.prototype.getWindowClientJson = function(pos, width, height) {
    var output = [];
    var tempOffset = new Pos(0, 0);
    var tempPos = new Pos(0, 0);
    while (tempOffset.y < height) {
        tempPos.set(pos);
        tempPos.add(tempOffset);
        var tempTile = this.getTile(tempPos);
        output.push(tempTile.getClientJson());
        tempOffset.x += 1;
        if (tempOffset.x >= width) {
            tempOffset.x = 0;
            tempOffset.y += 1;
        }
    }
    return output;
}

TileGrid.prototype.getClientJson = function() {
    return this.getWindowClientJson(new Pos(0, 0), this.width, this.height);
}

module.exports = {
    TileGrid: TileGrid
};


