
var pixelSize = 6;
var spritePixelSize = spriteSize * pixelSize;
var canvasTileWidth;
var canvasTileHeight;
var cameraPos = new Pos(0, 0);
var localPlayerUsername;
var playerActionOffsetSet = [
    new Pos(-1, 0),
    new Pos(1, 0),
    new Pos(0, -1),
    new Pos(0, 1)
];
var isMining = false;
var minePlayerPos;
var mineTargetPos;
var mineDelay;
var worldActionNameSet = ["mine", "place", "inspect", "attack"];
var selectedWorldAction = worldActionNameSet[0];

function drawMineCrack() {
    if (!isMining) {
        return;
    }
    var tempPos = mineTargetPos.copy();
    tempPos.subtract(cameraPos);
    tempPos.scale(spriteSize);
    var tempIndex = 3 - Math.floor(mineDelay / 9);
    if (tempIndex < 0) {
        tempIndex = 0;
    }
    if (tempIndex > 3) {
        tempIndex = 3;
    }
    crackSpriteSet.draw(context, tempPos, tempIndex, 0, pixelSize);
}

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
    worldTileGrid.drawLayer(cameraPos, 0);
    drawMineCrack();
    worldTileGrid.drawLayer(cameraPos, 1);
}

function startMining(offset) {
    var tempPos = localPlayerWorldTile.pos.copy();
    tempPos.add(offset);
    if (isMining && mineTargetPos.equals(tempPos)) {
        return;
    }
    var tempTile = worldTileGrid.getTile(tempPos);
    if (!tempTile.canBeMined()) {
        return;
    }
    minePlayerPos = localPlayerWorldTile.pos.copy();
    mineTargetPos = tempPos;
    mineDelay = 36;
    isMining = true;
}

function processMineTick() {
    if (!isMining) {
        return;
    }
    if (!localPlayerWorldTile.pos.equals(minePlayerPos)) {
        isMining = false;
        return;
    }
    var tempTile = worldTileGrid.getTile(mineTargetPos);
    if (!tempTile.canBeMined()) {
        return;
    }
    mineDelay -= 1;
    if (mineDelay > 0) {
        return;
    }
    worldTileGrid.setTile(mineTargetPos, emptyWorldTile);
    addMineCommand(mineTargetPos);
    isMining = false;
}

function selectWorldAction(name) {
    if (selectedWorldAction == name) {
        return;
    }
    var tempTag = document.getElementById(name + "WorldAction");
    tempTag.checked = true;
    selectedWorldAction = name;
}

function selectWorldActionByIndex(index) {
    var tempName = worldActionNameSet[index];
    selectWorldAction(tempName);
}

function setUpWorldActionTags(name) {
    var tempTag = document.getElementById(name + "WorldActionContainer")
    tempTag.style.cursor = "pointer";
    tempTag.onclick = function() {
        selectWorldAction(name);
    }
    var tempTag = document.getElementById(name + "WorldAction");
    tempTag.onchange = function() {
        selectWorldAction(name);
    }
}

function addGetInventoryCommand() {
    gameUpdateCommandList.push({
        commandName: "getInventory"
    });
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

function addMineCommand(offset) {
    gameUpdateCommandList.push({
        commandName: "mine",
        pos: mineTargetPos.toJson()
    });
}

addCommandRepeater("walk", function(command) {
    if (localPlayerWorldTile === null) {
        return;
    }
    var tempOffset = createPosFromJson(command.offset);
    localPlayerWorldTile.move(tempOffset);
});

addCommandRepeater("mine", function(command) {
    var tempPos = createPosFromJson(command.pos);
    worldTileGrid.setTile(tempPos, emptyWorldTile);
});

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
});

addCommandListener("updateInventoryItem", function(command) {
    var tempItemData = command.inventoryItem;
    var tempSpirit = convertJsonToSpirit(tempItemData.spirit);
    localPlayerInventory.updateItemBySpirit(tempSpirit, tempItemData.count);
});

function ClientDelegate() {
    
}

clientDelegate = new ClientDelegate();

ClientDelegate.prototype.initialize = function() {
    canvasTileWidth = Math.floor(canvasWidth / spritePixelSize);
    canvasTileHeight = Math.floor(canvasHeight / spritePixelSize);
    initializeSpriteSheet(function() {});
    addGetInventoryCommand();
    var index = 0;
    while (index < worldActionNameSet.length) {
        var tempName = worldActionNameSet[index];
        setUpWorldActionTags(tempName);
        index += 1;
    }
    var tempTag = document.getElementById("playerInventoryItems");
    localPlayerInventory = new Inventory(tempTag);
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
    processMineTick();
    drawEverything();
}

function startLocalPlayerAction(offsetIndex) {
    if (localPlayerWorldTile === null) {
        return;
    }
    var offset = playerActionOffsetSet[offsetIndex];
    if (shiftKeyIsHeld) {
        startMining(offset);
    } else {
        localPlayerWorldTile.walkController.startWalk(offset);
    }
}

function stopLocalPlayerAction(offsetIndex) {
    if (localPlayerWorldTile === null) {
        return;
    }
    var offset = playerActionOffsetSet[offsetIndex];
    localPlayerWorldTile.walkController.stopWalk(offset);
}

ClientDelegate.prototype.keyDownEvent = function(keyCode) {
    if (focusedTextInput !== null) {
        return true;
    }
    if (keyCode == 37 || keyCode == 65) {
        startLocalPlayerAction(0);
        return false;
    }
    if (keyCode == 39 || keyCode == 68) {
        startLocalPlayerAction(1);
        return false;
    }
    if (keyCode == 38 || keyCode == 87) {
        startLocalPlayerAction(2);
        return false;
    }
    if (keyCode == 40 || keyCode == 83) {
        startLocalPlayerAction(3);
        return false;
    }
    if (keyCode == 49) {
        selectWorldActionByIndex(0);
    }
    if (keyCode == 50) {
        selectWorldActionByIndex(1);
    }
    if (keyCode == 51) {
        selectWorldActionByIndex(2);
    }
    if (keyCode == 52) {
        selectWorldActionByIndex(3);
    }
    if (keyCode == 82) {
        localPlayerInventory.selectPreviousItem();
    }
    if (keyCode == 70) {
        localPlayerInventory.selectNextItem();
    }
    return true;
}

ClientDelegate.prototype.keyUpEvent = function(keyCode) {
    if (keyCode == 37 || keyCode == 65) {
        stopLocalPlayerAction(0);
    }
    if (keyCode == 39 || keyCode == 68) {
        stopLocalPlayerAction(1);
    }
    if (keyCode == 38 || keyCode == 87) {
        stopLocalPlayerAction(2);
    }
    if (keyCode == 40 || keyCode == 83) {
        stopLocalPlayerAction(3);
    }
    return true;
}


