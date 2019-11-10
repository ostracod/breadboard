
var gameUtils = require("ostracod-multiplayer").gameUtils;
var tempResource = require("./pos");
var Pos = tempResource.Pos;
var createPosFromJson = tempResource.createPosFromJson;
var world = require("./world").world;
var convertJsonToSpiritReference = require("./spiritReference").convertJsonToSpiritReference;
var tempResource = require("./spirit");
var PlayerSpirit = tempResource.PlayerSpirit;
var EmptySpirit = tempResource.EmptySpirit;
var PlayerWorldTile = require("./worldTile").PlayerWorldTile;
var getRecipeById = require("./recipe").getRecipeById;

function addSetWorldTileGridCommand(player, commandList) {
    var tempWindowSize = 21;
    var tempTile = world.getPlayerTile(player);
    var tempPos = tempTile.pos.copy();
    var tempCenterOffset = Math.floor(tempWindowSize / 2);
    tempPos.x -= tempCenterOffset;
    tempPos.y -= tempCenterOffset;
    var tempTileJsonList = world.getClientJson(tempPos, tempWindowSize, tempWindowSize);
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
    function(command, player, commandList) {
        var tempSpirit = world.getPlayerSpirit(player);
        var tempInventory = tempSpirit.inventory;
        var index = 0;
        while (index < tempInventory.items.length) {
            var tempItem = tempInventory.items[index];
            addUpdateInventoryItemCommand(tempItem, commandList);
            index += 1;
        }
    }
);

gameUtils.addCommandListener(
    "setWalkController",
    true,
    function(command, player, commandList) {
        var tempTile = world.getPlayerTile(player);
        tempTile.walkControllerData = command.walkController;
    }
);

gameUtils.addCommandListener(
    "getState",
    true,
    function(command, player, commandList) {
        addSetWorldTileGridCommand(player, commandList);
    }
);

gameUtils.addCommandListener(
    "walk",
    true,
    function(command, player, commandList) {
        var tempTile = world.getPlayerTile(player);
        var tempOffset = createPosFromJson(command.offset);
        tempTile.walk(tempOffset);
    }
);

gameUtils.addCommandListener(
    "mine",
    true,
    function(command, player, commandList) {
        var tempTile = world.getPlayerTile(player);
        var tempPos = createPosFromJson(command.pos);
        var tempItem = tempTile.mine(tempPos);
        if (tempItem !== null) {
            addUpdateInventoryItemCommand(tempItem, commandList);
        }
    }
);

gameUtils.addCommandListener(
    "placeWorldTile",
    true,
    function(command, player, commandList) {
        var tempTile = world.getPlayerTile(player);
        var tempPos = createPosFromJson(command.pos);
        var tempReference = convertJsonToSpiritReference(command.spirit);
        var tempItem = tempTile.placeWorldTile(tempPos, tempReference);
        if (tempItem !== null) {
            addUpdateInventoryItemCommand(tempItem, commandList);
        }
    }
);

gameUtils.addCommandListener(
    "craft",
    true,
    function(command, player, commandList) {
        var tempTile = world.getPlayerTile(player);
        var tempInventory = tempTile.spirit.inventory;
        var tempRecipe = getRecipeById(command.recipeId);
        var tempItemList = tempInventory.craftRecipe(tempRecipe);
        var index = 0;
        while (index < tempItemList.length) {
            var tempItem = tempItemList[index];
            addUpdateInventoryItemCommand(tempItem, commandList);
            index += 1;
        }
    }
);

function GameDelegate() {
    
}

var gameDelegate = new GameDelegate();

GameDelegate.prototype.playerEnterEvent = function(player) {
    var tempSpirit = new PlayerSpirit(player);
    var tempTile = new PlayerWorldTile(tempSpirit);
    // TODO: Make player tile placement more robust.
    var tempPos = new Pos(3, 3);
    while (true) {
        var tempOldTile = world.getTile(tempPos);
        if (tempOldTile.spirit instanceof EmptySpirit) {
            break;
        }
        tempPos.x += 1;
    }
    tempTile.addToWorld(world, tempPos);
}

GameDelegate.prototype.playerLeaveEvent = function(player) {
    var tempTile = world.getPlayerTile(player);
    tempTile.removeFromWorld();
}

GameDelegate.prototype.persistEvent = function(done) {
    
    done();
}

function timerEvent() {
    if (gameUtils.isPersistingEverything) {
        return;
    }
    world.tick();
}

setInterval(timerEvent, 40);

module.exports = {
    gameDelegate: gameDelegate
};


