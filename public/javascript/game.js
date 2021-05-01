
const pixelSize = 6;
const spritePixelSize = spriteSize * pixelSize;
const tileActionOffsetSet = [
    new Pos(-1, 0),
    new Pos(1, 0),
    new Pos(0, -1),
    new Pos(0, 1),
];
const worldTileActionNameSet = ["remove", "place", "inspect", "attack"];
const circuitTileActionNameSet = ["remove", "place", "inspect"];

let canvasTileWidth;
let canvasTileHeight;
let cameraPos = new Pos(0, 0);
let mouseIsHeld = false;
let isMining = false;
let minePlayerPos;
let mineTargetPos;
let mineDelay;
let tileActionNameSet;
let selectedTileAction = "remove";
let updateRequestCount = 0;

const drawMineCrack = () => {
    if (!isMining) {
        return;
    }
    const tempPos = mineTargetPos.copy();
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
};

const drawTileBorder = (pos, color) => {
    if (pos === null) {
        return;
    }
    const tempPosX = pos.x * spritePixelSize;
    const tempPosY = pos.y * spritePixelSize;
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
};

const drawWorld = () => {
    cameraPos.set(localPlayerWorldTile.pos);
    cameraPos.x -= Math.floor(canvasTileWidth / 2);
    cameraPos.y -= Math.floor(canvasTileHeight / 2);
    worldTileGrid.drawLayer(cameraPos, 0);
    drawMineCrack();
    worldTileGrid.drawLayer(cameraPos, 1);
};

const drawInspectedCircuit = () => {
    cameraPos.x = 0;
    cameraPos.y = 0;
    circuitTileGrid.drawLayer(cameraPos, 0);
    drawTileBorder(cursorCircuitTilePos, "#A0A0A0");
    drawTileBorder(inspectedCircuitTilePos, "#000000");
};

const drawEverything = () => {
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
};

const startMining = (pos) => {
    if (isMining && mineTargetPos.equals(pos)) {
        return;
    }
    const tempTile = worldTileGrid.getTile(pos);
    if (!tempTile.canBeMined()) {
        return;
    }
    minePlayerPos = localPlayerWorldTile.pos.copy();
    mineTargetPos = pos;
    mineDelay = 36;
    isMining = true;
};

const processMineTick = () => {
    if (!isMining) {
        return;
    }
    if (!localPlayerWorldTile.pos.equals(minePlayerPos)) {
        isMining = false;
        return;
    }
    const tempTile = worldTileGrid.getTile(mineTargetPos);
    if (!tempTile.canBeMined()) {
        return;
    }
    mineDelay -= 1;
    if (mineDelay > 0) {
        return;
    }
    worldTileGrid.setTile(mineTargetPos, simpleWorldTileSet.empty);
    const tempSpirit = tempTile.spirit;
    localPlayerInventory.incrementItemCountBySpirit(tempSpirit);
    addMineCommand(mineTargetPos, tempSpirit);
    isMining = false;
};

const placeWorldTile = (pos) => {
    let tempTile = worldTileGrid.getTile(pos);
    if (tempTile.spirit.spiritType !== simpleSpiritTypeSet.empty) {
        return;
    }
    const tempItem = localPlayerInventory.selectedItem;
    if (tempItem === null) {
        return;
    }
    if (tempItem.count < 1) {
        return;
    }
    const tempSpirit = tempItem.spirit;
    if (tempSpirit instanceof ComplexSpirit && tempSpirit.id < 0) {
        return;
    }
    tempItem.setCount(tempItem.count - 1);
    tempTile = worldTileFactory.getTileWithSpirit(tempSpirit);
    worldTileGrid.setTile(pos, tempTile);
    addPlaceWorldTileCommand(pos, tempSpirit);
};

const inspectWorldTile = (pos) => {
    const tempTile = worldTileGrid.getTile(pos);
    const tempSpirit = tempTile.spirit;
    inspectSpirit(tempSpirit);
};

const placeCircuitTile = () => {
    // TODO: Implement.
    
};

const craftCircuitTile = (pos, spiritType, shouldAddCommand = true) => {
    const tempSpirit = spiritType.craft();
    const tempTile = circuitTileFactory.getTileWithSpirit(tempSpirit);
    circuitTileGrid.setTile(pos, tempTile);
    if (shouldAddCommand) {
        addCraftCircuitTileCommand(pos, spiritType);
    }
};

