
import {TileClientJson, SimpleTileClientJson, ComplexTileClientJson} from "./interfaces.js";
import {Spirit} from "./spirit.js";

export abstract class Tile {
    
    spirit: Spirit;
    tileComplexity: TileComplexity;
    
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
        this.spirit.setParentTile(this);
        this.spirit.changeParentSpirit(tileGrid.parentSpirit);
    }
    
    removeFromGridEvent() {
        this.spirit.setParentTile(null);
        this.spirit.changeParentSpirit(null);
    }
    
    moveEvent(pos) {
        // Do nothing.
    }
    
    abstract getSimpleTileSet();
    
    abstract getSimpleTileMap();
}

abstract class TileComplexity {
    
    registerTile(tile) {
        // Do nothing.
    }
    
    abstract convertToClientJson(tile): TileClientJson;
    
    abstract convertToDbJson(tile);
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
    
    convertToClientJson(tile): SimpleTileClientJson {
        return tile.spirit.serialInteger;
    }
    
    convertToDbJson(tile) {
        return tile.spirit.serialInteger;
    }
}

class ComplexTileComplexity extends TileComplexity {
    
    convertToClientJson(tile): ComplexTileClientJson {
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


