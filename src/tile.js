
export class Tile {
    
    // Concrete subclasses of Tile must implement these methods:
    // convertToClientJson, convertToDbJson, getSimpleTileSet, getSimpleTileMap
    
    constructor(spirit, tileComplexity) {
        this.spirit = spirit;
        this.tileComplexity = tileComplexity;
        this.tileComplexity.registerTile(this);
    }
    
    getClientJson() {
        return this.tileComplexity.convertToClientJson(this);
    }
    
    getDbJson() {
        return this.tileComplexity.convertToDbJson(this);
    }
    
    addToGridEvent(tileGrid, pos) {
        this.spirit.setTile(this);
    }
    
    removeFromGridEvent() {
        this.spirit.setTile(null);
    }
    
    moveEvent(pos) {
        // Do nothing.
    }
}

class TileComplexity {
    
    // Concrete subclasses of TileComplexity must implement these methods:
    // convertToClientJson, convertToDbJson
    
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
    
    convertToClientJson(tile) {
        return tile.spirit.serialInteger;
    }
    
    convertToDbJson(tile) {
        return tile.spirit.serialInteger;
    }
}

class ComplexTileComplexity extends TileComplexity {
    
    convertToClientJson(tile) {
        return {
            spirit: tile.spirit.getClientJson()
        };
    }
    
    convertToDbJson(tile) {
        return {
            spirit: tile.spirit.getNestedDbJson()
        };
    }
}

export let simpleTileComplexity = new SimpleTileComplexity();
export let complexTileComplexity = new ComplexTileComplexity();


