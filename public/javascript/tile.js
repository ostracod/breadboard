
var localPlayerWorldTile = null;
var playerWorldTileList = [];
// Map from spirit serial integer to WorldTile.
var simpleWorldTileMap = {};

function Tile(spirit) {
    this.spirit = spirit;
}

// Concrete subclasses of Tile must implement these methods:
// draw

function drawTileSprite(pos, sprite) {
    if (sprite === null) {
        return;
    }
    sprite.draw(context, pos, pixelSize);
}

function WorldTile(spirit) {
    Tile.call(this, spirit);
}

WorldTile.prototype = Object.create(Tile.prototype);
WorldTile.prototype.constructor = WorldTile;

WorldTile.prototype.draw = function(pos, layer) {
    if (layer == 0) {
        drawTileSprite(pos, this.spirit.getSprite());
    }
}

WorldTile.prototype.canBeMined = function() {
    return this.spirit.canBeMined();
}

function LoadingWorldTile() {
    WorldTile.call(this, loadingSpirit);
}

LoadingWorldTile.prototype = Object.create(WorldTile.prototype);
LoadingWorldTile.prototype.constructor = LoadingWorldTile;

var loadingWorldTile = new LoadingWorldTile();

function SimpleWorldTile(spirit) {
    WorldTile.call(this, spirit);
    var tempSerialInteger = this.spirit.getSerialInteger();
    simpleWorldTileMap[tempSerialInteger] = this;
}

SimpleWorldTile.prototype = Object.create(WorldTile.prototype);
SimpleWorldTile.prototype.constructor = SimpleWorldTile;

var emptyWorldTile = new SimpleWorldTile(emptySpirit);
var barrierWorldTile = new SimpleWorldTile(barrierSpirit);
var matteriteWorldTile = new SimpleWorldTile(matteriteSpirit);
var energiteWorldTile = new SimpleWorldTile(energiteSpirit);

function ComplexWorldTile(spirit, pos) {
    WorldTile.call(this, spirit);
    this.pos = pos.copy();
}

ComplexWorldTile.prototype = Object.create(WorldTile.prototype);
ComplexWorldTile.prototype.constructor = ComplexWorldTile;

ComplexWorldTile.prototype.move = function(offset) {
    var tempNextPos = this.pos.copy();
    tempNextPos.add(offset);
    var tempTile = worldTileGrid.getTile(tempNextPos);
    if (!(tempTile.spirit instanceof EmptySpirit)) {
        return false;
    }
    worldTileGrid.setTile(this.pos, emptyWorldTile);
    this.pos.set(tempNextPos);
    worldTileGrid.setTile(this.pos, this);
    return true;
}

function PlayerWorldTile(spirit, pos, walkController) {
    ComplexWorldTile.call(this, spirit, pos);
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

PlayerWorldTile.prototype = Object.create(ComplexWorldTile.prototype);
PlayerWorldTile.prototype.constructor = PlayerWorldTile;

PlayerWorldTile.prototype.draw = function(pos, layer) {
    WorldTile.prototype.draw.call(this, pos, layer);
    if (layer == 1) {
        var tempPos = pos.copy();
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

PlayerWorldTile.prototype.tick = function() {
    this.walkController.tick();
}


