
// Map from spirit class ID to ComplexWorldTileFactory.
let complexWorldTileFactoryMap = {};

class ComplexWorldTileFactory {
    
    // Concrete subclasses of ComplexWorldTileFactory must implement these methods:
    // convertJsonToTile, createTileWithSpirit
    
    constructor(spiritClassId) {
        complexWorldTileFactoryMap[spiritClassId] = this;
    }
}

class PlayerWorldTileFactory extends ComplexWorldTileFactory {
    
    constructor() {
        super(complexSpiritClassIdSet.player);
    }
    
    convertJsonToTile(data, spirit, pos) {
        let tempController = convertJsonToWalkController(data.walkController);
        return new PlayerWorldTile(spirit, pos, tempController);
    }
    
    createTileWithSpirit(spirit, pos) {
        let tempController = createDefaultWalkController();
        return new PlayerWorldTile(spirit, pos, tempController);
    }
}

new PlayerWorldTileFactory();

function getWorldTileWithSpirit(spirit, pos) {
    if (spirit instanceof SimpleSpirit) {
        return simpleWorldTileMap[spirit.serialInteger];
    }
    if (spirit instanceof ComplexSpirit) {
        let tempFactory = complexWorldTileFactoryMap[spirit.classId];
        return tempFactory.createTileWithSpirit(spirit, pos);
    }
    return null;
}

function convertJsonToWorldTile(data, pos) {
    if (typeof data === "number") {
        return simpleWorldTileMap[data];
    } else {
        let tempSpirit = convertClientJsonToSpirit(data.spirit);
        let tempFactory = complexWorldTileFactoryMap[tempSpirit.classId];
        return tempFactory.convertJsonToTile(data, tempSpirit, pos);
    }
}


