
class Tile {
    
    // Concrete subclasses of Tile must implement these methods:
    // draw
    
    constructor(spirit) {
        this.spirit = spirit;
    }
}

function drawTileSprite(pos, sprite) {
    if (sprite === null) {
        return;
    }
    sprite.draw(context, pos, pixelSize);
}


