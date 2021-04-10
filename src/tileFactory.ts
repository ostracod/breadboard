
import {complexSpiritClassIdSet, simpleWorldTileMap, simpleCircuitTileMap, complexWorldTileFactoryMap, complexCircuitTileFactoryMap} from "./globalData.js";
import {convertNestedDbJsonToSpirit} from "./spiritType.js";
import {SimpleSpirit, ComplexSpirit} from "./spirit.js";
import {Tile} from "./tile.js";
import {ComplexWorldTile, PlayerWorldTile, MachineWorldTile} from "./worldTile.js";
import {ComplexCircuitTile} from "./circuitTile.js";

abstract class ComplexTileFactory {
    
    baseName: string;
    
    constructor(baseName) {
        this.baseName = baseName;
    }
    
    abstract convertDbJsonToTile(data, spirit): Tile;
    
    abstract createTileWithSpirit(spirit);
}

export class ComplexWorldTileFactory extends ComplexTileFactory {
    
    constructor(baseName) {
        super(baseName);
        let tempClassId = complexSpiritClassIdSet[this.baseName];
        complexWorldTileFactoryMap[tempClassId] = this;
    }
    
    convertDbJsonToTile(data, spirit): Tile {
        return new ComplexWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new ComplexWorldTile(spirit);
    }
}

export class PlayerWorldTileFactory extends ComplexWorldTileFactory {
    
    constructor() {
        super("player");
    }
    
    convertDbJsonToTile(data, spirit): Tile {
        throw new Error("Player should not be persisted as world tile.");
    }
    
    createTileWithSpirit(spirit) {
        return new PlayerWorldTile(spirit);
    }
}

export class MachineWorldTileFactory extends ComplexWorldTileFactory {
    
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

export class ComplexCircuitTileFactory extends ComplexTileFactory {
    
    constructor(baseName) {
        super(baseName);
        let tempClassId = complexSpiritClassIdSet[this.baseName];
        complexCircuitTileFactoryMap[tempClassId] = this;
    }
    
    convertDbJsonToTile(data, spirit): Tile {
        return new ComplexCircuitTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new ComplexCircuitTile(spirit);
    }
}

export class TileFactory {
    
    simpleTileMap: {[serialInteger: string]: Tile};
    complexTileFactoryMap: {[classId: string]: ComplexTileFactory};
    
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
            ).then(spirit => {
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

export class WorldTileFactory extends TileFactory {
    
    constructor() {
        super(simpleWorldTileMap, complexWorldTileFactoryMap);
    }
}

export class CircuitTileFactory extends TileFactory {
    
    constructor() {
        super(simpleCircuitTileMap, complexCircuitTileFactoryMap);
    }
}


