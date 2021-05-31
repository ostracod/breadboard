
import { TileClientJson, SimpleTileClientJson, ComplexTileClientJson, TileDbJson, SimpleTileDbJson, ComplexTileDbJson } from "./interfaces.js";
import { Pos } from "./pos.js";
import { Spirit, SimpleSpirit } from "./spirit.js";
import { TileGrid } from "./tileGrid.js";

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
    
    addToGridEvent(tileGrid: TileGrid, pos: Pos): void {
        this.tileComplexity.addToGridEvent(tileGrid);
    }
    
    removeFromGridEvent(): void {
        this.tileComplexity.removeFromGridEvent();
    }
    
    moveEvent(pos: Pos): void {
        // Do nothing.
    }
    
    markAsDirty(): void {
        this.tileComplexity.markAsDirty();
    }
    
    abstract getSimpleTileSet(): {[name: string]: Tile<SimpleSpirit>};
    
    abstract getSimpleTileMap(): {[serialInteger: string]: Tile<SimpleSpirit>};
}

abstract class TileComplexity<T extends Spirit = Spirit> {
    
    addToGridEvent(tileGrid: TileGrid): void {
        // Do nothing.
    }
    
    removeFromGridEvent(): void {
        // Do nothing.
    }
    
    markAsDirty(): void {
        // Do nothing.
    }
    
    abstract registerTile(tile: Tile<T>): void;
    
    abstract convertToClientJson(tile: Tile<T>): TileClientJson;
    
    abstract convertToDbJson(tile: Tile<T>): TileDbJson;
}

class SimpleTileComplexity extends TileComplexity<SimpleSpirit> {
    
    registerTile(tile: Tile<SimpleSpirit>): void {
        const tempTileSet = tile.getSimpleTileSet();
        const tempTileMap = tile.getSimpleTileMap();
        const tempSpiritType = tile.spirit.spiritType;
        const tempSerialInteger = tile.spirit.serialInteger;
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

export class ComplexTileComplexity extends TileComplexity {
    
    tile: Tile;
    tileGrid: TileGrid;
    
    registerTile(tile: Tile): void {
        this.tile = tile;
    }
    
    addToGridEvent(tileGrid: TileGrid): void {
        const { spirit } = this.tile;
        spirit.setParentTile(this.tile);
        spirit.changeParentSpirit(tileGrid.parentSpirit);
        this.tileGrid = tileGrid;
    }
    
    removeFromGridEvent(): void {
        const { spirit } = this.tile;
        spirit.setParentTile(null);
        spirit.changeParentSpirit(null);
        this.tileGrid = null;
    }
    
    markAsDirty(): void {
        if (this.tileGrid !== null) {
            this.tileGrid.markAsDirty();
        }
    }
    
    convertToClientJson(tile: Tile): ComplexTileClientJson {
        return {
            spirit: tile.spirit.getClientJson(),
        };
    }
    
    convertToDbJson(tile: Tile): ComplexTileDbJson {
        return {
            spirit: tile.spirit.getNestedDbJson(),
        };
    }
}

export const simpleTileComplexity = new SimpleTileComplexity();


