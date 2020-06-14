
class ComplexTileFactory {
    
    // Concrete subclasses of ComplexTileFactory must implement these methods:
    // convertClientJsonToTile, createTileWithSpirit
    
    constructor(baseName) {
        this.baseName = baseName;
    }
}

class ComplexWorldTileFactory extends ComplexTileFactory {
    
    constructor(baseName) {
        super(baseName);
        let tempClassId = complexSpiritClassIdSet[this.baseName];
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

function getWorldTileWithSpirit(spirit) {
    return getTileWithSpirit(simpleWorldTileMap, complexWorldTileFactoryMap, spirit);
}

function getCircuitTileWithSpirit(spirit) {
    return getTileWithSpirit(simpleCircuitTileMap, complexCircuitTileFactoryMap, spirit);
}

function convertClientJsonToTile(simpleTileMap, complexTileFactoryMap, data) {
    if (typeof data === "number") {
        return simpleTileMap[data];
    } else {
        let tempSpirit = convertClientJsonToSpirit(data.spirit);
        let tempFactory = complexTileFactoryMap[tempSpirit.classId];
        return tempFactory.convertClientJsonToTile(data, tempSpirit);
    }
}

function convertClientJsonToWorldTile(data) {
    return convertClientJsonToTile(simpleWorldTileMap, complexWorldTileFactoryMap, data);
}

function convertClientJsonToCircuitTile(data, shouldPerformTransaction = true) {
    return convertClientJsonToTile(simpleCircuitTileMap, complexCircuitTileFactoryMap, data);
}


