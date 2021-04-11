
import {complexSpiritClassIdSet, simpleWorldTileMap, simpleCircuitTileMap, complexWorldTileFactoryMap, complexCircuitTileFactoryMap} from "./globalData.js";
import {convertNestedDbJsonToSpirit} from "./spiritType.js";
import {SimpleSpirit, ComplexSpirit} from "./spirit.js";
import {Tile} from "./tile.js";
import {WorldTile, ComplexWorldTile, PlayerWorldTile, MachineWorldTile} from "./worldTile.js";
import {CircuitTile, ComplexCircuitTile} from "./circuitTile.js";

abstract class ComplexTileFactory<T extends Tile> {
    
    baseName: string;
    
    constructor(baseName) {
        this.baseName = baseName;
    }
    
    abstract convertDbJsonToTile(data, spirit): T;
    
    abstract createTileWithSpirit(spirit);
}

export class ComplexWorldTileFactory<T extends ComplexWorldTile> extends ComplexTileFactory<ComplexWorldTile> {
    
    constructor(baseName) {
        super(baseName);
        let tempClassId = complexSpiritClassIdSet[this.baseName];
        complexWorldTileFactoryMap[tempClassId] = this;
    }
    
    convertDbJsonToTile(data, spirit): ComplexWorldTile {
        return new ComplexWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new ComplexWorldTile(spirit);
    }
}

export class PlayerWorldTileFactory extends ComplexWorldTileFactory<PlayerWorldTile> {
    
    constructor() {
        super("player");
    }
    
    convertDbJsonToTile(data, spirit): PlayerWorldTile {
        throw new Error("Player should not be persisted as world tile.");
    }
    
    createTileWithSpirit(spirit) {
        return new PlayerWorldTile(spirit);
    }
}

export class MachineWorldTileFactory extends ComplexWorldTileFactory<MachineWorldTile> {
    
    constructor() {
        super("machine");
    }
    
    convertDbJsonToTile(data, spirit) {
        return new MachineWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new MachineWorldTile(spirit);
    }
}

export class ComplexCircuitTileFactory extends ComplexTileFactory<ComplexCircuitTile> {
    
    constructor(baseName) {
        super(baseName);
        let tempClassId = complexSpiritClassIdSet[this.baseName];
        complexCircuitTileFactoryMap[tempClassId] = this;
    }
    
    convertDbJsonToTile(data, spirit): ComplexCircuitTile {
        return new ComplexCircuitTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new ComplexCircuitTile(spirit);
    }
}

export class TileFactory<T extends Tile> {
    
    simpleTileMap: {[serialInteger: string]: Tile};
    complexTileFactoryMap: {[classId: string]: ComplexTileFactory<T>};
    
    constructor(simpleTileMap, complexTileFactoryMap) {
        this.simpleTileMap = simpleTileMap;
        this.complexTileFactoryMap = complexTileFactoryMap;
    }
    
    convertDbJsonToTile(data, shouldPerformTransaction) {
        if (typeof data === "number") {
            return Promise.resolve(this.simpleTileMap[data]);
        } else {
            return convertNestedDbJsonToSpirit(
                data.spirit,
                shouldPerformTransaction
            ).then((spirit: ComplexSpirit) => {
                let tempFactory = this.complexTileFactoryMap[spirit.classId];
                return tempFactory.convertDbJsonToTile(data, spirit);
            });
        }
    }
    
    getTileWithSpirit(spirit) {
        if (spirit instanceof SimpleSpirit) {
            return this.simpleTileMap[spirit.serialInteger];
        }
        if (spirit instanceof ComplexSpirit) {
            let tempFactory = this.complexTileFactoryMap[spirit.classId];
            return tempFactory.createTileWithSpirit(spirit);
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


