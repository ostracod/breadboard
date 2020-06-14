
class ComplexWorldTileFactory {
    
    constructor(baseName) {
        let tempClassId = complexSpiritClassIdSet[baseName];
        complexWorldTileFactoryMap[tempClassId] = this;
    }
    
    convertClientJsonToTile(data, spirit) {
        return new ComplexWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new ComplexWorldTile(spirit);
    }
}

class PlayerWorldTileFactory extends ComplexWorldTileFactory {
    
    constructor() {
        super("player");
    }
    
    convertClientJsonToTile(data, spirit) {
        let tempController = convertJsonToWalkController(data.walkController);
        return new PlayerWorldTile(spirit, tempController);
    }
    
    createTileWithSpirit(spirit, pos) {
        let tempController = createDefaultWalkController();
        return new PlayerWorldTile(spirit, tempController);
    }
}

class MachineWorldTileFactory extends ComplexWorldTileFactory {
    
    constructor() {
        super("machine");
    }
    
    convertClientJsonToTile(data, spirit) {
        return new MachineWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new MachineWorldTile(spirit);
    }
}

function getWorldTileWithSpirit(spirit) {
    if (spirit instanceof SimpleSpirit) {
        return simpleWorldTileMap[spirit.serialInteger];
    }
    if (spirit instanceof ComplexSpirit) {
        let tempFactory = complexWorldTileFactoryMap[spirit.classId];
        return tempFactory.createTileWithSpirit(spirit);
    }
    return null;
}

function convertClientJsonToWorldTile(data) {
    if (typeof data === "number") {
        return simpleWorldTileMap[data];
    } else {
        let tempSpirit = convertClientJsonToSpirit(data.spirit);
        let tempFactory = complexWorldTileFactoryMap[tempSpirit.classId];
        return tempFactory.convertClientJsonToTile(data, tempSpirit);
    }
}


