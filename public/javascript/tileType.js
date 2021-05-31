
class TileType {
    
    // Concrete subclasses of TileType must implement these methods:
    // convertClientJsonToTile, getTileWithSpirit
    
}

class SimpleTileType extends TileType {
    
    constructor(CreateTile, spirit) {
        super();
        this.tile = new CreateTile(spirit);
    }
    
    convertClientJsonToTile(spirit, data) {
        return this.tile;
    }
    
    getTileWithSpirit(spirit) {
        return this.tile;
    }
}

class SimpleWorldTileType extends SimpleTileType {
    
    constructor(spirit) {
        super(SimpleWorldTile, spirit);
    }
}

class SimpleCircuitTileType extends SimpleTileType {
    
    constructor(spirit) {
        super(SimpleCircuitTile, spirit);
    }
}

class ComplexTileType extends TileType {
    
    constructor(CreateTile) {
        super();
        this.CreateTile = CreateTile;
    }
    
    convertClientJsonToTile(spirit, data) {
        return new this.CreateTile(spirit);
    }
    
    getTileWithSpirit(spirit) {
        return new this.CreateTile(spirit);
    }
}

class ComplexWorldTileType extends ComplexTileType {
    
    constructor() {
        super(ComplexWorldTile);
    }
}

class ComplexCircuitTileType extends ComplexTileType {
    
    constructor() {
        super(ComplexCircuitTile);
    }
}

class MachineWorldTileType extends ComplexTileType {
    
    constructor() {
        super(MachineWorldTile);
    }
}

class PlayerWorldTileType extends TileType {
    
    convertClientJsonToTile(spirit, data) {
        const tempController = convertJsonToWalkController(data.walkController);
        return new PlayerWorldTile(spirit, tempController);
    }
    
    getTileWithSpirit(spirit) {
        const tempController = createDefaultWalkController();
        return new PlayerWorldTile(spirit, tempController);
    }
}

class ChipCircuitTileType extends TileType {
    
    convertClientJsonToTile(spirit, data) {
        return new ChipCircuitTile(spirit, data.sidePortIndexes);
    }
    
    getTileWithSpirit(spirit) {
        return new ChipCircuitTile(spirit);
    }
}


