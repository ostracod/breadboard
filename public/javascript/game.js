
const pixelSize = 6;
const spritePixelSize = spriteSize * pixelSize;
const playerActionOffsetSet = [
    new Pos(-1, 0),
    new Pos(1, 0),
    new Pos(0, -1),
    new Pos(0, 1)
];
const worldTileActionNameSet = ["remove", "place", "inspect", "attack"];
const circuitTileActionNameSet = ["remove", "place", "inspect"];

let canvasTileWidth;
let canvasTileHeight;
let cameraPos = new Pos(0, 0);
let isMining = false;
let minePlayerPos;
let mineTargetPos;
let mineDelay;
let tileActionNameSet;
let selectedTileAction = "remove";
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

function drawTileBorder(pos, color) {
    if (pos === null) {
        return;
    }
    let tempPosX = pos.x * spritePixelSize;
    let tempPosY = pos.y * spritePixelSize;
    context.fillStyle = color;
    context.fillRect(
        tempPosX - pixelSize, tempPosY - pixelSize,
        spritePixelSize + pixelSize * 2, pixelSize
    );
    context.fillRect(
        tempPosX - pixelSize, tempPosY + spritePixelSize,
        spritePixelSize + pixelSize * 2, pixelSize
    );
    context.fillRect(
        tempPosX - pixelSize, tempPosY,
        pixelSize, spritePixelSize
    );
    context.fillRect(
        tempPosX + spritePixelSize, tempPosY,
        pixelSize, spritePixelSize
    );
}

function drawWorld() {
    cameraPos.set(localPlayerWorldTile.pos);
    cameraPos.x -= Math.floor(canvasTileWidth / 2);
    cameraPos.y -= Math.floor(canvasTileHeight / 2);
    worldTileGrid.drawLayer(cameraPos, 0);
    drawMineCrack();
    worldTileGrid.drawLayer(cameraPos, 1);
}

function drawInspectedCircuit() {
    cameraPos.x = 0;
    cameraPos.y = 0;
    circuitTileGrid.drawLayer(cameraPos, 0);
    drawTileBorder(cursorCircuitTilePos, "#A0A0A0");
    drawTileBorder(inspectedCircuitTilePos, "#000000");
}

function drawEverything() {
    clearCanvas();
    if (!spritesHaveLoaded) {
        return;
    }
    if (localPlayerWorldTile === null) {
        return;
    }
    if (inspectedCircuitSpiritId === null) {
        drawWorld();
    } else {
        drawInspectedCircuit();
    }
}

function startMining(pos) {
    if (isMining && mineTargetPos.equals(pos)) {
        return;
    }
    let tempTile = worldTileGrid.getTile(pos);
    if (!tempTile.canBeMined()) {
        return;
    }
    minePlayerPos = localPlayerWorldTile.pos.copy();
    mineTargetPos = pos;
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
    worldTileGrid.setTile(mineTargetPos, simpleWorldTileSet.empty);
    let tempSpirit = tempTile.spirit;
    localPlayerInventory.incrementItemCountBySpirit(tempSpirit);
    addMineCommand(mineTargetPos, tempSpirit);
    isMining = false;
}