const craftOrPlaceCircuitTile = () => {
    // TODO: Allow placing circuit in inventory.
    const tempSpiritType = selectedCircuitTileOptionRow.spiritType;
    craftCircuitTile(cursorCircuitTilePos, tempSpiritType, true);
};

const removeCircuitTile = () => {
    craftCircuitTile(cursorCircuitTilePos, simpleSpiritTypeSet.empty, true);
};

const tileActionIsAvailable = (name) => {
    if (inspectedCircuitSpiritId === null) {
        return (worldTileActionNameSet.indexOf(name) >= 0);
    } else {
        return (circuitTileActionNameSet.indexOf(name) >= 0);
    }
};

const selectTileAction = (name) => {
    if (selectedTileAction === name || !tileActionIsAvailable(name)) {
        return;
    }
    const tempTag = document.getElementById(name + "TileAction");
    tempTag.checked = true;
    selectedTileAction = name;
};

const selectTileActionByIndex = (index) => {
    const tempName = tileActionNameSet[index];
    selectTileAction(tempName);
};

const setUpTileActionTags = (name) => {
    let tempTag = document.getElementById(name + "TileActionContainer");
    tempTag.style.cursor = "pointer";
    tempTag.onclick = () => {
        selectTileAction(name);
    };
    tempTag = document.getElementById(name + "TileAction");
    tempTag.onchange = () => {
        selectTileAction(name);
    };
};

const updateTileActionTags = () => {
    for (const name of tileActionNameSet) {
        const tempTag = document.getElementById("attackTileActionContainer");
        if (tileActionIsAvailable(name)) {
            tempTag.style.display = "block";
        } else {
            tempTag.style.display = "none";
            if (selectedTileAction === name) {
                selectTileAction("place");
            }
        }
    }
};

const inspectSpirit = (spirit, shouldAddCommand = true) => {
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
};

const inspectMachine = (spirit) => {
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
};

const inspectCircuit = (spirit) => {
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
};

const stopInspectingSpirit = (spiritId, shouldAddCommand = true) => {
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
};

const stopInspectingMachine = () => {
    document.getElementById("machineInfoPlaceholder").style.display = "block";
    document.getElementById("machineInfo").style.display = "none";
    hideModuleByName("machine");
    inspectedMachineInventory.cleanUp();
    inspectedMachineInventory = null;
};

const stopInspectingCircuit = () => {
    document.getElementById("circuitInfoPlaceholder").style.display = "block";
    document.getElementById("circuitInfo").style.display = "none";
    hideModuleByName("circuit");
    inspectedCircuitSpiritId = null;
    worldTileGrid.clear();
    updateTileActionTags();
};

const addInventoryCommand = (command, inventoryUpdateList) => {
    for (const update of inventoryUpdateList) {
        update.spirit.addToCache();
    }
    command.inventoryUpdates = inventoryUpdateList.map((update) => update.getClientJson());
    gameUpdateCommandList.push(command);
};

const addEnterWorldCommand = () => {
    gameUpdateCommandList.push({
        commandName: "enterWorld",
    });
};

const addSetWalkControllerCommand = (offset) => {
    if (localPlayerWorldTile === null) {
        return;
    }
    gameUpdateCommandList.push({
        commandName: "setWalkController",
        walkController: localPlayerWorldTile.walkController.toJson(),
    });
};

const addGetStateCommand = () => {
    gameUpdateCommandList.push({
        commandName: "getState",
    });
};

const addWalkCommand = (offset) => {
    gameUpdateCommandList.push({
        commandName: "walk",
        offset: offset.toJson(),
    });
};

const addMineCommand = (pos, spirit) => {
    addInventoryCommand({
        commandName: "mine",
        pos: pos.toJson(),
    }, [
        localPlayerInventory.getInventoryUpdate(spirit),
    ]);
};

const addPlaceTileCommand = (commandName, pos, spirit) => {
    addInventoryCommand({
        commandName,
        pos: pos.toJson(),
        spiritReference: spirit.getReference().getJson(),
    }, [
        localPlayerInventory.getInventoryUpdate(spirit),
    ]);
    spirit.addToCache();
};

const addPlaceWorldTileCommand = (pos, spirit) => {
    addPlaceTileCommand("placeWorldTile", pos, spirit);
};

