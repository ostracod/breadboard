
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
        const tempClassId = complexSpiritClassIdSet[this.baseName];
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
        const tempController = convertJsonToWalkController(data.walkController);
        return new PlayerWorldTile(spirit, tempController);
    }
    
    createTileWithSpirit(spirit, pos) {
        const tempController = createDefaultWalkController();
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

class TileFactory {
    
    constructor(simpleTileMap, complexTileFactoryMap) {
        this.simpleTileMap = simpleTileMap;
        this.complexTileFactoryMap = complexTileFactoryMap;
    }
    
    convertClientJsonToTile(data) {
        if (typeof data === "number") {
            return this.simpleTileMap[data];
        } else {
            const tempSpirit = convertClientJsonToSpirit(data.spirit);
            const tempFactory = this.complexTileFactoryMap[tempSpirit.classId];
            return tempFactory.convertClientJsonToTile(data, tempSpirit);
        }
    }
    
    getTileWithSpirit(spirit) {
        if (spirit instanceof SimpleSpirit) {
            return this.simpleTileMap[spirit.serialInteger];
        }
        if (spirit instanceof ComplexSpirit) {
            const tempFactory = this.complexTileFactoryMap[spirit.classId];
            return tempFactory.createTileWithSpirit(spirit);
        }
        return null;
    }
}

class WorldTileFactory extends TileFactory {
    
    constructor() {
        super(simpleWorldTileMap, complexWorldTileFactoryMap);
    }
}

class CircuitTileFactory extends TileFactory {
    
    constructor() {
        super(simpleCircuitTileMap, complexCircuitTileFactoryMap);
    }
}


