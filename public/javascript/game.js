
var pixelSize = 6;
var spritePixelSize = spriteSize * pixelSize;
var canvasTileWidth;
var canvasTileHeight;
var worldTileGrid;
// Map from WorldTile type number to WorldTileFactory.
var worldTileFactoryMap = {};
var loadingWorldTile;
var cameraPos = new Pos(0, 0);

function Tile() {
    
}

// Concrete subclasses of Tile must implement these methods:
// draw

function drawTileSprite(pos, sprite) {
    if (sprite === null) {
        return;
    }
    sprite.draw(context, pos, pixelSize);
}

function WorldTile() {
    Tile.call(this);
}

WorldTile.prototype = Object.create(Tile.prototype);
WorldTile.prototype.constructor = WorldTile;

function SimpleWorldTile(sprite) {
    WorldTile.call(this);
    this.sprite = sprite;
}

SimpleWorldTile.prototype = Object.create(WorldTile.prototype);
SimpleWorldTile.prototype.constructor = SimpleWorldTile;

SimpleWorldTile.prototype.draw = function(pos, layer) {
    if (layer == 0) {
        drawTileSprite(pos, this.sprite);
    }
}

loadingWorldTile = new SimpleWorldTile(new Sprite(loadingSpriteSet, 0, 0));

function ComplexWorldTile(pos) {
    WorldTile.call(this);
    this.pos = pos.copy();
}

ComplexWorldTile.prototype = Object.create(WorldTile.prototype);
ComplexWorldTile.prototype.constructor = ComplexWorldTile;

function PlayerWorldTile(pos, username) {
    ComplexWorldTile.call(this, pos);
    this.username = username;
}

PlayerWorldTile.prototype = Object.create(ComplexWorldTile.prototype);
PlayerWorldTile.prototype.constructor = PlayerWorldTile;

PlayerWorldTile.prototype.draw = function(pos, layer) {
    if (layer == 0) {
        drawTileSprite(pos, playerSprite);
    }
    if (layer == 1) {
        var tempPos = pos.copy();
        tempPos.scale(pixelSize);
        tempPos.x += spritePixelSize / 2;
        tempPos.y -= spritePixelSize * 1 / 5;
        context.font = "bold 30px Arial";
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillStyle = "#000000";
        context.fillText(this.username, Math.floor(tempPos.x), Math.floor(tempPos.y));
    }
}

// worldTileType is a number.
function WorldTileFactory(worldTileType) {
    this.worldTileType = worldTileType;
    worldTileFactoryMap[this.worldTileType] = this;
}

// Concrete subclasses of WorldTileFactory must implement these methods:
// convertJsonToTile

function SimpleWorldTileFactory(worldTileType, sprite) {
    WorldTileFactory.call(this, worldTileType);
    this.simpleWorldTile = new SimpleWorldTile(sprite);
}

SimpleWorldTileFactory.prototype = Object.create(WorldTileFactory.prototype);
SimpleWorldTileFactory.prototype.constructor = SimpleWorldTileFactory;

SimpleWorldTileFactory.prototype.convertJsonToTile = function(data, pos) {
    return this.simpleWorldTile;
}

new SimpleWorldTileFactory(
    worldTileTypeSet.empty,
    null
);
new SimpleWorldTileFactory(
    worldTileTypeSet.barrier,
    new Sprite(barrierSpriteSet, 0, 0)
);
new SimpleWorldTileFactory(
    worldTileTypeSet.matterite,
    new Sprite(resourceSpriteSet, 0, 0)
);
new SimpleWorldTileFactory(
    worldTileTypeSet.energite,
    new Sprite(resourceSpriteSet, 0, 1)
);

function ComplexWorldTileFactory(worldTileType) {
    WorldTileFactory.call(this, worldTileType);
}

ComplexWorldTileFactory.prototype = Object.create(WorldTileFactory.prototype);
ComplexWorldTileFactory.prototype.constructor = ComplexWorldTileFactory;

function PlayerWorldTileFactory() {
    WorldTileFactory.call(this, worldTileTypeSet.player);
}

PlayerWorldTileFactory.prototype = Object.create(ComplexWorldTileFactory.prototype);
PlayerWorldTileFactory.prototype.constructor = PlayerWorldTileFactory;

PlayerWorldTileFactory.prototype.convertJsonToTile = function(data, pos) {
    return new PlayerWorldTile(pos, data.username);
}

new PlayerWorldTileFactory();

