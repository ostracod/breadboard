
import {simpleCircuitTileSet, simpleCircuitTileMap} from "./globalData.js";
import {Tile, simpleTileConverter, complexTileConverter} from "./tile.js";

export class CircuitTile extends Tile {
    
}

export class SimpleCircuitTile extends CircuitTile {
    
    constructor(spirit) {
        super(spirit, simpleTileConverter);
        let tempSpiritType = this.spirit.spiritType;
        let tempSerialInteger = this.spirit.serialInteger;
        simpleCircuitTileSet[tempSpiritType.baseName] = this;
        simpleCircuitTileMap[tempSerialInteger] = this;
    }
}

export class ComplexCircuitTile extends CircuitTile {
    
    constructor(spirit) {
        super(spirit, complexTileConverter);
    }
}


