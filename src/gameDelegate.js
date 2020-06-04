
import ostracodMultiplayer from "ostracod-multiplayer";
import {Pos, createPosFromJson} from "./pos.js";
import {world} from "./world.js";
import {MachineSpirit, persistAllComplexSpirits} from "./spirit.js";
import {convertJsonToSpiritReference} from "./spiritReference.js";
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

function addUpdateInventoryItemCommand(inventoryItem, commandList) {
    commandList.push({
        commandName: "updateInventoryItem",
        parentSpiritId: inventoryItem.inventory.parentSpirit.id,
        inventoryItem: inventoryItem.getClientJson()
    });
}

function addUpdateInventoryItemCommands(inventory, commandList) {
    for (let item of inventory.items) {
        addUpdateInventoryItemCommand(item, commandList);
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
    for (let item of playerSpirit.inventoryUpdates) {
        addUpdateInventoryItemCommand(item, commandList);
    }
    playerSpirit.inventoryUpdates = [];
});

addCommandListener("walk", (command, playerTile, commandList) => {
    let tempOffset = createPosFromJson(command.offset);
    playerTile.walk(tempOffset);
});

addCommandListener("mine", (command, playerTile, commandList) => {
    let tempPos = createPosFromJson(command.pos);
    playerTile.mine(tempPos);
});

addCommandListener("placeWorldTile", (command, playerTile, commandList) => {
    let tempPos = createPosFromJson(command.pos);
    let tempReference = convertJsonToSpiritReference(command.spirit);
    playerTile.placeWorldTile(tempPos, tempReference);
});

addCommandListener("craft", (command, playerTile, commandList) => {
    let tempInventory = playerTile.spirit.inventory;
    let tempRecipe = getRecipeById(command.recipeId);
    tempInventory.craftRecipe(tempRecipe);
});

addCommandListener("inspect", (command, playerTile, commandList) => {
    let tempSpirit = playerTile.inspectByContainerName(
        command.containerName,
        convertJsonToSpiritReference(command.spirit)
    );
    if (tempSpirit instanceof MachineSpirit) {
        addUpdateInventoryItemCommands(tempSpirit.inventory, commandList);
    }
});

addCommandListener("transfer", (command, playerTile, commandList) => {
    playerTile.spirit.transferInventoryItem(
        command.sourceContainerName,
        command.destinationContainerName,
        convertJsonToSpiritReference(command.spirit)
    );
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


