
export class Tile {
    
    // Concrete subclasses of Tile must implement these methods:
    // getClientJson
    
    constructor(spirit) {
        this.spirit = spirit;
    }
    
    addToGridEvent(tileGrid, pos) {
        this.spirit.setTile(this);
    }
    
    removeFromGridEvent() {
        this.spirit.setTile(null);
    }
    
    moveEvent(pos) {
        // Do nothing.
    }
}


