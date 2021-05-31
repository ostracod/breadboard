
class TileFactory {
    
    // Concrete subclasses of TileFactory must implement these methods:
    // getTileType
    
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
        const tileType = this.getTileType(spirit);
        return tileType.convertClientJsonToTile(spirit, data);
    }
    
    getTileWithSpirit(spirit) {
        const tileType = this.getTileType(spirit);
        return tileType.getTileWithSpirit(spirit);
    }
}

class WorldTileFactory extends TileFactory {
    
    getTileType(spirit) {
        return spirit.spiritType.worldTileType;
    }
}

class CircuitTileFactory extends TileFactory {
    
    getTileType(spirit) {
        return spirit.spiritType.circuitTileType;
    }
}


