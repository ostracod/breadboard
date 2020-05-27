
let localPlayerWorldTile = null;
let playerWorldTileList = [];
// Map from spirit serial integer to WorldTile.
let simpleWorldTileMap = {};

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

class WorldTile extends Tile {
    
    draw(pos, layer) {
        if (layer == 0) {
            drawTileSprite(pos, this.spirit.getSprite());
        }
    }
    
    canBeMined() {
        return this.spirit.canBeMined();
    }
}

class LoadingWorldTile extends WorldTile {
    
    constructor() {
        super(loadingSpirit);
    }
}

let loadingWorldTile = new LoadingWorldTile();

class SimpleWorldTile extends WorldTile {
    
    constructor(spirit) {
        super(spirit);
        let tempSerialInteger = this.spirit.serialInteger;
        simpleWorldTileMap[tempSerialInteger] = this;
    }
}

for (let spirit of simpleSpiritSet) {
    new SimpleWorldTile(spirit);
}

function getSimpleWorldTile(spiritKey) {
    let tempInteger = simpleSpiritSerialIntegerSet[spiritKey];
    return simpleWorldTileMap[tempInteger];
}

let emptyWorldTile = getSimpleWorldTile("empty");

class ComplexWorldTile extends WorldTile {
    
    constructor(spirit, pos) {
        super(spirit);
        this.pos = pos.copy();
    }
    
    move(offset) {
        let tempNextPos = this.pos.copy();
        tempNextPos.add(offset);
        let tempTile = worldTileGrid.getTile(tempNextPos);
        if (tempTile.spirit.spiritType !== emptySpiritType) {
            return false;
        }
        worldTileGrid.setTile(this.pos, emptyWorldTile);
        this.pos.set(tempNextPos);
        worldTileGrid.setTile(this.pos, this);
        return true;
    }
}

class PlayerWorldTile extends ComplexWorldTile {
    
    constructor(spirit, pos, walkController) {
        super(spirit, pos);
        if (this.spirit.username === localPlayerUsername) {
            if (localPlayerWorldTile !== null) {
                walkController = localPlayerWorldTile.walkController;
            }
            localPlayerWorldTile = this;
        }
        this.walkController = walkController;
        this.walkController.playerTile = this;
        playerWorldTileList.push(this);
    }
    
    draw(pos, layer) {
        super.draw(pos, layer);
        if (layer == 1) {
            let tempPos = pos.copy();
            tempPos.scale(pixelSize);
            tempPos.x += spritePixelSize / 2;
            tempPos.y -= spritePixelSize * 1 / 5;
            context.font = "bold 30px Arial";
            context.textAlign = "center";
            context.textBaseline = "bottom";
            context.fillStyle = "#000000";
            context.fillText(
                this.spirit.username,
                Math.floor(tempPos.x),
                Math.floor(tempPos.y)
            );
        }
    }
    
    tick() {
        this.walkController.tick();
    }
}


