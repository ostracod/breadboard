
import {simpleCircuitTileSet, simpleCircuitTileMap} from "./globalData.js";
import {Tile, simpleTileComplexity, complexTileComplexity} from "./tile.js";

export class CircuitTile extends Tile {
    
    getSimpleTileSet() {
        return simpleCircuitTileSet;
    }
    
    getSimpleTileMap() {
        return simpleCircuitTileMap;
    }
}

export class SimpleCircuitTile extends CircuitTile {
    
    constructor(spirit) {
        super(spirit, simpleTileComplexity);
    }
}

export class ComplexCircuitTile extends CircuitTile {
    
    constructor(spirit) {
        super(spirit, complexTileComplexity);
    }
}


