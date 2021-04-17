
import { simpleCircuitTileSet, simpleCircuitTileMap } from "./globalData.js";
import { Spirit, SimpleSpirit, ComplexSpirit } from "./spirit.js";
import { Tile, simpleTileComplexity, complexTileComplexity } from "./tile.js";

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

export class ComplexCircuitTile extends CircuitTile<ComplexSpirit> {
    
    constructor(spirit: ComplexSpirit) {
        super(spirit, complexTileComplexity);
    }
}


