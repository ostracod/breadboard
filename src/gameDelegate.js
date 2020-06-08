
import ostracodMultiplayer from "ostracod-multiplayer";
import {Pos, createPosFromJson} from "./pos.js";
import {world} from "./world.js";
import {MachineSpirit, persistAllComplexSpirits, complexSpiritSet} from "./spirit.js";
import {ComplexSpiritReference, convertJsonToSpiritReference} from "./spiritReference.js";
import {PlayerWorldTile} from "./worldTile.js";
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

function processInventoryUpdates(command, playerSpirit, commandList, shouldRevert) {
    for (let updateData of command.inventoryUpdates) {
        let tempReference = convertJsonToSpiritReference(updateData.spiritReference);
        if (tempReference instanceof ComplexSpiritReference && tempReference.id < 0) {
            updateData.count = 0;
            addUpdateInventoryItemCommandHelper(updateData, commandList);
            continue;
        }
        if (!shouldRevert) {
            continue;
        }
        let tempInventory = playerSpirit.getInventoryByParentSpiritId(
            updateData.parentSpiritId
        );
        if (tempInventory === null) {
            continue;
        }
        let tempItem = tempInventory.getItemBySpiritReference(tempReference);
        if (tempItem === null) {
            updateData.count = 0;
        } else {
            updateData.count = tempItem.count;
        }
        addUpdateInventoryItemCommandHelper(updateData, commandList);
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
    addSetWorldTileGridCommand(playerTile, commandList);
    let playerSpirit = playerTile.spirit;
    for (let update of playerSpirit.inventoryUpdates) {
        addUpdateInventoryItemCommand(update, commandList);
    }
    playerSpirit.inventoryUpdates = [];
    playerSpirit.verifyInspectionState();
    for (let spiritId of playerSpirit.inspectionStateUpdates) {
        addStopInspectingCommand(spiritId, commandList);
    }
    playerSpirit.inspectionStateUpdates = [];
});

addCommandListener("walk", (command, playerTile, commandList) => {
    let tempOffset = createPosFromJson(command.offset);
    playerTile.walk(tempOffset);
});

addCommandListener("mine", (command, playerTile, commandList) => {
    let tempPos = createPosFromJson(command.pos);
    let tempResult = playerTile.mine(tempPos);
    processInventoryUpdates(command, playerTile.spirit, commandList, !tempResult);
});

addCommandListener("placeWorldTile", (command, playerTile, commandList) => {
    let tempPos = createPosFromJson(command.pos);
    let tempReference = convertJsonToSpiritReference(command.spiritReference);
    let tempResult = playerTile.placeWorldTile(tempPos, tempReference);
    processInventoryUpdates(command, playerTile.spirit, commandList, !tempResult);
});

addCommandListener("craft", (command, playerTile, commandList) => {
    let tempInventory = playerTile.spirit.inventory;
    let tempRecipe = getRecipeById(command.recipeId);
    let tempResult = tempInventory.craftRecipe(tempRecipe);
    processInventoryUpdates(command, playerTile.spirit, commandList, !tempResult);
});

addCommandListener("inspect", (command, playerTile, commandList) => {
    let tempReference = convertJsonToSpiritReference(command.spiritReference);
    let tempSpirit = tempReference.getSpirit();
    playerTile.spirit.inspect(tempSpirit);
    if (tempSpirit instanceof MachineSpirit) {
        addUpdateInventoryItemCommands(tempSpirit.inventory, commandList);
    }
});

addCommandListener("transfer", (command, playerTile, commandList) => {
    let tempResult = playerTile.spirit.transferInventoryItem(
        command.sourceParentSpiritId,
        command.destinationParentSpiritId,
        convertJsonToSpiritReference(command.spiritReference)
    );
    processInventoryUpdates(command, playerTile.spirit, commandList, !tempResult);
});

addCommandListener("recycle", (command, playerTile, commandList) => {
    let tempResult = playerTile.spirit.recycleInventoryItem(
        command.parentSpiritId,
        convertJsonToSpiritReference(command.spiritReference)
    );
    processInventoryUpdates(command, playerTile.spirit, commandList, !tempResult);
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
            delete complexSpiritSet[tempTile.spirit.id];
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


