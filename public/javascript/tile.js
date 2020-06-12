
class Tile {
    
    // Concrete subclasses of Tile must implement these methods:
    // draw
    
    constructor(spirit) {
        this.spirit = spirit;
    }
    
    draw(pos, layer) {
        if (layer === 0) {
            for (let sprite of this.spirit.getSprites()) {
                sprite.draw(context, pos, pixelSize);
            }
        }
    }
    
}


