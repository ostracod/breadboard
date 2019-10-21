
var pixelSize = 6;
var spritePixelSize = spriteSize * pixelSize;
var canvasTileWidth;
var canvasTileHeight;
var worldTileGrid;
// Map from WorldTile type number to WorldTileFactory.
var worldTileFactoryMap = {};
var cameraPos = new Pos(0, 0);
var localPlayerUsername;
var localPlayerWorldTile = null;
var playerWalkOffsetSet = [
    new Pos(-1, 0),
    new Pos(1, 0),
    new Pos(0, -1),
    new Pos(0, 1)
];
var playerWorldTileList = [];

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

var loadingWorldTile = new SimpleWorldTile(new Sprite(loadingSpriteSet, 0, 0));
var barrierWorldTile = new SimpleWorldTile(new Sprite(barrierSpriteSet, 0, 0));
var matteriteWorldTile = new SimpleWorldTile(new Sprite(resourceSpriteSet, 0, 0));
var energiteWorldTile = new SimpleWorldTile(new Sprite(resourceSpriteSet, 0, 1));

function EmptyWorldTile() {
    SimpleWorldTile.call(this, null);
}

EmptyWorldTile.prototype = Object.create(SimpleWorldTile.prototype);
EmptyWorldTile.prototype.constructor = EmptyWorldTile;

var emptyWorldTile = new EmptyWorldTile();

function ComplexWorldTile(pos) {
    WorldTile.call(this);
    this.pos = pos.copy();
}

ComplexWorldTile.prototype = Object.create(WorldTile.prototype);
ComplexWorldTile.prototype.constructor = ComplexWorldTile;

ComplexWorldTile.prototype.move = function(offset) {
    var tempNextPos = this.pos.copy();
    tempNextPos.add(offset);
    var tempTile = worldTileGrid.getTile(tempNextPos);
    if (!(tempTile instanceof EmptyWorldTile)) {
        return false;
    }
    worldTileGrid.setTile(this.pos, emptyWorldTile);
    this.pos.set(tempNextPos);
    worldTileGrid.setTile(this.pos, this);
    return true;
}

function convertJsonToWalkController(data) {
    console.log(data);
    if (data === null) {
        return new WalkController(new Pos(0, 0), 0, 0);
    }
    return new WalkController(
        createPosFromJson(data.offset),
        data.delay,
        data.repeatDelay
    );
}

function WalkController(offset, delay, repeatDelay) {
    this.offset = offset;
    this.delay = delay;
    this.repeatDelay = repeatDelay;
    this.player = null;
}

WalkController.prototype.toJson = function() {
    return {
        offset: this.offset.toJson(),
        delay: this.delay,
        repeatDelay: this.repeatDelay
    };
}

WalkController.prototype.walk = function() {
    if (this.delay > 0) {
        return;
    }
    var tempResult = this.player.move(this.offset);
    if (this.player === localPlayerWorldTile && tempResult) {
        addWalkCommand(this.offset);
    }
    this.delay = 2;
}

WalkController.prototype.startWalk = function(offset) {
    if (this.offset.equals(offset)) {
        return;
    }
    this.offset = offset.copy();
    this.walk();
    this.repeatDelay = 10;
}

WalkController.prototype.stopWalk = function(offset) {
    if (!this.offset.equals(offset)) {
        return;
    }
    this.offset.x = 0;
    this.offset.y = 0;
}

WalkController.prototype.tick = function() {
    if (this.delay > 0) {
        this.delay -= 1;
    }
    if (this.offset.x != 0 || this.offset.y != 0) {
        if (this.repeatDelay > 0) {
            this.repeatDelay -= 1;
        } else {
            this.walk();
        }
    }
}

function PlayerWorldTile(pos, username, walkController) {
    ComplexWorldTile.call(this, pos);
    this.username = username;
    if (this.username === localPlayerUsername) {
        if (localPlayerWorldTile !== null) {
            walkController = localPlayerWorldTile.walkController;
        }
        localPlayerWorldTile = this;
    }
    this.walkController = walkController;
    this.walkController.player = this;
    playerWorldTileList.push(this);
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

PlayerWorldTile.prototype.tick = function() {
    this.walkController.tick();
}

// worldTileType is a number.
function WorldTileFactory(worldTileType) {
    this.worldTileType = worldTileType;
    worldTileFactoryMap[this.worldTileType] = this;
}

// Concrete subclasses of WorldTileFactory must implement these methods:
// convertJsonToTile

function SimpleWorldTileFactory(worldTileType, simpleWorldTile) {
    WorldTileFactory.call(this, worldTileType);
    this.simpleWorldTile = simpleWorldTile;
}

SimpleWorldTileFactory.prototype = Object.create(WorldTileFactory.prototype);
SimpleWorldTileFactory.prototype.constructor = SimpleWorldTileFactory;

SimpleWorldTileFactory.prototype.convertJsonToTile = function(data, pos) {
    return this.simpleWorldTile;
}

new SimpleWorldTileFactory(worldTileTypeSet.empty, emptyWorldTile);
new SimpleWorldTileFactory(worldTileTypeSet.barrier, barrierWorldTile);
new SimpleWorldTileFactory(worldTileTypeSet.matterite, matteriteWorldTile);
new SimpleWorldTileFactory(worldTileTypeSet.energite, energiteWorldTile);

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
    return new PlayerWorldTile(
        pos,
        data.username,
        convertJsonToWalkController(data.walkController),
        new WalkController(new Pos(0, 0), 0, 0)
    );
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
    var tempPosX = pos.x - this.windowOffset.x;
    var tempPosY = pos.y - this.windowOffset.y;
    if (tempPosX < 0 || tempPosX >= this.width
            || tempPosY < 0 || tempPosY >= this.height) {
        return null;
    }
    return tempPosX + tempPosY * this.width;
}