const addPlaceCircuitTileCommand = (pos, spirit) => {
    addPlaceTileCommand("placeCircuitTile", pos, spirit);
};

const addCraftCircuitTileCommand = (pos, spiritType) => {
    gameUpdateCommandList.push({
        commandName: "craftCircuitTile",
        pos: pos.toJson(),
        spiritType: spiritType.getJson(),
    });
};

const addCraftCommand = (recipe, inventoryUpdateList) => {
    addInventoryCommand({
        commandName: "craft",
        recipeId: recipe.id,
    }, inventoryUpdateList);
};

const addInspectCommand = (spirit) => {
    gameUpdateCommandList.push({
        commandName: "inspect",
        spiritReference: spirit.getReference().getJson(),
    });
    spirit.addToCache();
};

const addTransferCommand = (sourceInventory, destinationInventory, spirit) => {
    addInventoryCommand({
        commandName: "transfer",
        sourceParentSpiritId: sourceInventory.parentSpiritId,
        destinationParentSpiritId: destinationInventory.parentSpiritId,
        spiritReference: spirit.getReference().getJson(),
    }, [
        sourceInventory.getInventoryUpdate(spirit),
        destinationInventory.getInventoryUpdate(spirit),
    ]);
};

const addRecycleCommand = (inventoryItem, inventoryUpdateList) => {
    const tempReference = inventoryItem.spirit.getReference();
    addInventoryCommand({
        commandName: "recycle",
        parentSpiritId: inventoryItem.inventory.parentSpiritId,
        spiritReference: tempReference.getJson(),
    }, inventoryUpdateList);
};

const addStopInspectingCommand = (spiritId) => {
    gameUpdateCommandList.push({
        commandName: "stopInspecting",
        spiritId,
    });
};

const addInventoryCommandRepeater = (commandName, handler = null) => {
    addCommandRepeater(commandName, (command) => {
        for (const updateData of command.inventoryUpdates) {
            const tempUpdate = convertClientJsonToInventoryUpdate(updateData);
            tempUpdate.applyToInventory();
        }
        if (handler !== null) {
            handler(command);
        }
    });
};

addCommandRepeater("walk", (command) => {
    if (localPlayerWorldTile === null) {
        return;
    }
    const tempOffset = createPosFromJson(command.offset);
    localPlayerWorldTile.move(tempOffset);
});

addInventoryCommandRepeater("mine", (command) => {
    const tempPos = createPosFromJson(command.pos);
    worldTileGrid.setTile(tempPos, simpleWorldTileSet.empty);
});

const addPlaceTileCommandRepeater = (commandName, tileGrid) => {
    addInventoryCommandRepeater(commandName, (command) => {
        const tempPos = createPosFromJson(command.pos);
        const tempSpiritReference = convertJsonToSpiritReference(command.spiritReference);
        const tempSpirit = tempSpiritReference.getCachedSpirit();
        const tempTile = tileGrid.tileFactory.getTileWithSpirit(tempSpirit);
        tileGrid.setTile(tempPos, tempTile);
    });
};

addPlaceTileCommandRepeater("placeWorldTile", worldTileGrid);
addPlaceTileCommandRepeater("placeCircuitTile", circuitTileGrid);

addCommandRepeater("craftCircuitTile", (command) => {
    const tempPos = createPosFromJson(command.pos);
    const tempSpiritType = convertJsonToSpiritType(command.spiritType);
    craftCircuitTile(tempPos, tempSpiritType, false);
});

addInventoryCommandRepeater("craft");
addInventoryCommandRepeater("transfer");
addInventoryCommandRepeater("recycle");

addCommandRepeater("inspect", (command) => {
    const tempReference = convertJsonToSpiritReference(command.spiritReference);
    tempSpirit = tempReference.getCachedSpirit();
    inspectSpirit(tempSpirit, false);
});

addCommandRepeater("stopInspecting", (command) => {
    stopInspectingSpirit(command.spiritId, false);
});

addCommandListener("setWorldTileGrid", (command) => {
    worldTileGrid.windowOffset = createPosFromJson(command.pos);
    playerWorldTileList = [];
    tempTileList = command.tiles.map((data) => (
        worldTileFactory.convertClientJsonToTile(data)
    ));
    worldTileGrid.setTiles(tempTileList, command.width, command.height);
});

