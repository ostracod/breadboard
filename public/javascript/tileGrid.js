
var worldTileGrid;

function TileGrid(outsideTile) {
    this.width = 0;
    this.height = 0;
    this.outsideTile = outsideTile;
    this.length = 0;
    this.tileList = [];
    this.windowOffset = new Pos(0, 0);
}

TileGrid.prototype.convertPosToIndex = function(pos) {
    var tempPosX = pos.x - this.windowOffset.x;
    var tempPosY = pos.y - this.windowOffset.y;
    if (tempPosX < 0 || tempPosX >= this.width
            || tempPosY < 0 || tempPosY >= this.height) {
        return null;
    }
    return tempPosX + tempPosY * this.width;
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

TileGrid.prototype.setTiles = function(tileList, width, height) {
    this.width = width;
    this.height = height;
    this.length = this.width * this.height;
    this.tileList = tileList;
}

// layer is a number.
TileGrid.prototype.drawLayer = function(pos, layer) {
    var tempOffset = new Pos(0, 0);
    var tempPos = new Pos(0, 0);
    while (tempOffset.y < canvasTileHeight) {
        tempPos.set(pos);
        tempPos.add(tempOffset);
        var tempTile = this.getTile(tempPos);
        tempPos.set(tempOffset);
        tempPos.scale(spriteSize);
        tempTile.draw(tempPos, layer);
        tempOffset.x += 1;
        if (tempOffset.x >= canvasTileWidth) {
            tempOffset.x = 0;
            tempOffset.y += 1;
        }
    }
}

worldTileGrid = new TileGrid(loadingWorldTile);

