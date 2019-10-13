
var gameUtils = require("ostracod-multiplayer").gameUtils;
var tempResource = require("./pos");
var Pos = tempResource.Pos;
var createPosFromJson = tempResource.createPosFromJson;
var world = require("./world").world;

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
    
}

GameDelegate.prototype.playerLeaveEvent = function(player) {
    
}

GameDelegate.prototype.persistEvent = function(done) {
    
    done();
}

module.exports = {
    gameDelegate: gameDelegate
};


