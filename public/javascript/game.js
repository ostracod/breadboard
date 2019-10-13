
var worldTileGrid;
// Map from WorldTile type number to WorldTileFactory.
var worldTileFactoryMap = {};

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
// TODO: Create barrier tile.
new SimpleWorldTileFactory(1, new Sprite(barrierSpriteSet, 0, 0));
new SimpleWorldTileFactory(2, new Sprite(resourceSpriteSet, 0, 0));
new SimpleWorldTileFactory(3, new Sprite(resourceSpriteSet, 0, 1));

function TileGrid() {
    this.width = 0;
    this.height = 0;
    this.length = 0;
    this.tileList = [];
}

TileGrid.prototype.setTiles = function(tileList, width, height) {
    this.width = width;
    this.height = height;
    this.length = this.width * this.height;
    this.tileList = tileList;
}

TileGrid.prototype.draw = function() {
    var index = 0;
    var tempPos = new Pos(0, 0);
    var tempPos2 = new Pos(0, 0);
    while (tempPos.y < this.height) {
        var tempTile = this.tileList[index]
        tempPos2.set(tempPos);
        tempPos2.scale(spriteSize);
        var tempSprite = tempTile.getSprite();
        if (tempSprite !== null) {
            tempSprite.draw(context, tempPos2, 6);
        }
        index += 1;
        tempPos.x += 1;
        if (tempPos.x >= this.height) {
            tempPos.x = 0;
            tempPos.y += 1;
        }
    }
}

worldTileGrid = new TileGrid();

function drawEverything() {
    clearCanvas();
    if (!spritesHaveLoaded) {
        return;
    }
    worldTileGrid.draw();
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
        commandName: "getState"
    });
}

addCommandListener("setWorldTileGrid", function(command) {
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
    
    return true;
}

ClientDelegate.prototype.keyUpEvent = function(keyCode) {
    
    return true;
}


