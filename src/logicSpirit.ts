
import { simpleSpiritSerialIntegerSet, wireArrangementAmount, circuitSize, simpleCircuitTileMap } from "./globalData.js";
import { ConstantLogicSpiritClientJson, ConstantLogicSpiritAttributeJson } from "./interfaces.js";
import { Pos } from "./pos.js";
import { TileGridSpirit, ComplexSpirit } from "./spirit.js";
import { CircuitSpiritType, ConstantLogicSpiritType } from "./spiritType.js";
import { CircuitTile } from "./circuitTile.js";
import { createCircuitTileGrid } from "./tileGrid.js";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LogicSpirit {
    // TODO: Put some nice method signatures in here.
    
}

export class CircuitSpirit extends TileGridSpirit<CircuitTile> implements LogicSpirit {
    
    spiritType: CircuitSpiritType;
    
    generateTileGrid(): void {
        this.tileGrid = createCircuitTileGrid(circuitSize, circuitSize);
        // Generate some garbage tiles for testing purposes.
        const tempPos = new Pos(0, 0);
        while (tempPos.y < this.tileGrid.height) {
            if (Math.random() < 0.3) {
                const tempTile = simpleCircuitTileMap[simpleSpiritSerialIntegerSet.wire + Math.floor(Math.random() * wireArrangementAmount)];
                this.setTile(tempPos, tempTile);
            }
            this.tileGrid.advancePos(tempPos);
        }
    }
}

export class ConstantLogicSpirit extends ComplexSpirit implements LogicSpirit {
    
    spiritType: ConstantLogicSpiritType;
    constantValue: number;
    
    constructor(spiritType: ConstantLogicSpiritType, id: number, constantValue = 0) {
        super(spiritType, id);
        this.constantValue = constantValue;
    }
    
    getClientJson(): ConstantLogicSpiritClientJson {
        const output = super.getClientJson() as ConstantLogicSpiritClientJson;
        output.constantValue = this.constantValue;
        return output;
    }
    
    getAttributeDbJson(): ConstantLogicSpiritAttributeJson {
        return {
            constantValue: this.constantValue,
        };
    }
}


