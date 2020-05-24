
import ostracodMultiplayer from "ostracod-multiplayer";
import {Pos, createPosFromJson} from "./pos.js";
import {world} from "./world.js";
import {persistAllComplexSpirits} from "./spirit.js";
import {convertJsonToSpiritReference} from "./spiritReference.js";
import {PlayerWorldTile} from "./worldTile.js";
import {getRecipeById} from "./recipe.js";

let gameUtils = ostracodMultiplayer.gameUtils;

function addSetWorldTileGridCommand(player, commandList) {
    let tempWindowSize = 21;
    let tempTile = world.getPlayerTile(player);
    let tempPos = tempTile.pos.copy();
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
        inventoryItem: inventoryItem.getClientJson()
    });
}

// TODO: Verify value ranges for all command parameters.

gameUtils.addCommandListener(
    "enterWorld",
    false,
    (command, player, commandList, done, errorHandler) => {
        world.addPlayerTile(player).then(playerSpirit => {
            let tempInventory = playerSpirit.inventory;
            for (let item of tempInventory.items) {
                addUpdateInventoryItemCommand(item, commandList);
            }
            done();
        });
    }
);

gameUtils.addCommandListener(
    "setWalkController",
    true,
    (command, player, commandList) => {
        let tempTile = world.getPlayerTile(player);
        tempTile.walkControllerData = command.walkController;
    }
);

gameUtils.addCommandListener(
    "getState",
    true,
    (command, player, commandList) => {
        addSetWorldTileGridCommand(player, commandList);
        let tempSpirit = world.getPlayerTile(player).spirit;
        for (let item of tempSpirit.inventoryUpdates) {
            addUpdateInventoryItemCommand(item, commandList);
        }
        tempSpirit.inventoryUpdates = [];
    }
);

gameUtils.addCommandListener(
    "walk",
    true,
    (command, player, commandList) => {
        let tempTile = world.getPlayerTile(player);
        let tempOffset = createPosFromJson(command.offset);
        tempTile.walk(tempOffset);
    }
);

gameUtils.addCommandListener(
    "mine",
    true,
    (command, player, commandList) => {
        let tempTile = world.getPlayerTile(player);
        let tempPos = createPosFromJson(command.pos);
        tempTile.mine(tempPos);
    }
);

gameUtils.addCommandListener(
    "placeWorldTile",
    true,
    (command, player, commandList) => {
        let tempTile = world.getPlayerTile(player);
        let tempPos = createPosFromJson(command.pos);
        let tempReference = convertJsonToSpiritReference(command.spirit);
        tempTile.placeWorldTile(tempPos, tempReference);
    }
);

gameUtils.addCommandListener(
    "craft",
    true,
    (command, player, commandList) => {
        let tempTile = world.getPlayerTile(player);
        let tempInventory = tempTile.spirit.inventory;
        let tempRecipe = getRecipeById(command.recipeId);
        tempInventory.craftRecipe(tempRecipe);
    }
);

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


