
class Tile {
    
    // Concrete subclasses of Tile must implement these methods:
    // getSimpleTileSet, getSimpleTileMap
    
    constructor(spirit, tileComplexity) {
        this.spirit = spirit;
        this.tileComplexity = tileComplexity;
        this.tileComplexity.registerTile(this);
    }
    
    addToGridEvent(tileGrid, pos) {
        // Do nothing.
    }
    
    draw(pos, layer) {
        if (layer === 0) {
            for (let sprite of this.spirit.getSprites()) {
                sprite.draw(context, pos, pixelSize);
            }
        }
    }
    
}

class TileComplexity {
    
    registerTile(tile) {
        // Do nothing.
    }
}

class SimpleTileComplexity extends TileComplexity {
    
    registerTile(tile) {
        let tempTileSet = tile.getSimpleTileSet();
        let tempTileMap = tile.getSimpleTileMap();
        let tempSpiritType = tile.spirit.spiritType;
        let tempSerialInteger = tile.spirit.serialInteger;
        tempTileSet[tempSpiritType.baseName] = tile;
        tempTileMap[tempSerialInteger] = tile;
    }
}

class ComplexTileComplexity extends TileComplexity {
    
}

let simpleTileComplexity = new SimpleTileComplexity();
let complexTileComplexity = new ComplexTileComplexity();


