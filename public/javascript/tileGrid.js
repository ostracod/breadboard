
class TileGrid {
    
    constructor(tileFactory) {
        this.tileFactory = tileFactory;
        this.width = 0;
        this.height = 0;
        this.outsideTile = this.tileFactory.getTileWithSpirit(simpleSpiritSet.loading);
        this.length = 0;
        this.tileList = [];
        this.windowOffset = new Pos(0, 0);
    }
    
    convertPosToIndex(pos) {
        const tempPosX = pos.x - this.windowOffset.x;
        const tempPosY = pos.y - this.windowOffset.y;
        if (tempPosX < 0 || tempPosX >= this.width
                || tempPosY < 0 || tempPosY >= this.height) {
            return null;
        }
        return tempPosX + tempPosY * this.width;
    }
    
    advancePos(pos) {
        pos.x += 1;
        if (pos.x >= this.width) {
            pos.x = 0;
            pos.y += 1;
        }
    }
    
    getTile(pos) {
        const index = this.convertPosToIndex(pos);
        if (index === null) {
            return this.outsideTile;
        }
        return this.tileList[index];
    }
    
    setTile(pos, tile) {
        const index = this.convertPosToIndex(pos);
        if (index === null) {
            return;
        }
        this.tileList[index] = tile;
        tile.addToGridEvent(this, pos);
    }
    
    setTiles(tileList, width, height) {
        this.width = width;
        this.height = height;
        this.length = this.width * this.height;
        this.tileList = tileList;
        const tempOffset = new Pos(0, 0);
        const tempPos = new Pos(0, 0);
        for (const tile of this.tileList) {
            tempPos.set(this.windowOffset);
            tempPos.add(tempOffset);
            tile.addToGridEvent(this, tempPos);
            this.advancePos(tempOffset);
        }
    }
    
    clear() {
        this.setTiles([], 0, 0);
    }
    
    // layer is a number.
    drawLayer(pos, layer) {
        const tempOffset = new Pos(0, 0);
        const tempPos = new Pos(0, 0);
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


