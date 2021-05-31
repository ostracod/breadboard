
import { TileDbJson, ChipCircuitTileDbJson } from "./interfaces.js";
import { SimpleSpirit } from "./spirit.js";
import { PlayerSpirit } from "./playerSpirit.js";
import { LogicSpirit } from "./logicSpirit.js";
import { Tile } from "./tile.js";
import { SimpleWorldTile, ComplexWorldTile, PlayerWorldTile, MachineWorldTile } from "./worldTile.js";
import { SimpleCircuitTile, ComplexCircuitTile, ChipCircuitTile } from "./circuitTile.js";

export abstract class TileType<T extends Tile = Tile> {
    
    abstract convertDbJsonToTile(spirit: T["spirit"], data: ReturnType<T["getDbJson"]>): T;
    
    abstract getTileWithSpirit(spirit: T["spirit"]): T;
}

export abstract class SimpleTileType<T extends Tile = Tile> extends TileType<T> {
    
    tile: T;
    
    constructor(CreateTile: new (spirit: T["spirit"]) => T, spirit: T["spirit"]) {
        super();
        this.tile = new CreateTile(spirit);
    }
    
    convertDbJsonToTile(spirit: T["spirit"], data: ReturnType<T["getDbJson"]>): T {
        return this.tile;
    }
    
    getTileWithSpirit(spirit: T["spirit"]): T {
        return this.tile;
    }
}

export class SimpleWorldTileType extends SimpleTileType<SimpleWorldTile> {
    
    constructor(spirit: SimpleSpirit) {
        super(SimpleWorldTile, spirit);
    }
}

export class SimpleCircuitTileType extends SimpleTileType<SimpleCircuitTile> {
    
    constructor(spirit: SimpleSpirit) {
        super(SimpleCircuitTile, spirit);
    }
}

export abstract class ComplexTileType<T extends Tile = Tile> extends TileType<T> {
    
    CreateTile: new (spirit: T["spirit"]) => T;
    
    constructor(CreateTile: new (spirit: T["spirit"]) => T) {
        super();
        this.CreateTile = CreateTile;
    }
    
    convertDbJsonToTile(spirit: T["spirit"], data: ReturnType<T["getDbJson"]>): T {
        return new this.CreateTile(spirit);
    }
    
    getTileWithSpirit(spirit: T["spirit"]): T {
        return new this.CreateTile(spirit);
    }
}

export class ComplexWorldTileType extends ComplexTileType<ComplexWorldTile> {
    
    constructor() {
        super(ComplexWorldTile);
    }
}

export class ComplexCircuitTileType extends ComplexTileType<ComplexCircuitTile> {
    
    constructor() {
        super(ComplexCircuitTile);
    }
}

export class MachineWorldTileType extends ComplexTileType<MachineWorldTile> {
    
    constructor() {
        super(MachineWorldTile);
    }
}

export class PlayerWorldTileType extends TileType<PlayerWorldTile> {
    
    convertDbJsonToTile(spirit: PlayerSpirit, data: TileDbJson): PlayerWorldTile {
        throw new Error("Player should not be persisted as world tile.");
    }
    
    getTileWithSpirit(spirit: PlayerSpirit): PlayerWorldTile {
        return new PlayerWorldTile(spirit);
    }
}

export class ChipCircuitTileType extends TileType<ChipCircuitTile> {
    
    convertDbJsonToTile(spirit: LogicSpirit, data: ChipCircuitTileDbJson): ChipCircuitTile {
        return new ChipCircuitTile(spirit, data.sidePortIndexes);
    }
    
    getTileWithSpirit(spirit: LogicSpirit): ChipCircuitTile {
        return new ChipCircuitTile(spirit);
    }
}


