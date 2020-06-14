
class TileGrid {
    
    constructor(outsideTile) {
        this.width = 0;
        this.height = 0;
        this.outsideTile = outsideTile;
        this.length = 0;
        this.tileList = [];
        this.windowOffset = new Pos(0, 0);
    }
    
    convertPosToIndex(pos) {
        let tempPosX = pos.x - this.windowOffset.x;
        let tempPosY = pos.y - this.windowOffset.y;
        if (tempPosX < 0 || tempPosX >= this.width
                || tempPosY < 0 || tempPosY >= this.height) {
            return null;
        }
        return tempPosX + tempPosY * this.width;
    }
    
    getTile(pos) {
        let index = this.convertPosToIndex(pos);
        if (index === null) {
            return this.outsideTile;
        }
        return this.tileList[index];
    }
    
    setTile(pos, tile) {
        let index = this.convertPosToIndex(pos);
        if (index === null) {
            return;
        }
        this.tileList[index] = tile;
        tile.addEvent(pos);
    }
    
    setTiles(tileList, width, height) {
        this.width = width;
        this.height = height;
        this.length = this.width * this.height;
        this.tileList = tileList;
    }
    
    clear() {
        this.setTiles([], 0, 0);
    }
    
    // layer is a number.
    drawLayer(pos, layer) {
        let tempOffset = new Pos(0, 0);
        let tempPos = new Pos(0, 0);
        while (tempOffset.y < canvasTileHeight) {
            tempPos.set(pos);
            tempPos.add(tempOffset);
            let tempTile = this.getTile(tempPos);
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
}


