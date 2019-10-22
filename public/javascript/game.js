
var pixelSize = 6;
var spritePixelSize = spriteSize * pixelSize;
var canvasTileWidth;
var canvasTileHeight;
var cameraPos = new Pos(0, 0);
var localPlayerUsername;
var playerWalkOffsetSet = [
    new Pos(-1, 0),
    new Pos(1, 0),
    new Pos(0, -1),
    new Pos(0, 1)
];

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


