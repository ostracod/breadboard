
const pixelSize = 6;
const spritePixelSize = spriteSize * pixelSize;
const playerActionOffsetSet = [
    new Pos(-1, 0),
    new Pos(1, 0),
    new Pos(0, -1),
    new Pos(0, 1)
];
const worldActionNameSet = ["mine", "place", "inspect", "attack"];

let canvasTileWidth;
let canvasTileHeight;
let cameraPos = new Pos(0, 0);
let isMining = false;
let minePlayerPos;
let mineTargetPos;
let mineDelay;
let selectedWorldAction = worldActionNameSet[0];
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
    tempTile = getWorldTileWithSpirit(tempSpirit);
    worldTileGrid.setTile(pos, tempTile);
    addPlaceWorldTileCommand(pos, tempSpirit);
}

function inspectWorldTile(pos) {
    let tempTile = worldTileGrid.getTile(pos);
    let tempSpirit = tempTile.spirit;
    inspectSpirit(tempSpirit);
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

function addPlaceWorldTileCommand(pos, spirit) {
    addInventoryCommand({
        commandName: "placeWorldTile",
        pos: pos.toJson(),
        spiritReference: spirit.getReference().getJson()
    }, [
        localPlayerInventory.getInventoryUpdate(spirit)
    ]);
    spirit.addToCache();
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

addInventoryCommandRepeater("placeWorldTile", command => {
    let tempPos = createPosFromJson(command.pos);
    let tempSpiritReference = convertJsonToSpiritReference(command.spiritReference);
    let tempSpirit = tempSpiritReference.getCachedSpirit();
    let tempTile = getWorldTileWithSpirit(tempSpirit);
    worldTileGrid.setTile(tempPos, tempTile);
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
    circuitTileGrid.clear();
});

addCommandListener("setCircuitTileGrid", command => {
    tempTileList = command.tiles.map(data => convertClientJsonToCircuitTile(data));
    circuitTileGrid.setTiles(tempTileList, circuitSize, circuitSize);
    worldTileGrid.clear();
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
        for (let name of worldActionNameSet) {
            setUpWorldActionTags(name);
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
            selectWorldActionByIndex(0);
        }
        if (keyCode === 50) {
            selectWorldActionByIndex(1);
        }
        if (keyCode === 51) {
            selectWorldActionByIndex(2);
        }
        if (keyCode === 52) {
            selectWorldActionByIndex(3);
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
        if (selectedWorldAction === "mine") {
            startMining(tempPos);
        } else if (selectedWorldAction === "place") {
            placeWorldTile(tempPos);
        } else if (selectedWorldAction === "inspect") {
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