function placeWorldTile(pos) {
    let tempTile = worldTileGrid.getTile(pos);
    if (tempTile.spirit.spiritType !== simpleSpiritTypeSet.empty) {
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
    if (tempSpirit instanceof ComplexSpirit && tempSpirit.id < 0) {
        return;
    }
    tempItem.setCount(tempItem.count - 1);
    tempTile = worldTileFactory.getTileWithSpirit(tempSpirit);
    worldTileGrid.setTile(pos, tempTile);
    addPlaceWorldTileCommand(pos, tempSpirit);
}

function inspectWorldTile(pos) {
    let tempTile = worldTileGrid.getTile(pos);
    let tempSpirit = tempTile.spirit;
    inspectSpirit(tempSpirit);
}

function placeCircuitTile() {
    // TODO: Implement.
    
}

function craftCircuitTile(pos, spiritType, shouldAddCommand = true) {
    let tempSpirit = spiritType.craft();
    let tempTile = circuitTileFactory.getTileWithSpirit(tempSpirit);
    circuitTileGrid.setTile(pos, tempTile);
    if (shouldAddCommand) {
        addCraftCircuitTileCommand(pos, spiritType);
    }
}

function craftOrPlaceCircuitTile() {
    // TODO: Choose spirit or spirit type depending on user selection.
    craftCircuitTile(cursorCircuitTilePos, simpleSpiritTypeSet.wire, true);
}

function removeCircuitTile() {
    craftCircuitTile(cursorCircuitTilePos, simpleSpiritTypeSet.empty, true);
}

function tileActionIsAvailable(name) {
    if (inspectedCircuitSpiritId === null) {
        return (worldTileActionNameSet.indexOf(name) >= 0);
    } else {
        return (circuitTileActionNameSet.indexOf(name) >= 0);
    }
}

function selectTileAction(name) {
    if (selectedTileAction === name || !tileActionIsAvailable(name)) {
        return;
    }
    let tempTag = document.getElementById(name + "TileAction");
    tempTag.checked = true;
    selectedTileAction = name;
}

function selectTileActionByIndex(index) {
    let tempName = tileActionNameSet[index];
    selectTileAction(tempName);
}

function setUpTileActionTags(name) {
    let tempTag = document.getElementById(name + "TileActionContainer")
    tempTag.style.cursor = "pointer";
    tempTag.onclick = () => {
        selectTileAction(name);
    }
    tempTag = document.getElementById(name + "TileAction");
    tempTag.onchange = () => {
        selectTileAction(name);
    }
}

function updateTileActionTags() {
    for (let name of tileActionNameSet) {
        let tempTag = document.getElementById("attackTileActionContainer");
        if (tileActionIsAvailable(name)) {
            tempTag.style.display = "block";
        } else {
            tempTag.style.display = "none";
            if (selectedTileAction === name) {
                selectTileAction("place");
            }
        }
    }
}

function inspectSpirit(spirit, shouldAddCommand = true) {
    if (spirit === null || !spirit.canBeInspected()) {
        return;
    }
    if (spirit instanceof MachineSpirit) {
        inspectMachine(spirit);
    }
    if (spirit instanceof CircuitSpirit) {
        inspectCircuit(spirit);
    }
    if (shouldAddCommand) {
        addInspectCommand(spirit);
    }
}

function inspectMachine(spirit) {
    if (inspectedMachineInventory !== null) {
        if (inspectedMachineInventory.parentSpiritId === spirit.id) {
            return;
        }
        inspectedMachineInventory.cleanUp();
    }
    inspectedMachineInventory = new Inventory("machine", spirit.id);
    localPlayerInventory.updateButtonColors();
    document.getElementById("machineInfoPlaceholder").style.display = "none";
    document.getElementById("machineInfo").style.display = "block";
    showModuleByName("machine");
}

function inspectCircuit(spirit) {
    if (inspectedCircuitSpiritId === spirit.id) {
        return;
    }
    inspectedCircuitSpiritId = spirit.id;
    document.getElementById("circuitInfoPlaceholder").style.display = "none";
    document.getElementById("circuitInfo").style.display = "block";
    showModuleByName("circuit");
    circuitTileGrid.clear();
    cursorCircuitTilePos = null;
    inspectedCircuitTilePos = null;
    updateTileActionTags();
}

function stopInspectingSpirit(spiritId, shouldAddCommand = true) {
    if (spiritId === null) {
        return;
    }
    if (inspectedMachineInventory !== null
            && inspectedMachineInventory.parentSpiritId === spiritId) {
        stopInspectingMachine();
    }
    if (inspectedCircuitSpiritId === spiritId) {
        stopInspectingCircuit();
    }
    if (shouldAddCommand) {
        addStopInspectingCommand(spiritId);
    }
}

function stopInspectingMachine() {
    document.getElementById("machineInfoPlaceholder").style.display = "block";
    document.getElementById("machineInfo").style.display = "none";
    hideModuleByName("machine");
    inspectedMachineInventory.cleanUp();
    inspectedMachineInventory = null;
}

function stopInspectingCircuit() {
    document.getElementById("circuitInfoPlaceholder").style.display = "block";
    document.getElementById("circuitInfo").style.display = "none";
    hideModuleByName("circuit");
    inspectedCircuitSpiritId = null;
    worldTileGrid.clear();
    updateTileActionTags();
}

function addInventoryCommand(command, inventoryUpdateList) {
    for (let update of inventoryUpdateList) {
        update.spirit.addToCache();
    }
    command.inventoryUpdates = inventoryUpdateList.map(update => update.getClientJson());
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

function addPlaceTileCommand(commandName, pos, spirit) {
    addInventoryCommand({
        commandName: commandName,
        pos: pos.toJson(),
        spiritReference: spirit.getReference().getJson()
    }, [
        localPlayerInventory.getInventoryUpdate(spirit)
    ]);
    spirit.addToCache();
}

function addPlaceWorldTileCommand(pos, spirit) {
    addPlaceTileCommand("placeWorldTile", pos, spirit);
}

function addPlaceCircuitTileCommand(pos, spirit) {
    addPlaceTileCommand("placeCircuitTile", pos, spirit);
}

function addCraftCircuitTileCommand(pos, spiritType) {
    gameUpdateCommandList.push({
        commandName: "craftCircuitTile",
        pos: pos.toJson(),
        spiritType: spiritType.getJson()
    });
}

function addCraftCommand(recipe, inventoryUpdateList) {
    addInventoryCommand({
        commandName: "craft",
        recipeId: recipe.id
    }, inventoryUpdateList);
}

function addInspectCommand(spirit) {
    gameUpdateCommandList.push({
        commandName: "inspect",
        spiritReference: spirit.getReference().getJson()
    });
    spirit.addToCache();
}

function addTransferCommand(sourceInventory, destinationInventory, spirit) {
    addInventoryCommand({
        commandName: "transfer",
        sourceParentSpiritId: sourceInventory.parentSpiritId,
        destinationParentSpiritId: destinationInventory.parentSpiritId,
        spiritReference: spirit.getReference().getJson()
    }, [
        sourceInventory.getInventoryUpdate(spirit),
        destinationInventory.getInventoryUpdate(spirit)
    ]);
}

function addRecycleCommand(inventoryItem, inventoryUpdateList) {
    let tempReference = inventoryItem.spirit.getReference();
    addInventoryCommand({
        commandName: "recycle",
        parentSpiritId: inventoryItem.inventory.parentSpiritId,
        spiritReference: tempReference.getJson()
    }, inventoryUpdateList);
}

function addStopInspectingCommand(spiritId) {
    gameUpdateCommandList.push({
        commandName: "stopInspecting",
        spiritId: spiritId
    });
}

function addInventoryCommandRepeater(commandName, handler = null) {
    addCommandRepeater(commandName, command => {
        for (let updateData of command.inventoryUpdates) {
            let tempUpdate = convertClientJsonToInventoryUpdate(updateData);
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
    worldTileGrid.setTile(tempPos, simpleWorldTileSet.empty);
});

function addPlaceTileCommandRepeater(commandName, tileGrid) {
    addInventoryCommandRepeater(commandName, command => {
        let tempPos = createPosFromJson(command.pos);
        let tempSpiritReference = convertJsonToSpiritReference(command.spiritReference);
        let tempSpirit = tempSpiritReference.getCachedSpirit();
        let tempTile = tileGrid.tileFactory.getTileWithSpirit(tempSpirit);
        tileGrid.setTile(tempPos, tempTile);
    });
}

addPlaceTileCommandRepeater("placeWorldTile", worldTileGrid);
addPlaceTileCommandRepeater("placeCircuitTile", circuitTileGrid);

addCommandRepeater("craftCircuitTile", command => {
    let tempPos = createPosFromJson(command.pos);
    let tempSpiritType = convertJsonToSpiritType(command.spiritType);
    craftCircuitTile(cursorCircuitTilePos, tempSpiritType, false);
});

addInventoryCommandRepeater("craft");
addInventoryCommandRepeater("transfer");
addInventoryCommandRepeater("recycle");

addCommandRepeater("inspect", command => {
    let tempReference = convertJsonToSpiritReference(command.spiritReference);
    tempSpirit = tempReference.getCachedSpirit();
    inspectSpirit(tempSpirit, false);
});

addCommandRepeater("stopInspecting", command => {
    stopInspectingSpirit(command.spiritId, false);
});

addCommandListener("setWorldTileGrid", command => {
    worldTileGrid.windowOffset = createPosFromJson(command.pos);
    playerWorldTileList = [];
    tempTileList = command.tiles.map(data => {
        return worldTileFactory.convertClientJsonToTile(data)
    });
    worldTileGrid.setTiles(tempTileList, command.width, command.height);
});

addCommandListener("setCircuitTileGrid", command => {
    tempTileList = command.tiles.map(data => {
        return circuitTileFactory.convertClientJsonToTile(data)
    });
    circuitTileGrid.setTiles(tempTileList, circuitSize, circuitSize);
});

addCommandListener("updateInventoryItem", command => {
    let tempUpdateData = command.inventoryUpdate;
    let tempUpdate = convertClientJsonToInventoryUpdate(tempUpdateData);
    if (tempUpdate === null) {
        return;
    }
    tempUpdate.applyToInventory();
});

addCommandListener("stopInspecting", command => {
    stopInspectingSpirit(command.spiritId, false);
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
        tileActionNameSet = worldTileActionNameSet.slice();
        for (let name of circuitTileActionNameSet) {
            if (tileActionNameSet.indexOf(name) < 0) {
                tileActionNameSet.push(name);
            }
        }
        for (let name of tileActionNameSet) {
            setUpTileActionTags(name);
        }
        
        canvas.onmousemove = event => {
            let tempPos = convertMouseEventToPos(event);
            if (tempPos !== null) {
                mouseMoveEvent(tempPos);
            }
        };
        
        canvas.onmousedown = event => {
            let tempPos = convertMouseEventToPos(event);
            if (tempPos !== null) {
                mouseDownEvent(tempPos);
            }
            return false;
        };
        
        canvas.onmouseleave = () => {
            cursorCircuitTilePos = null;
        }
    }
    
    setLocalPlayerInfo(command) {
        localPlayerUsername = command.username;
        localPlayerSpiritId = command.extraFields.complexSpiritId;
        localPlayerInventory = new Inventory("player", localPlayerSpiritId);
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
        if (keyCode === 37 || keyCode === 65) {
            startLocalPlayerAction(0);
            return false;
        }
        if (keyCode === 39 || keyCode === 68) {
            startLocalPlayerAction(1);
            return false;
        }
        if (keyCode === 38 || keyCode === 87) {
            startLocalPlayerAction(2);
            return false;
        }
        if (keyCode === 40 || keyCode === 83) {
            startLocalPlayerAction(3);
            return false;
        }
        if (keyCode === 49) {
            selectTileActionByIndex(0);
        }
        if (keyCode === 50) {
            selectTileActionByIndex(1);
        }
        if (keyCode === 51) {
            selectTileActionByIndex(2);
        }
        if (keyCode === 52) {
            selectTileActionByIndex(3);
        }
        if (keyCode === 82) {
            localPlayerInventory.selectPreviousItem();
        }
        if (keyCode === 70) {
            localPlayerInventory.selectNextItem();
        }
        if (keyCode === 27) {
            stopInspectingSpirit(inspectedCircuitSpiritId);
            return false;
        }
        return true;
    }
    
    keyUpEvent(keyCode) {
        if (keyCode === 37 || keyCode === 65) {
            stopLocalPlayerAction(0);
        }
        if (keyCode === 39 || keyCode === 68) {
            stopLocalPlayerAction(1);
        }
        if (keyCode === 38 || keyCode === 87) {
            stopLocalPlayerAction(2);
        }
        if (keyCode === 40 || keyCode === 83) {
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
        let tempPos = localPlayerWorldTile.pos.copy();
        tempPos.add(offset);
        if (selectedTileAction === "remove") {
            startMining(tempPos);
        } else if (selectedTileAction === "place") {
            placeWorldTile(tempPos);
        } else if (selectedTileAction === "inspect") {
            inspectWorldTile(tempPos);
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

function convertMouseEventToPos(event) {
    let tempX = Math.floor((event.offsetX - 3) / (spritePixelSize / 2));
    let tempY = Math.floor((event.offsetY - 3) / (spritePixelSize / 2));
    if (tempX < 0 || tempX >= canvasTileWidth || tempY < 0 || tempY >= canvasTileHeight) {
        return null;
    }
    return new Pos(tempX, tempY);
}

function mouseMoveEvent(pos) {
    cursorCircuitTilePos = pos;
}

function mouseDownEvent(pos) {
    if (inspectedCircuitSpiritId === null) {
        return;
    }
    cursorCircuitTilePos = pos;
    if (selectedTileAction === "remove") {
        removeCircuitTile();
    } else if (selectedTileAction === "place") {
        craftOrPlaceCircuitTile();
    } else if (selectedTileAction === "inspect") {
        inspectedCircuitTilePos = pos;
    }
}


