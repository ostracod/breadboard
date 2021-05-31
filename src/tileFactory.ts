
import { SimpleTileDbJson, ComplexTileDbJson, SpiritNestedDbJson } from "./interfaces.js";
import { convertNestedDbJsonToSpirit } from "./spiritType.js";
import { Spirit } from "./spirit.js";
import { TileType } from "./tileType.js";
import { Tile } from "./tile.js";
import { WorldTile } from "./worldTile.js";
import { CircuitTile } from "./circuitTile.js";

export abstract class TileFactory<T extends Tile> {
    
    constructor() {
        // Do nothing.
    }
    
    abstract getTileType(spirit: Spirit): TileType<T>;
    
    async convertDbJsonToTile(
        data: ReturnType<T["getDbJson"]>,
        shouldPerformTransaction: boolean
    ): Promise<T> {
        let spiritData: SpiritNestedDbJson;
        if (typeof data === "number") {
            spiritData = data as SimpleTileDbJson;
        } else {
            spiritData = (data as ComplexTileDbJson).spirit;
        }
        const spirit = await convertNestedDbJsonToSpirit(
            spiritData,
            shouldPerformTransaction
        );
        const tileType = this.getTileType(spirit);
        return tileType.convertDbJsonToTile(spirit, data);
    }
    
    getTileWithSpirit(spirit: Spirit): T {
        const tileType = this.getTileType(spirit);
        return tileType.getTileWithSpirit(spirit);
    }
}

export class WorldTileFactory extends TileFactory<WorldTile> {
    
    getTileType(spirit: Spirit): TileType<WorldTile> {
        return spirit.spiritType.worldTileType;
    }
}

export class CircuitTileFactory extends TileFactory<CircuitTile> {
    
    getTileType(spirit: Spirit): TileType<CircuitTile> {
        return spirit.spiritType.circuitTileType;
    }
}