TileGrid.prototype.getTile = function(pos) {
    var index = this.convertPosToIndex(pos);
    if (index === null) {
        return this.outsideTile;
    }
    return this.tileList[index];
}

TileGrid.prototype.setTile = function(pos, tile) {
    var index = this.convertPosToIndex(pos);
    if (index === null) {
        return;
    }
    this.tileList[index] = tile;
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
    if (localPlayerWorldTile === null) {
        return;
    }
    cameraPos.set(localPlayerWorldTile.pos);
    cameraPos.x -= Math.floor(canvasTileWidth / 2);
    cameraPos.y -= Math.floor(canvasTileHeight / 2);
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

function addSetWalkControllerCommand(offset) {
    if (localPlayerWorldTile === null) {
        return;
    }
    gameUpdateCommandList.push({
        commandName: "setWalkController",
        walkController: localPlayerWorldTile.walkController.toJson()
    });
}

function addGetStateCommand() {
    gameUpdateCommandList.push({
        commandName: "getState"
    });
}

function addWalkCommand(offset) {
    gameUpdateCommandList.push({
        commandName: "walk",
        offset: offset.toJson()
    });
}

function repeatWalkCommand(command) {
    if (localPlayerWorldTile === null) {
        return;
    }
    var tempOffset = createPosFromJson(command.offset);
    localPlayerWorldTile.move(tempOffset);
}

function repeatGameUpdateCommands() {
    var index = 0;
    while (index < gameUpdateCommandList.length) {
        var tempCommand = gameUpdateCommandList[index];
        if (tempCommand.commandName == "walk") {
            repeatWalkCommand(tempCommand);
        }
        index += 1;
    }
}

addCommandListener("setWorldTileGrid", function(command) {
    worldTileGrid.windowOffset = createPosFromJson(command.pos);
    playerWorldTileList = [];
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
    repeatGameUpdateCommands();
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
    localPlayerUsername = command.username;
}

ClientDelegate.prototype.addCommandsBeforeUpdateRequest = function() {
    addSetWalkControllerCommand();
    addGetStateCommand();
}

ClientDelegate.prototype.timerEvent = function() {
    var index = 0;
    while (index < playerWorldTileList.length) {
        var tempTile = playerWorldTileList[index];
        tempTile.tick();
        index += 1;
    }
    drawEverything();
}

function startLocalPlayerWalk(offset) {
    if (localPlayerWorldTile === null) {
        return;
    }
    localPlayerWorldTile.walkController.startWalk(offset);
}

function stopLocalPlayerWalk(offset) {
    if (localPlayerWorldTile === null) {
        return;
    }
    localPlayerWorldTile.walkController.stopWalk(offset);
}

ClientDelegate.prototype.keyDownEvent = function(keyCode) {
    if (focusedTextInput !== null) {
        return true;
    }
    if (keyCode == 37 || keyCode == 65) {
        startLocalPlayerWalk(playerWalkOffsetSet[0]);
        return false;
    }
    if (keyCode == 39 || keyCode == 68) {
        startLocalPlayerWalk(playerWalkOffsetSet[1]);
        return false;
    }
    if (keyCode == 38 || keyCode == 87) {
        startLocalPlayerWalk(playerWalkOffsetSet[2]);
        return false;
    }
    if (keyCode == 40 || keyCode == 83) {
        startLocalPlayerWalk(playerWalkOffsetSet[3]);
        return false;
    }
    return true;
}

ClientDelegate.prototype.keyUpEvent = function(keyCode) {
    if (keyCode == 37 || keyCode == 65) {
        stopLocalPlayerWalk(playerWalkOffsetSet[0]);
    }
    if (keyCode == 39 || keyCode == 68) {
        stopLocalPlayerWalk(playerWalkOffsetSet[1]);
    }
    if (keyCode == 38 || keyCode == 87) {
        stopLocalPlayerWalk(playerWalkOffsetSet[2]);
    }
    if (keyCode == 40 || keyCode == 83) {
        stopLocalPlayerWalk(playerWalkOffsetSet[3]);
    }
    return true;
}


