
class CircuitTile extends Tile {
    
    getSimpleTileSet() {
        return simpleCircuitTileSet;
    }
    
    getSimpleTileMap() {
        return simpleCircuitTileMap;
    }
}

class SimpleCircuitTile extends CircuitTile {
    
    constructor(spirit) {
        super(spirit, simpleTileComplexity);
    }
}

class ComplexCircuitTile extends CircuitTile {
    
    constructor(spirit) {
        super(spirit, complexTileComplexity);
    }
}


class ChipCircuitTile extends ComplexCircuitTile {
    
    constructor(logicSpirit, sidePortIndexes = [null, null, null, null]) {
        super(logicSpirit);
        this.sidePortIndexes = sidePortIndexes;
    }
}

const drawAllCircuitTilesToPlace = () => {
    for (let arrangement = 0; arrangement < wireArrangementAmount; arrangement++) {
        const tempSerialInteger = simpleSpiritSerialIntegerSet.wire + arrangement;
        const tempSpiritType = simpleSpiritTypeMap[tempSerialInteger];
        new CircuitTileOptionRow(tempSpiritType);
    }
    new CircuitTileOptionRow(complexSpiritTypeSet.constantLogic);
};


