
import ostracodMultiplayer from "ostracod-multiplayer";
import {complexSpiritMap, world} from "./globalData.js";
import {createPosFromJson} from "./pos.js";
import {MachineSpirit, persistAllComplexSpirits} from "./spirit.js";
import {convertJsonToSpiritType} from "./spiritType.js";
import {ComplexSpiritReference, convertJsonToSpiritReference} from "./spiritReference.js";
import {getRecipeById} from "./recipe.js";

let gameUtils = ostracodMultiplayer.gameUtils;

function addSetWorldTileGridCommand(playerTile, commandList) {
    let tempWindowSize = 21;
    let tempPos = playerTile.pos.copy();
    let tempCenterOffset = Math.floor(tempWindowSize / 2);
    tempPos.x -= tempCenterOffset;
    tempPos.y -= tempCenterOffset;
    let tempTileJsonList = world.getClientJson(tempPos, tempWindowSize, tempWindowSize);
    commandList.push({
        commandName: "setWorldTileGrid",
        pos: tempPos.toJson(),
        tiles: tempTileJsonList,
        width: tempWindowSize,
        height: tempWindowSize
    });
}

function addSetCircuitTileGridCommand(circuitSpirit, commandList) {
    let tempTileList = circuitSpirit.tileGrid.tileList;
    commandList.push({
        commandName: "setCircuitTileGrid",
        tiles: tempTileList.map(tile => tile.getClientJson())
    });
}

function addUpdateInventoryItemCommandHelper(inventoryUpdateData, commandList) {
    commandList.push({
        commandName: "updateInventoryItem",
        inventoryUpdate: inventoryUpdateData
    });
}

function addUpdateInventoryItemCommand(inventoryUpdate, commandList) {
    addUpdateInventoryItemCommandHelper(
        inventoryUpdate.getClientJson(false),
        commandList
    );
}

function addUpdateInventoryItemCommands(inventory, commandList) {
    for (let item of inventory.items) {
        let tempUpdate = item.getInventoryUpdate();
        addUpdateInventoryItemCommand(tempUpdate, commandList);
    }
}

function addStopInspectingCommand(spiritId, commandList) {
    commandList.push({
        commandName: "stopInspecting",
        spiritId: spiritId
    });
}

function processInventoryUpdates(command, playerSpirit, commandList) {
    for (let updateData of command.inventoryUpdates) {
        let tempReference = convertJsonToSpiritReference(updateData.spiritReference);
        if (tempReference instanceof ComplexSpiritReference && tempReference.id < 0) {
            updateData.count = 0;
            addUpdateInventoryItemCommandHelper(updateData, commandList);
            continue;
        }
        let tempInventory = playerSpirit.getInventoryByParentSpiritId(
            updateData.parentSpiritId
        );
        if (tempInventory === null) {
            continue;
        }
        let tempCount = tempInventory.getItemCountBySpiritReference(tempReference);
        if (updateData.count !== tempCount) {
            updateData.count = tempCount;
            addUpdateInventoryItemCommandHelper(updateData, commandList);
        }
    }
}

// TODO: Verify value ranges for all command parameters.

gameUtils.addCommandListener(
    "enterWorld",
    false,
    (command, player, commandList, done, errorHandler) => {
        world.addPlayerTile(player).then(playerSpirit => {
            let tempInventory = playerSpirit.inventory;
            addUpdateInventoryItemCommands(tempInventory, commandList);
            done();
        });
    }
);

function addCommandListener(commandName, handler) {
    if (handler.length === 3) {
        gameUtils.addCommandListener(
            commandName,
            true,
            (command, player, commandList) => {
                handler(command, world.getPlayerTile(player), commandList);
            }
        );
    } else {
        gameUtils.addCommandListener(
            commandName,
            false,
            (command, player, commandList, done, errorHandler) => {
                handler(
                    command,
                    world.getPlayerTile(player),
                    commandList,
                    done,
                    errorHandler
                );
            }
        );
    }
}

addCommandListener("setWalkController", (command, playerTile, commandList) => {
    playerTile.walkControllerData = command.walkController;
});

