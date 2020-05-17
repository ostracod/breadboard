
import {SimpleSpirit, ComplexSpirit, complexSpiritClassIdSet} from "./spirit.js";
import {simpleWorldTileMap, PlayerWorldTile} from "./worldTile.js";

// Map from spirit class ID to ComplexWorldTileFactory.
let complexWorldTileFactoryMap = {};

class ComplexWorldTileFactory {
    
    // Concrete subclasses of ComplexWorldTileFactory must implement these methods:
    // createTileWithSpirit
    
    constructor(spiritClassId) {
        complexWorldTileFactoryMap[spiritClassId] = this;
    }
}

class PlayerWorldTileFactory extends ComplexWorldTileFactory {
    
    constructor() {
        super(complexSpiritClassIdSet.player);
    }
    
    createTileWithSpirit(spirit) {
        return new PlayerWorldTile(spirit);
    }
}

new PlayerWorldTileFactory();

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


