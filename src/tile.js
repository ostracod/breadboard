
export class Tile {
    
    constructor(spirit, tileConverter) {
        this.spirit = spirit;
        this.tileConverter = tileConverter;
    }
    
    getClientJson() {
        return this.tileConverter.convertToClientJson(this);
    }
    
    getDbJson() {
        return this.tileConverter.convertToDbJson(this);
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

class TileConverter {
    
    // Concrete subclasses of TileConverter must implement these methods:
    // convertToClientJson, convertToDbJson
    
}

class SimpleTileConverter extends TileConverter {
    
    convertToClientJson(tile) {
        return tile.spirit.serialInteger;
    }
    
    convertToDbJson(tile) {
        return tile.spirit.serialInteger;
    }
}

class ComplexTileConverter extends TileConverter {
    
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

export let simpleTileConverter = new SimpleTileConverter();
export let complexTileConverter = new ComplexTileConverter();


