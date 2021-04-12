
import {TileClientJson, SimpleTileClientJson, ComplexTileClientJson, TileDbJson, SimpleTileDbJson, ComplexTileDbJson} from "./interfaces.js";
import {Pos} from "./pos.js";
import {Spirit, SimpleSpirit, ComplexSpirit} from "./spirit.js";
import {TileGrid} from "./tileGrid.js";

export abstract class Tile<T extends Spirit = Spirit> {
    
    spirit: T;
    tileComplexity: TileComplexity;
    
    constructor(spirit: T, tileComplexity: TileComplexity) {
        this.spirit = spirit;
        this.tileComplexity = tileComplexity;
        this.tileComplexity.registerTile(this);
    }
    
    getClientJson(): TileClientJson {
        return this.tileComplexity.convertToClientJson(this);
    }
    
    getDbJson(): TileDbJson {
        return this.tileComplexity.convertToDbJson(this);
    }
    
    addToGridEvent(tileGrid: TileGrid, pos: Pos) {
        this.spirit.setParentTile(this);
        this.spirit.changeParentSpirit(tileGrid.parentSpirit);
    }
    
    removeFromGridEvent(): void {
        this.spirit.setParentTile(null);
        this.spirit.changeParentSpirit(null);
    }
    
    moveEvent(pos: Pos): void {
        // Do nothing.
    }
    
    abstract getSimpleTileSet(): {[name: string]: Tile<SimpleSpirit>};
    
    abstract getSimpleTileMap(): {[serialInteger: string]: Tile<SimpleSpirit>};
}

abstract class TileComplexity<T extends Spirit = Spirit> {
    
    registerTile(tile: Tile<T>) {
        // Do nothing.
    }
    
    abstract convertToClientJson(tile: Tile<T>): TileClientJson;
    
    abstract convertToDbJson(tile: Tile<T>): TileDbJson;
}

class SimpleTileComplexity extends TileComplexity<SimpleSpirit> {
    
    registerTile(tile: Tile<SimpleSpirit>) {
        let tempTileSet = tile.getSimpleTileSet();
        let tempTileMap = tile.getSimpleTileMap();
        let tempSpiritType = tile.spirit.spiritType;
        let tempSerialInteger = tile.spirit.serialInteger;
        tempTileSet[tempSpiritType.baseName] = tile;
        tempTileMap[tempSerialInteger] = tile;
    }
    
    convertToClientJson(tile: Tile<SimpleSpirit>): SimpleTileClientJson {
        return tile.spirit.serialInteger;
    }
    
    convertToDbJson(tile: Tile<SimpleSpirit>): SimpleTileDbJson {
        return tile.spirit.serialInteger;
    }
}

class ComplexTileComplexity extends TileComplexity<ComplexSpirit> {
    
    convertToClientJson(tile: Tile<ComplexSpirit>): ComplexTileClientJson {
        return {
            spirit: tile.spirit.getClientJson()
        };
    }
    
    convertToDbJson(tile: Tile<ComplexSpirit>): ComplexTileDbJson {
        return {
            spirit: tile.spirit.getNestedDbJson()
        };
    }
}

export let simpleTileComplexity = new SimpleTileComplexity();
export let complexTileComplexity = new ComplexTileComplexity();


