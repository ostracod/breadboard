
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

const drawAllCircuitTilesToPlace = () => {
    for (let arrangement = 0; arrangement < wireArrangementAmount; arrangement++) {
        let tempSerialInteger = simpleSpiritSerialIntegerSet.wire + arrangement;
        let tempSpiritType = simpleSpiritTypeMap[tempSerialInteger];
        new CircuitTileOptionRow(tempSpiritType);
    }
};


