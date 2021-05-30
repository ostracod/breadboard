
class CircuitTile extends Tile {
    
    getSimpleTileSet() {
        return simpleCircuitTileSet;
    }
    
    getSimpleTileMap() {
        return simpleCircuitTileMap;
    }
    
    inspect() {
        showPlaceholderTag("chipInfo");
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
    
    inspect() {
        hidePlaceholderTag("chipInfo");
        const logicPorts = this.spirit.getLogicPorts();
        chipSideNames.forEach((name, sideIndex) => {
            const selectTag = document.getElementById(name + "ChipPort");
            selectTag.innerHTML = "";
            const optionTag = document.createElement("option");
            optionTag.innerHTML = "None";
            optionTag.value = "";
            selectTag.appendChild(optionTag);
            logicPorts.forEach((logicPort, portIndex) => {
                const optionTag = document.createElement("option");
                optionTag.innerHTML = logicPort.name;
                optionTag.value = portIndex;
                selectTag.appendChild(optionTag);
            });
            const portIndex = this.sidePortIndexes[sideIndex];
            if (portIndex === null) {
                selectTag.value = "";
            } else {
                selectTag.value = portIndex;
            }
        });
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


