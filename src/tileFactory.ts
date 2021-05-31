
import { TileDbJson, SimpleTileDbJson, ComplexTileDbJson, SpiritNestedDbJson } from "./interfaces.js";
import { convertNestedDbJsonToSpirit } from "./spiritType.js";
import { Spirit } from "./spirit.js";
import { Tile } from "./tile.js";
import { WorldTile } from "./worldTile.js";
import { CircuitTile } from "./circuitTile.js";

export abstract class TileFactory<T extends Tile> {
    
    constructor() {
        // Do nothing.
    }
    
    abstract convertDbJsonToTileHelper(spirit: Spirit, data: TileDbJson): T;
    
    async convertDbJsonToTile(
        data: TileDbJson,
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
        return this.convertDbJsonToTileHelper(spirit, data);
    }
    
    abstract getTileWithSpirit(spirit: Spirit): T;
}

export class WorldTileFactory extends TileFactory<WorldTile> {
    
    convertDbJsonToTileHelper(spirit: Spirit, data: TileDbJson): WorldTile {
        return spirit.convertDbJsonToWorldTile(data);
    }
    
    getTileWithSpirit(spirit: Spirit): WorldTile {
        return spirit.getWorldTile();
    }
}

export class CircuitTileFactory extends TileFactory<CircuitTile> {
    
    convertDbJsonToTileHelper(spirit: Spirit, data: TileDbJson): CircuitTile {
        return spirit.convertDbJsonToCircuitTile(data);
    }
    
    getTileWithSpirit(spirit: Spirit): CircuitTile {
        return spirit.getCircuitTile();
    }
}


