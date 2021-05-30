
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
            for (const sprite of this.spirit.getSprites()) {
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
        const tempTileSet = tile.getSimpleTileSet();
        const tempTileMap = tile.getSimpleTileMap();
        const tempSpiritType = tile.spirit.spiritType;
        const tempSerialInteger = tile.spirit.serialInteger;
        tempTileSet[tempSpiritType.baseName] = tile;
        tempTileMap[tempSerialInteger] = tile;
    }
}

class ComplexTileComplexity extends TileComplexity {
    
}

const simpleTileComplexity = new SimpleTileComplexity();
const complexTileComplexity = new ComplexTileComplexity();