addCommandListener("setCircuitTileGrid", (command) => {
    tempTileList = command.tiles.map((data) => (
        circuitTileFactory.convertClientJsonToTile(data)
    ));
    circuitTileGrid.setTiles(tempTileList, circuitSize, circuitSize);
});

addCommandListener("updateInventoryItem", (command) => {
    const tempUpdateData = command.inventoryUpdate;
    const tempUpdate = convertClientJsonToInventoryUpdate(tempUpdateData);
    if (tempUpdate === null) {
        return;
    }
    tempUpdate.applyToInventory();
});

addCommandListener("stopInspecting", (command) => {
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
            drawAllCircuitTilesToPlace();
        });
        
        addEnterWorldCommand();
        tileActionNameSet = worldTileActionNameSet.slice();
        for (const name of circuitTileActionNameSet) {
            if (tileActionNameSet.indexOf(name) < 0) {
                tileActionNameSet.push(name);
            }
        }
        for (const name of tileActionNameSet) {
            setUpTileActionTags(name);
        }
        
        canvas.onmousemove = (event) => {
            const tempPos = convertMouseEventToPos(event);
            if (tempPos !== null) {
                mouseMoveEvent(tempPos);
            }
        };
        
        canvas.onmousedown = (event) => {
            const tempPos = convertMouseEventToPos(event);
            if (tempPos !== null) {
                mouseDownEvent(tempPos);
            }
            return false;
        };
        
        canvas.onmouseleave = () => {
            cursorCircuitTilePos = null;
        };
        
        document.getElementsByTagName("body")[0].onmouseup = (event) => {
            mouseUpEvent();
        };
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
        for (const tile of playerWorldTileList) {
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
            startWorldTileAction(0);
            return false;
        }
        if (keyCode === 39 || keyCode === 68) {
            startWorldTileAction(1);
            return false;
        }
        if (keyCode === 38 || keyCode === 87) {
            startWorldTileAction(2);
            return false;
        }
        if (keyCode === 40 || keyCode === 83) {
            startWorldTileAction(3);
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
            stopWorldTileAction(0);
        }
        if (keyCode === 39 || keyCode === 68) {
            stopWorldTileAction(1);
        }
        if (keyCode === 38 || keyCode === 87) {
            stopWorldTileAction(2);
        }
        if (keyCode === 40 || keyCode === 83) {
            stopWorldTileAction(3);
        }
        return true;
    }
}

clientDelegate = new ClientDelegate();

const startWorldTileAction = (offsetIndex) => {
    if (localPlayerWorldTile === null) {
        return;
    }
    const offset = tileActionOffsetSet[offsetIndex];
    if (shiftKeyIsHeld) {
        const tempPos = localPlayerWorldTile.pos.copy();
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
};

const stopWorldTileAction = (offsetIndex) => {
    if (localPlayerWorldTile === null) {
        return;
    }
    const offset = tileActionOffsetSet[offsetIndex];
    localPlayerWorldTile.walkController.stopWalk(offset);
};

const convertMouseEventToPos = (event) => {
    const tempX = Math.floor((event.offsetX - 3) / (spritePixelSize / 2));
    const tempY = Math.floor((event.offsetY - 3) / (spritePixelSize / 2));
    if (tempX < 0 || tempX >= canvasTileWidth || tempY < 0 || tempY >= canvasTileHeight) {
        return null;
    }
    return new Pos(tempX, tempY);
};

const performCircuitTileAction = () => {
    if (inspectedCircuitSpiritId === null || cursorCircuitTilePos === null) {
        return;
    }
    if (selectedTileAction === "remove") {
        removeCircuitTile();
    } else if (selectedTileAction === "place") {
        craftOrPlaceCircuitTile();
    } else if (selectedTileAction === "inspect") {
        inspectedCircuitTilePos = cursorCircuitTilePos;
    }
};

const mouseMoveEvent = (pos) => {
    if (pos !== null && cursorCircuitTilePos !== null
            && pos.equals(cursorCircuitTilePos)) {
        return;
    }
    cursorCircuitTilePos = pos;
    if (mouseIsHeld) {
        performCircuitTileAction();
    }
};

const mouseDownEvent = (pos) => {
    mouseIsHeld = true;
    cursorCircuitTilePos = pos;
    performCircuitTileAction();
};

const mouseUpEvent = () => {
    mouseIsHeld = false;
};


