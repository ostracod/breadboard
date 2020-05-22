
import ostracodMultiplayer from "ostracod-multiplayer";
import {Pos, createPosFromJson} from "./pos.js";
import {world} from "./world.js";
import {convertJsonToSpiritReference} from "./spiritReference.js";
import {PlayerSpirit, EmptySpirit} from "./spirit.js";
import {PlayerWorldTile} from "./worldTile.js";
import {getRecipeById} from "./recipe.js";

import * as fs from "fs";

let gameUtils = ostracodMultiplayer.gameUtils;

const worldFilePath = "./world.json";

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
    "getInventory",
    true,
    (command, player, commandList) => {
        let tempSpirit = world.getPlayerSpirit(player);
        let tempInventory = tempSpirit.inventory;
        for (let item of tempInventory.items) {
            addUpdateInventoryItemCommand(item, commandList);
        }
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
        let tempSpirit = new PlayerSpirit(player);
        let tempTile = new PlayerWorldTile(tempSpirit);
        // TODO: Make player tile placement more robust.
        let tempPos = new Pos(3, 3);
        while (true) {
            let tempOldTile = world.getTile(tempPos);
            if (tempOldTile.spirit instanceof EmptySpirit) {
                break;
            }
            tempPos.x += 1;
        }
        tempTile.addToWorld(world, tempPos);
    }
    
    playerLeaveEvent(player) {
        let tempTile = world.getPlayerTile(player);
        tempTile.removeFromWorld();
    }
    
    persistEvent(done) {
        fs.writeFileSync(worldFilePath, JSON.stringify(world.getDbJson()));
        done();
    }
}

export let gameDelegate = new GameDelegate();

function timerEvent() {
    if (gameUtils.isPersistingEverything) {
        return;
    }
    world.tick();
}

setInterval(timerEvent, 40);


