
var gameUtils = require("ostracod-multiplayer").gameUtils;
var Pos = require("./pos").Pos;
var world = require("./world").world;

function addSetWorldTileGridCommand(player, commandList) {
    var tempSize = 17;
    var tempTileJsonList = world.getClientJson(new Pos(-3, -1), tempSize, tempSize);
    commandList.push({
        commandName: "setWorldTileGrid",
        tiles: tempTileJsonList,
        width: tempSize,
        height: tempSize
    });
}

gameUtils.addCommandListener(
    "getState",
    true,
    function(command, player, commandList) {
        addSetWorldTileGridCommand(player, commandList);
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


