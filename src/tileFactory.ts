
import { complexSpiritClassIdSet, simpleWorldTileMap, simpleCircuitTileMap, complexWorldTileFactoryMap, complexCircuitTileFactoryMap } from "./globalData.js";
import { TileDbJson, ComplexTileDbJson } from "./interfaces.js";
import { convertNestedDbJsonToSpirit } from "./spiritType.js";
import { Spirit, SimpleSpirit, ComplexSpirit, PlayerSpirit, MachineSpirit } from "./spirit.js";
import { Tile } from "./tile.js";
import { WorldTile, ComplexWorldTile, PlayerWorldTile, MachineWorldTile } from "./worldTile.js";
import { CircuitTile, ComplexCircuitTile } from "./circuitTile.js";

abstract class ComplexTileFactory<T extends Tile<ComplexSpirit> = Tile<ComplexSpirit>> {
    
    baseName: string;
    
    constructor(baseName: string) {
        this.baseName = baseName;
    }
    
    abstract convertDbJsonToTile(data: ReturnType<T["getDbJson"]>, spirit: T["spirit"]): T;
    
    abstract createTileWithSpirit(spirit: T["spirit"]): T;
}

export abstract class ComplexWorldTileFactory<T extends ComplexWorldTile = ComplexWorldTile> extends ComplexTileFactory<T> {
    
    constructor(baseName: string) {
        super(baseName);
        const tempClassId = complexSpiritClassIdSet[this.baseName];
        complexWorldTileFactoryMap[tempClassId] = this;
    }
}

export class GenericComplexWorldTileFactory extends ComplexWorldTileFactory {
    
    convertDbJsonToTile(data: ComplexTileDbJson, spirit: ComplexSpirit): ComplexWorldTile {
        return new ComplexWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit: ComplexSpirit): ComplexWorldTile {
        return new ComplexWorldTile(spirit);
    }
}

export class PlayerWorldTileFactory extends ComplexWorldTileFactory<PlayerWorldTile> {
    
    constructor() {
        super("player");
    }
    
    convertDbJsonToTile(data: ComplexTileDbJson, spirit: PlayerSpirit): PlayerWorldTile {
        throw new Error("Player should not be persisted as world tile.");
    }
    
    createTileWithSpirit(spirit: PlayerSpirit): PlayerWorldTile {
        return new PlayerWorldTile(spirit);
    }
}

export class MachineWorldTileFactory extends ComplexWorldTileFactory<MachineWorldTile> {
    
    constructor() {
        super("machine");
    }
    
    convertDbJsonToTile(data: ComplexTileDbJson, spirit: MachineSpirit): MachineWorldTile {
        return new MachineWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit: MachineSpirit): MachineWorldTile {
        return new MachineWorldTile(spirit);
    }
}

export class ComplexCircuitTileFactory extends ComplexTileFactory<ComplexCircuitTile> {
    
    constructor(baseName: string) {
        super(baseName);
        const tempClassId = complexSpiritClassIdSet[this.baseName];
        complexCircuitTileFactoryMap[tempClassId] = this;
    }
    
    convertDbJsonToTile(data: ComplexTileDbJson, spirit: ComplexSpirit): ComplexCircuitTile {
        return new ComplexCircuitTile(spirit);
    }
    
    createTileWithSpirit(spirit: ComplexSpirit): ComplexCircuitTile {
        return new ComplexCircuitTile(spirit);
    }
}

export class TileFactory<T extends Tile> {
    
    // TODO: Figure out how to express these types in terms of T.
    simpleTileMap: {[serialInteger: string]: Tile<SimpleSpirit>};
    complexTileFactoryMap: {[classId: string]: ComplexTileFactory};
    
    constructor(
        simpleTileMap: {[serialInteger: string]: Tile<SimpleSpirit>},
        complexTileFactoryMap: {[classId: string]: ComplexTileFactory},
    ) {
        this.simpleTileMap = simpleTileMap;
        this.complexTileFactoryMap = complexTileFactoryMap;
    }
    
    convertDbJsonToTile(data: TileDbJson, shouldPerformTransaction: boolean): Promise<T> {
        if (typeof data === "number") {
            return Promise.resolve(this.simpleTileMap[data] as unknown as T);
        } else {
            return convertNestedDbJsonToSpirit(
                data.spirit,
                shouldPerformTransaction
            ).then((spirit: ComplexSpirit) => {
                const tempFactory = this.complexTileFactoryMap[spirit.classId];
                return tempFactory.convertDbJsonToTile(data, spirit) as unknown as T;
            });
        }
    }
    
    getTileWithSpirit(spirit: Spirit): T {
        if (spirit instanceof SimpleSpirit) {
            return this.simpleTileMap[(spirit as SimpleSpirit).serialInteger] as unknown as T;
        }
        if (spirit instanceof ComplexSpirit) {
            const complexSpirit = spirit as ComplexSpirit;
            const tempFactory = this.complexTileFactoryMap[complexSpirit.classId];
            return tempFactory.createTileWithSpirit(complexSpirit) as unknown as T;
        }
        return null;
    }
}

export class WorldTileFactory extends TileFactory<WorldTile> {
    
    constructor() {
        super(simpleWorldTileMap, complexWorldTileFactoryMap);
    }
}

export class CircuitTileFactory extends TileFactory<CircuitTile> {
    
    constructor() {
        super(simpleCircuitTileMap, complexCircuitTileFactoryMap);
    }
}


