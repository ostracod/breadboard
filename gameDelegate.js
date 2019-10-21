
var gameUtils = require("ostracod-multiplayer").gameUtils;
var tempResource = require("./pos");
var Pos = tempResource.Pos;
var createPosFromJson = tempResource.createPosFromJson;
var world = require("./world").world;
var tempResource = require("./worldTile");
var EmptyWorldTile = tempResource.EmptyWorldTile;
var PlayerWorldTile = tempResource.PlayerWorldTile;

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

function GameDelegate() {
    
}

var gameDelegate = new GameDelegate();

GameDelegate.prototype.playerEnterEvent = function(player) {
    var tempTile = new PlayerWorldTile(player);
    var tempPos = new Pos(3, 3);
    while (!(world.getTile(tempPos) instanceof EmptyWorldTile)) {
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

module.exports = {
    gameDelegate: gameDelegate
};


