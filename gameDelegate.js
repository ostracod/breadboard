
var gameUtils = require("ostracod-multiplayer").gameUtils;
var tempResource = require("./pos");
var Pos = tempResource.Pos;
var createPosFromJson = tempResource.createPosFromJson;
var world = require("./world").world;
var tempResource = require("./worldTile");
var EmptyWorldTile = tempResource.EmptyWorldTile;
var PlayerWorldTile = tempResource.PlayerWorldTile;

function addSetWorldTileGridCommand(cameraPos, commandList) {
    var tempSize = 17;
    var tempTileJsonList = world.getClientJson(cameraPos, tempSize, tempSize);
    commandList.push({
        commandName: "setWorldTileGrid",
        pos: cameraPos.toJson(),
        tiles: tempTileJsonList,
        width: tempSize,
        height: tempSize
    });
}

gameUtils.addCommandListener(
    "getState",
    true,
    function(command, player, commandList) {
        var tempPos = createPosFromJson(command.cameraPos);
        addSetWorldTileGridCommand(tempPos, commandList);
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
    world.removePlayer(player);
}

GameDelegate.prototype.persistEvent = function(done) {
    
    done();
}

module.exports = {
    gameDelegate: gameDelegate
};


