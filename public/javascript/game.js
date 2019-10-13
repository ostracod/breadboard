
var pixelSize = 6;
var spritePixelSize = spriteSize * pixelSize;
var canvasTileWidth;
var canvasTileHeight;
var worldTileGrid;
var worldTileGridPos = new Pos(0, 0);
// Map from WorldTile type number to WorldTileFactory.
var worldTileFactoryMap = {};
var loadingWorldTile;
var cameraPos = new Pos(0, 0);

function Tile() {
    
}

// Concrete subclasses of Tile must implement these methods:
// getSprite

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

SimpleWorldTile.prototype.getSprite = function() {
    return this.sprite;
}

loadingWorldTile = new SimpleWorldTile(new Sprite(loadingSpriteSet, 0, 0));

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

SimpleWorldTileFactory.prototype.convertJsonToTile = function() {
    return this.simpleWorldTile;
}

new SimpleWorldTileFactory(0, null);
new SimpleWorldTileFactory(1, new Sprite(barrierSpriteSet, 0, 0));
new SimpleWorldTileFactory(2, new Sprite(resourceSpriteSet, 0, 0));
new SimpleWorldTileFactory(3, new Sprite(resourceSpriteSet, 0, 1));

function TileGrid(outsideTile) {
    this.width = 0;
    this.height = 0;
    this.outsideTile = outsideTile;
    this.length = 0;
    this.tileList = [];
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

TileGrid.prototype.draw = function(pos) {
    var tempOffset = new Pos(0, 0);
    var tempPos = new Pos(0, 0);
    while (tempOffset.y < canvasTileHeight) {
        tempPos.set(pos);
        tempPos.add(tempOffset);
        var tempTile = this.getTile(tempPos);
        var tempSprite = tempTile.getSprite();
        if (tempSprite !== null) {
            tempPos.set(tempOffset);
            tempPos.scale(spriteSize);
            tempSprite.draw(context, tempPos, pixelSize);
        }
        tempOffset.x += 1;
        if (tempOffset.x >= canvasTileWidth) {
            tempOffset.x = 0;
            tempOffset.y += 1;
        }
    }
}

worldTileGrid = new TileGrid(loadingWorldTile);

function drawEverything() {
    clearCanvas();
    if (!spritesHaveLoaded) {
        return;
    }
    var tempPos = cameraPos.copy();
    tempPos.subtract(worldTileGridPos);
    worldTileGrid.draw(tempPos);
}

function convertJsonToWorldTile(data) {
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
    return tempFactory.convertJsonToTile(data);
}

function addGetStateCommand() {
    gameUpdateCommandList.push({
        commandName: "getState",
        cameraPos: this.cameraPos.toJson()
    });
}

addCommandListener("setWorldTileGrid", function(command) {
    worldTileGridPos = createPosFromJson(command.pos);
    tempTileList = [];
    var index = 0;
    while (index < command.tiles.length) {
        var tempData = command.tiles[index];
        var tempTile = convertJsonToWorldTile(tempData);
        tempTileList.push(tempTile);
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
    }
    if (keyCode == 39) {
        cameraPos.x += 1;
    }
    if (keyCode == 38) {
        cameraPos.y -= 1;
    }
    if (keyCode == 40) {
        cameraPos.y += 1;
    }
    return true;
}

ClientDelegate.prototype.keyUpEvent = function(keyCode) {
    
    return true;
}