function TileGrid(outsideTile) {
    this.width = 0;
    this.height = 0;
    this.outsideTile = outsideTile;
    this.length = 0;
    this.tileList = [];
    this.windowOffset = new Pos(0, 0);
}

TileGrid.prototype.convertPosToIndex = function(pos) {
    if (pos.x < 0 || pos.x >= this.width
            || pos.y < 0 || pos.y >= this.height) {
        return null;
    }
    return pos.x + pos.y * this.width;
}

TileGrid.prototype.getTile = function(pos) {
    var index = this.convertPosToIndex(pos);
    if (index === null) {
        return this.outsideTile;
    }
    return this.tileList[index];
}

TileGrid.prototype.setTiles = function(tileList, width, height) {
    this.width = width;
    this.height = height;
    this.length = this.width * this.height;
    this.tileList = tileList;
}

// layer is a number.
TileGrid.prototype.drawLayer = function(pos, layer) {
    var tempOffset = new Pos(0, 0);
    var tempPos = new Pos(0, 0);
    while (tempOffset.y < canvasTileHeight) {
        tempPos.set(pos);
        tempPos.subtract(this.windowOffset);
        tempPos.add(tempOffset);
        var tempTile = this.getTile(tempPos);
        tempPos.set(tempOffset);
        tempPos.scale(spriteSize);
        var tempSprite = tempTile.draw(tempPos, layer);
        tempOffset.x += 1;
        if (tempOffset.x >= canvasTileWidth) {
            tempOffset.x = 0;
            tempOffset.y += 1;
        }
    }
}

TileGrid.prototype.draw = function(pos) {
    var tempLayer = 0;
    while (tempLayer < 2) {
        this.drawLayer(pos, tempLayer);
        tempLayer += 1;
    }
}

worldTileGrid = new TileGrid(loadingWorldTile);

function drawEverything() {
    clearCanvas();
    if (!spritesHaveLoaded) {
        return;
    }
    worldTileGrid.draw(cameraPos);
}

function convertJsonToWorldTile(data, pos) {
    var tempType;
    if (typeof data === "number") {
        tempType = data;
    } else {
        tempType = data.type;
    }
    if (!(tempType in worldTileFactoryMap)) {
        return null;
    }
    var tempFactory = worldTileFactoryMap[tempType];
    return tempFactory.convertJsonToTile(data, pos);
}

function addGetStateCommand() {
    gameUpdateCommandList.push({
        commandName: "getState"
    });
}

addCommandListener("setWorldTileGrid", function(command) {
    worldTileGrid.windowOffset = createPosFromJson(command.pos);
    tempTileList = [];
    var tempOffset = new Pos(0, 0);
    var tempPos = new Pos(0, 0);
    var index = 0;
    while (index < command.tiles.length) {
        tempPos.set(worldTileGrid.windowOffset);
        tempPos.add(tempOffset);
        var tempData = command.tiles[index];
        var tempTile = convertJsonToWorldTile(tempData, tempPos);
        tempTileList.push(tempTile);
        tempOffset.x += 1;
        if (tempOffset.x >= command.width) {
            tempOffset.x = 0;
            tempOffset.y += 1;
        }
        index += 1;
    }
    worldTileGrid.setTiles(tempTileList, command.width, command.height);
});

function ClientDelegate() {
    
}

clientDelegate = new ClientDelegate();

ClientDelegate.prototype.initialize = function() {
    canvasTileWidth = Math.floor(canvasWidth / spritePixelSize);
    canvasTileHeight = Math.floor(canvasHeight / spritePixelSize);
    initializeSpriteSheet(function() {});
}

ClientDelegate.prototype.setLocalPlayerInfo = function(command) {
    
}

ClientDelegate.prototype.addCommandsBeforeUpdateRequest = function() {
    addGetStateCommand();
}

ClientDelegate.prototype.timerEvent = function() {
    drawEverything();
}

ClientDelegate.prototype.keyDownEvent = function(keyCode) {
    if (keyCode == 37) {
        cameraPos.x -= 1;
        return false;
    }
    if (keyCode == 39) {
        cameraPos.x += 1;
        return false;
    }
    if (keyCode == 38) {
        cameraPos.y -= 1;
        return false;
    }
    if (keyCode == 40) {
        cameraPos.y += 1;
        return false;
    }
    return true;
}

ClientDelegate.prototype.keyUpEvent = function(keyCode) {
    
    return true;
}


