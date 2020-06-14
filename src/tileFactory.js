
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

function getTileWithSpirit(simpleTileMap, complexTileFactoryMap, spirit) {
    if (spirit instanceof SimpleSpirit) {
        return simpleTileMap[spirit.serialInteger];
    }
    if (spirit instanceof ComplexSpirit) {
        let tempFactory = complexTileFactoryMap[spirit.classId];
        return tempFactory.createTileWithSpirit(spirit);
    }
    return null;
}

export function getWorldTileWithSpirit(spirit) {
    return getTileWithSpirit(simpleWorldTileMap, complexWorldTileFactoryMap, spirit);
}

export function getCircuitTileWithSpirit(spirit) {
    return getTileWithSpirit(simpleCircuitTileMap, complexCircuitTileFactoryMap, spirit);
}

function convertDbJsonToTile(
    simpleTileMap,
    complexTileFactoryMap,
    data,
    shouldPerformTransaction
) {
    if (typeof data === "number") {
        return Promise.resolve(simpleTileMap[data]);
    } else {
        return convertNestedDbJsonToSpirit(
            data.spirit,
            shouldPerformTransaction
        ).then(spirit => {
            let tempFactory = complexTileFactoryMap[spirit.classId];
            return tempFactory.convertDbJsonToTile(data, spirit);
        });
    }
}

export function convertDbJsonToWorldTile(data, shouldPerformTransaction = true) {
    return convertDbJsonToTile(
        simpleWorldTileMap,
        complexWorldTileFactoryMap,
        data,
        shouldPerformTransaction
    );
}

export function convertDbJsonToCircuitTile(data, shouldPerformTransaction = true) {
    return convertDbJsonToTile(
        simpleCircuitTileMap,
        complexCircuitTileFactoryMap,
        data,
        shouldPerformTransaction
    );
}


