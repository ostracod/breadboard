
class TileFactory {
    
    // Concrete subclasses of TileFactory must implement these methods:
    // convertClientJsonToTileHelper, getTileWithSpirit
    
    constructor() {
        // Do nothing.
    }
    
    convertClientJsonToTile(data) {
        let spiritData;
        if (typeof data === "number") {
            spiritData = data;
        } else {
            spiritData = data.spirit;
        }
        const spirit = convertClientJsonToSpirit(spiritData);
        return this.convertClientJsonToTileHelper(spirit, data);
    }
}

class WorldTileFactory extends TileFactory {
    
    convertClientJsonToTileHelper(spirit, data) {
        return spirit.convertClientJsonToWorldTile(data);
    }
    
    getTileWithSpirit(spirit) {
        return spirit.getWorldTile();
    }
}

class CircuitTileFactory extends TileFactory {
    
    convertClientJsonToTileHelper(spirit, data) {
        return spirit.convertClientJsonToCircuitTile(data);
    }
    
    getTileWithSpirit(spirit) {
        return spirit.getCircuitTile();
    }
}


