
const pixelSize = 6;
const spritePixelSize = spriteSize * pixelSize;
let canvasTileWidth;
let canvasTileHeight;
let cameraPos = new Pos(0, 0);
let localPlayerUsername;
const playerActionOffsetSet = [
    new Pos(-1, 0),
    new Pos(1, 0),
    new Pos(0, -1),
    new Pos(0, 1)
];
let isMining = false;
let minePlayerPos;
let mineTargetPos;
let mineDelay;
const worldActionNameSet = ["mine", "place", "inspect", "attack"];
let selectedWorldAction = worldActionNameSet[0];

function drawMineCrack() {
    if (!isMining) {
        return;
    }
    let tempPos = mineTargetPos.copy();
    tempPos.subtract(cameraPos);
    tempPos.scale(spriteSize);
    let tempIndex = 3 - Math.floor(mineDelay / 9);
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
    let tempPos = localPlayerWorldTile.pos.copy();
    tempPos.add(offset);
    if (isMining && mineTargetPos.equals(tempPos)) {
        return;
    }
    let tempTile = worldTileGrid.getTile(tempPos);
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
    let tempTile = worldTileGrid.getTile(mineTargetPos);
    if (!tempTile.canBeMined()) {
        return;
    }
    mineDelay -= 1;
    if (mineDelay > 0) {
        return;
    }
    worldTileGrid.setTile(mineTargetPos, emptyWorldTile);
    localPlayerInventory.incrementItemCountBySpirit(tempTile.spirit);
    addMineCommand(mineTargetPos);
    isMining = false;
}

function placeWorldTile(offset) {
    let tempPos = localPlayerWorldTile.pos.copy();
    tempPos.add(offset);
    let tempTile = worldTileGrid.getTile(tempPos);
    if (!(tempTile.spirit instanceof EmptySpirit)) {
        return
    }
    let tempItem = localPlayerInventory.selectedItem;
    if (tempItem === null) {
        return;
    }
    if (tempItem.count < 1) {
        return;
    }
    tempItem.setCount(tempItem.count - 1);
    tempTile = getWorldTileWithSpirit(tempItem.spirit);
    worldTileGrid.setTile(tempPos, tempTile);
    addPlaceWorldTileCommand(tempPos, tempItem.spirit);
}

function selectWorldAction(name) {
    if (selectedWorldAction == name) {
        return;
    }
    let tempTag = document.getElementById(name + "WorldAction");
    tempTag.checked = true;
    selectedWorldAction = name;
}

function selectWorldActionByIndex(index) {
    let tempName = worldActionNameSet[index];
    selectWorldAction(tempName);
}

function setUpWorldActionTags(name) {
    let tempTag = document.getElementById(name + "WorldActionContainer")
    tempTag.style.cursor = "pointer";
    tempTag.onclick = () => {
        selectWorldAction(name);
    }
    tempTag = document.getElementById(name + "WorldAction");
    tempTag.onchange = () => {
        selectWorldAction(name);
    }
}

function addEnterWorldCommand() {
    gameUpdateCommandList.push({
        commandName: "enterWorld"
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

function addMineCommand(pos) {
    gameUpdateCommandList.push({
        commandName: "mine",
        pos: pos.toJson()
    });
}

function addPlaceWorldTileCommand(pos, spirit) {
    gameUpdateCommandList.push({
        commandName: "placeWorldTile",
        pos: pos.toJson(),
        spirit: spirit.getReference().getJson()
    });
}

function addCraftCommand(recipe) {
    gameUpdateCommandList.push({
        commandName: "craft",
        recipeId: recipe.id
    });
}

addCommandRepeater("walk", command => {
    if (localPlayerWorldTile === null) {
        return;
    }
    let tempOffset = createPosFromJson(command.offset);
    localPlayerWorldTile.move(tempOffset);
});

addCommandRepeater("mine", command => {
    let tempPos = createPosFromJson(command.pos);
    worldTileGrid.setTile(tempPos, emptyWorldTile);
});

addCommandRepeater("placeWorldTile", command => {
    let tempPos = createPosFromJson(command.pos);
    let tempSpiritReference = convertJsonToSpiritReference(command.spirit);
    // TODO: We somehow need to translate tempSpiritReference to tempSpirit.
    
    //let tempTile = getWorldTileWithSpirit(tempSpirit);
    //worldTileGrid.setTile(tempPos, tempTile);
});

addCommandListener("setWorldTileGrid", command => {
    worldTileGrid.windowOffset = createPosFromJson(command.pos);
    playerWorldTileList = [];
    tempTileList = [];
    let tempOffset = new Pos(0, 0);
    let tempPos = new Pos(0, 0);
    for (let data of command.tiles) {
        tempPos.set(worldTileGrid.windowOffset);
        tempPos.add(tempOffset);
        let tempTile = convertJsonToWorldTile(data, tempPos);
        tempTileList.push(tempTile);
        tempOffset.x += 1;
        if (tempOffset.x >= command.width) {
            tempOffset.x = 0;
            tempOffset.y += 1;
        }
    }
    worldTileGrid.setTiles(tempTileList, command.width, command.height);
});

addCommandListener("updateInventoryItem", command => {
    let tempItemData = command.inventoryItem;
    let tempSpirit = convertClientJsonToSpirit(tempItemData.spirit);
    localPlayerInventory.setItemCountBySpirit(tempSpirit, tempItemData.count);
});

class ClientDelegate {
    
    constructor() {
        
    }
    
    initialize() {
        canvasTileWidth = Math.floor(canvasWidth / spritePixelSize);
        canvasTileHeight = Math.floor(canvasHeight / spritePixelSize);
        initializeSpriteSheet(() => {
            drawAllRecipes();
        });
        addEnterWorldCommand();
        for (let name of worldActionNameSet) {
            setUpWorldActionTags(name);
        }
        let tempTag = document.getElementById("playerInventoryItems");
        localPlayerInventory = new Inventory(tempTag);
    }
    
    setLocalPlayerInfo(command) {
        localPlayerUsername = command.username;
    }
    
    addCommandsBeforeUpdateRequest() {
        addSetWalkControllerCommand();
        addGetStateCommand();
    }
    
    timerEvent() {
        for (let tile of playerWorldTileList) {
            tile.tick();
        }
        processMineTick();
        drawEverything();
    }
    
    keyDownEvent(keyCode) {
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
    
    keyUpEvent(keyCode) {
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
}

clientDelegate = new ClientDelegate();

function startLocalPlayerAction(offsetIndex) {
    if (localPlayerWorldTile === null) {
        return;
    }
    let offset = playerActionOffsetSet[offsetIndex];
    if (shiftKeyIsHeld) {
        if (selectedWorldAction == "mine") {
            startMining(offset);
        } else if (selectedWorldAction == "place") {
            placeWorldTile(offset);
        }
    } else {
        localPlayerWorldTile.walkController.startWalk(offset);
    }
}

function stopLocalPlayerAction(offsetIndex) {
    if (localPlayerWorldTile === null) {
        return;
    }
    let offset = playerActionOffsetSet[offsetIndex];
    localPlayerWorldTile.walkController.stopWalk(offset);
}


