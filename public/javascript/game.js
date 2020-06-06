
const pixelSize = 6;
const spritePixelSize = spriteSize * pixelSize;
let canvasTileWidth;
let canvasTileHeight;
let cameraPos = new Pos(0, 0);
let localPlayerUsername;
let localPlayerSpiritId;
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
// Array of {spirit: ComplexSpirit, updateRequestCount: number}.
let complexSpiritCache = [];
let updateRequestCount = 0;

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
    let tempSpirit = tempTile.spirit;
    localPlayerInventory.incrementItemCountBySpirit(tempSpirit);
    addMineCommand(mineTargetPos, tempSpirit);
    isMining = false;
}

function placeWorldTile(offset) {
    let tempPos = localPlayerWorldTile.pos.copy();
    tempPos.add(offset);
    let tempTile = worldTileGrid.getTile(tempPos);
    if (tempTile.spirit.spiritType !== emptySpiritType) {
        return
    }
    let tempItem = localPlayerInventory.selectedItem;
    if (tempItem === null) {
        return;
    }
    if (tempItem.count < 1) {
        return;
    }
    let tempSpirit = tempItem.spirit;
    if (tempSpirit instanceof ComplexSpirit && tempSpirit.id === null) {
        return;
    }
    tempItem.setCount(tempItem.count - 1);
    tempTile = getWorldTileWithSpirit(tempSpirit);
    worldTileGrid.setTile(tempPos, tempTile);
    addPlaceWorldTileCommand(tempPos, tempSpirit);
    addSpiritToCache(tempSpirit);
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

function inspectMachine(containerName, spirit) {
    if (inspectedMachineInventory !== null) {
        inspectedMachineInventory.cleanUp();
    }
    let tempTag = document.getElementById("machineInventoryItems");
    inspectedMachineInventory = new Inventory("machineInventory", tempTag, spirit.id);
    document.getElementById("machineInfoPlaceholder").style.display = "none";
    document.getElementById("machineInfo").style.display = "block";
    showModuleByName("machine");
    addInspectCommand(containerName, spirit);
}

function findComplexSpiritInCache(spiritId) {
    for (let index = 0; index < complexSpiritCache.length; index++) {
        let tempItem = complexSpiritCache[index];
        if (tempItem.spirit.id === spiritId) {
            return index;
        }
    }
    return -1;
}

function getSpiritInCache(spiritReference) {
    if (spiritReference instanceof SimpleSpiritReference) {
        return simpleSpiritSet[spiritReference.serialInteger];
    }
    let index = findComplexSpiritInCache(spiritReference.id);
    if (index < 0) {
        return null;
    } else {
        return complexSpiritCache[index].spirit;
    }
}

function addSpiritToCache(spirit) {
    if (!(spirit instanceof ComplexSpirit)) {
        return;
    }
    let index = findComplexSpiritInCache(spirit.id);
    if (index >= 0) {
        complexSpiritCache[index].spirit = spirit;
        return;
    }
    complexSpiritCache.push({
        spirit: spirit,
        updateRequestCount: updateRequestCount
    });
}

function removeStaleSpiritsInCache() {
    for (let index = complexSpiritCache.length - 1; index >= 0; index--) {
        let tempItem = complexSpiritCache[index];
        if (tempItem.updateRequestCount < updateRequestCount - 10) {
            complexSpiritCache.splice(index, 1);
        }
    }
}

function addInventoryCommand(command, inventoryUpdateList) {
    for (let update of inventoryUpdateList) {
        addSpiritToCache(update.spirit);
    }
    command.inventoryUpdates = inventoryUpdateList.map(update => update.getJson());
    gameUpdateCommandList.push(command);
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

function addMineCommand(pos, spirit) {
    addInventoryCommand({
        commandName: "mine",
        pos: pos.toJson()
    }, [
        localPlayerInventory.getInventoryUpdate(spirit)
    ]);
}

function addPlaceWorldTileCommand(pos, spirit) {
    addInventoryCommand({
        commandName: "placeWorldTile",
        pos: pos.toJson(),
        spirit: spirit.getReference().getJson()
    }, [
        localPlayerInventory.getInventoryUpdate(spirit)
    ]);
}

function addCraftCommand(recipe) {
    addInventoryCommand({
        commandName: "craft",
        recipeId: recipe.id
    }, []); // TODO: Add inventory updates.
}

function addInspectCommand(containerName, spirit) {
    gameUpdateCommandList.push({
        commandName: "inspect",
        containerName: containerName,
        spirit: spirit.getReference().getJson()
    });
}

function addTransferCommand(sourceInventory, destinationInventory, spirit) {
    addInventoryCommand({
        commandName: "transfer",
        sourceContainerName: sourceInventory.containerName,
        destinationContainerName: destinationInventory.containerName,
        spirit: spirit.getReference().getJson()
    }, [
        sourceInventory.getInventoryUpdate(spirit),
        destinationInventory.getInventoryUpdate(spirit)
    ]);
}

function addInventoryCommandRepeater(commandName, handler = null) {
    addCommandRepeater(commandName, command => {
        for (let updateData of command.inventoryUpdates) {
            let tempUpdate = convertJsonToInventoryUpdate(updateData);
            tempUpdate.applyToInventory();
        }
        if (handler !== null) {
            handler(command);
        }
    });
}

addCommandRepeater("walk", command => {
    if (localPlayerWorldTile === null) {
        return;
    }
    let tempOffset = createPosFromJson(command.offset);
    localPlayerWorldTile.move(tempOffset);
});

addInventoryCommandRepeater("mine", command => {
    let tempPos = createPosFromJson(command.pos);
    worldTileGrid.setTile(tempPos, emptyWorldTile);
});

addInventoryCommandRepeater("placeWorldTile", command => {
    let tempPos = createPosFromJson(command.pos);
    let tempSpiritReference = convertJsonToSpiritReference(command.spirit);
    let tempSpirit = getSpiritInCache(tempSpiritReference);
    let tempTile = getWorldTileWithSpirit(tempSpirit);
    worldTileGrid.setTile(tempPos, tempTile);
});

addInventoryCommandRepeater("craft");
addInventoryCommandRepeater("transfer");

addCommandListener("setWorldTileGrid", command => {
    worldTileGrid.windowOffset = createPosFromJson(command.pos);
    playerWorldTileList = [];
    tempTileList = [];
    let tempOffset = new Pos(0, 0);
    let tempPos = new Pos(0, 0);
    for (let data of command.tiles) {
        tempPos.set(worldTileGrid.windowOffset);
        tempPos.add(tempOffset);
        let tempTile = convertClientJsonToWorldTile(data);
        tempTile.addEvent(tempPos);
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
    let tempInventory = parentSpiritInventoryMap[command.parentSpiritId];
    if (typeof tempInventory === "undefined") {
        return;
    }
    let tempItemData = command.inventoryItem;
    let tempSpirit = convertClientJsonToSpirit(tempItemData.spirit);
    if (tempSpirit instanceof ComplexSpirit) {
        let tempResult = tempInventory.populateComplexSpiritId(tempSpirit);
        if (tempResult) {
            return;
        }
    }
    tempInventory.setItemCountBySpirit(tempSpirit, tempItemData.count);
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
    }
    
    setLocalPlayerInfo(command) {
        localPlayerUsername = command.username;
        localPlayerSpiritId = command.extraFields.complexSpiritId;
        let tempTag = document.getElementById("playerInventoryItems");
        localPlayerInventory = new Inventory("playerInventory", tempTag, localPlayerSpiritId);
    }
    
    addCommandsBeforeUpdateRequest() {
        addSetWalkControllerCommand();
        addGetStateCommand();
        updateRequestCount += 1;
        removeStaleSpiritsInCache();
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


