
import { ChipCircuitTileClientJson, ChipCircuitTileDbJson } from "./interfaces.js";
import { simpleCircuitTileSet, simpleCircuitTileMap } from "./globalData.js";
import { Spirit, SimpleSpirit } from "./spirit.js";
import { Tile, simpleTileComplexity, ComplexTileComplexity } from "./tile.js";
import { LogicSpirit } from "./logicSpirit.js";

export class CircuitTile<T extends Spirit = Spirit> extends Tile<T> {
    
    getSimpleTileSet(): {[name: string]: CircuitTile<SimpleSpirit>} {
        return simpleCircuitTileSet;
    }
    
    getSimpleTileMap(): {[serialInteger: string]: CircuitTile<SimpleSpirit>} {
        return simpleCircuitTileMap;
    }
}

export class SimpleCircuitTile extends CircuitTile<SimpleSpirit> {
    
    constructor(spirit: SimpleSpirit) {
        super(spirit, simpleTileComplexity);
    }
}

export class ComplexCircuitTile<T extends Spirit = Spirit> extends CircuitTile<T> {
    
    constructor(spirit: T) {
        super(spirit, new ComplexTileComplexity());
    }
}

export class ChipCircuitTile extends ComplexCircuitTile<LogicSpirit> {
    
    sidePortIndexes: number[];
    
    constructor(logicSpirit: LogicSpirit, sidePortIndexes = [null, null, null, null]) {
        super(logicSpirit);
        this.sidePortIndexes = sidePortIndexes;
    }
    
    getClientJson(): ChipCircuitTileClientJson {
        const output = super.getClientJson() as ChipCircuitTileClientJson;
        output.sidePortIndexes = this.sidePortIndexes;
        return output;
    }
    
    getDbJson(): ChipCircuitTileDbJson {
        const output = super.getDbJson() as ChipCircuitTileDbJson;
        output.sidePortIndexes = this.sidePortIndexes;
        return output;
    }
    
    setSidePortIndexes(sidePortIndexes: number[]): void {
        this.sidePortIndexes = sidePortIndexes;
        this.markAsDirty();
    }
}


