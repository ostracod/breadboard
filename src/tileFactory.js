
import {complexSpiritClassIdSet, simpleWorldTileMap, simpleCircuitTileMap, complexWorldTileFactoryMap, complexCircuitTileFactoryMap} from "./globalData.js";
import {convertNestedDbJsonToSpirit} from "./spiritType.js";
import {SimpleSpirit, ComplexSpirit} from "./spirit.js";
import {ComplexWorldTile, PlayerWorldTile, MachineWorldTile} from "./worldTile.js";

class ComplexTileFactory {
    
    // Concrete subclasses of ComplexTileFactory must implement these methods:
    // convertDbJsonToTile, createTileWithSpirit
    
    constructor(baseName) {
        this.baseName = baseName;
    }
}

export class ComplexWorldTileFactory extends ComplexTileFactory {
    
    constructor(baseName) {
        super(baseName);
        let tempClassId = complexSpiritClassIdSet[this.baseName];
        complexWorldTileFactoryMap[tempClassId] = this;
    }
    
    convertDbJsonToTile(data, spirit) {
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
    
    convertDbJsonToTile(data, spirit) {
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

class TileFactory {
    
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