addCommandListener("getState", (command, playerTile, commandList) => {
    let playerSpirit = playerTile.spirit;
    if (playerSpirit.inspectedCircuit === null) {
        addSetWorldTileGridCommand(playerTile, commandList);
    } else {
        addSetCircuitTileGridCommand(playerSpirit.inspectedCircuit, commandList);
    }
    for (let update of playerSpirit.inventoryUpdates) {
        addUpdateInventoryItemCommand(update, commandList);
    }
    playerSpirit.inventoryUpdates = [];
    playerSpirit.verifyInspectionState();
    for (let spiritId of playerSpirit.stopInspectionSpiritIds) {
        addStopInspectingCommand(spiritId, commandList);
    }
    playerSpirit.stopInspectionSpiritIds = [];
});

addCommandListener("walk", (command, playerTile, commandList) => {
    let tempOffset = createPosFromJson(command.offset);
    playerTile.walk(tempOffset);
});

addCommandListener("mine", (command, playerTile, commandList) => {
    let tempPos = createPosFromJson(command.pos);
    playerTile.mine(tempPos);
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

function addPlaceTileCommandListener(commandName, placeTile) {
    addCommandListener(commandName, (command, playerTile, commandList) => {
        let tempPos = createPosFromJson(command.pos);
        let tempReference = convertJsonToSpiritReference(command.spiritReference);
        placeTile(playerTile, tempPos, tempReference);
        processInventoryUpdates(command, playerTile.spirit, commandList);
    });
}

addPlaceTileCommandListener("placeWorldTile", (playerTile, pos, spiritReference) => {
    playerTile.placeWorldTile(pos, spiritReference);
});

addPlaceTileCommandListener("placeCircuitTile", (playerTile, pos, spiritReference) => {
    playerTile.spirit.placeCircuitTile(pos, spiritReference);
});

addCommandListener("craftCircuitTile", (command, playerTile, commandList) => {
    let tempPos = createPosFromJson(command.pos);
    let tempSpiritType = convertJsonToSpiritType(command.spiritType);
    playerTile.spirit.craftCircuitTile(tempPos, tempSpiritType);
});

addCommandListener("craft", (command, playerTile, commandList) => {
    let tempInventory = playerTile.spirit.inventory;
    let tempRecipe = getRecipeById(command.recipeId);
    tempInventory.craftRecipe(tempRecipe);
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

addCommandListener("inspect", (command, playerTile, commandList) => {
    let tempReference = convertJsonToSpiritReference(command.spiritReference);
    let tempSpirit = tempReference.getSpirit();
    let tempResult = playerTile.spirit.inspect(tempSpirit);
    if (tempResult && tempSpirit instanceof MachineSpirit) {
        addUpdateInventoryItemCommands(tempSpirit.inventory, commandList);
    }
});

addCommandListener("stopInspecting", (command, playerTile, commandList) => {
    let tempReference = new ComplexSpiritReference(command.spiritId);
    let tempSpirit = tempReference.getSpirit();
    playerTile.spirit.stopInspecting(tempSpirit);
});

addCommandListener("transfer", (command, playerTile, commandList) => {
    playerTile.spirit.transferInventoryItem(
        command.sourceParentSpiritId,
        command.destinationParentSpiritId,
        convertJsonToSpiritReference(command.spiritReference)
    );
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

addCommandListener("recycle", (command, playerTile, commandList) => {
    playerTile.spirit.recycleInventoryItem(
        command.parentSpiritId,
        convertJsonToSpiritReference(command.spiritReference)
    );
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

class GameDelegate {
    
    constructor() {
        
    }
    
    playerEnterEvent(player) {
        // Player tile is created by enterWorld command.
    }
    
    playerLeaveEvent(player) {
        let tempTile = world.getPlayerTile(player);
        if (tempTile !== null) {
            tempTile.removeFromWorld();
            delete complexSpiritMap[tempTile.spirit.id];
        }
    }
    
    persistEvent(done) {
        world.persist();
        persistAllComplexSpirits().then(done);
    }
}

export let gameDelegate = new GameDelegate();

function timerEvent() {
    gameUtils.performAtomicOperation(callback => {
        world.tick().then(callback);
    }, () => {
        setTimeout(timerEvent, 40);
    });
}

timerEvent();


