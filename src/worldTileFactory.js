
import {complexSpiritClassIdSet, convertDbJsonToSpirit} from "./spiritType.js";
import {SimpleSpirit, ComplexSpirit} from "./spirit.js";
import {simpleWorldTileMap, PlayerWorldTile, MachineWorldTile} from "./worldTile.js";

// Map from spirit class ID to ComplexWorldTileFactory.
let complexWorldTileFactoryMap = {};

class ComplexWorldTileFactory {
    
    // Concrete subclasses of ComplexWorldTileFactory must implement these methods:
    // convertDbJsonToTile, createTileWithSpirit
    
    constructor(spiritClassId) {
        complexWorldTileFactoryMap[spiritClassId] = this;
    }
}

class PlayerWorldTileFactory extends ComplexWorldTileFactory {
    
    constructor() {
        super(complexSpiritClassIdSet.player);
    }
    
    convertDbJsonToTile(data, spirit) {
        throw new Error("Player should not be persisted as world tile.");
    }
    
    createTileWithSpirit(spirit) {
        return new PlayerWorldTile(spirit);
    }
}

class MachineWorldTileFactory extends ComplexWorldTileFactory {
    
    constructor() {
        super(complexSpiritClassIdSet.machine);
    }
    
    convertDbJsonToTile(data, spirit) {
        return new MachineWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new MachineWorldTile(spirit);
    }
}

new PlayerWorldTileFactory();
new MachineWorldTileFactory();

export function getWorldTileWithSpirit(spirit) {
    if (spirit instanceof SimpleSpirit) {
        return simpleWorldTileMap[spirit.serialInteger];
    }
    if (spirit instanceof ComplexSpirit) {
        let tempFactory = complexWorldTileFactoryMap[spirit.classId];
        return tempFactory.createTileWithSpirit(spirit);
    }
    return null;
}

export function convertDbJsonToWorldTile(data) {
    if (typeof data === "number") {
        return simpleWorldTileMap[data];
    } else {
        let tempSpirit = convertDbJsonToSpirit(data.spirit);
        let tempFactory = complexWorldTileFactoryMap[tempSpirit.classId];
        return tempFactory.convertDbJsonToTile(data, tempSpirit, pos);
    }
}


