
import {simpleCircuitTileSet, simpleCircuitTileMap} from "./globalData.js";
import {SimpleSpirit, ComplexSpirit} from "./spirit.js";
import {Tile, simpleTileComplexity, complexTileComplexity} from "./tile.js";

export class CircuitTile extends Tile {
    
    getSimpleTileSet(): {[name: string]: CircuitTile} {
        return simpleCircuitTileSet;
    }
    
    getSimpleTileMap(): {[serialInteger: string]: CircuitTile} {
        return simpleCircuitTileMap;
    }
}

export class SimpleCircuitTile extends CircuitTile {
    
    constructor(spirit: SimpleSpirit) {
        super(spirit, simpleTileComplexity);
    }
}

export class ComplexCircuitTile extends CircuitTile {
    
    constructor(spirit: ComplexSpirit) {
        super(spirit, complexTileComplexity);
    }
}


