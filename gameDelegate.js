
var gameUtils = require("ostracod-multiplayer").gameUtils;

function addSetEntityGridCommand(player, commandList) {
    var tempSize = 17;
    var tempLength = tempSize * tempSize;
    var tempEntityJsonList = [];
    while (tempEntityJsonList.length < tempLength) {
        tempEntityJsonList.push(Math.floor(Math.random() * 3));
    }
    commandList.push({
        commandName: "setEntityGrid",
        entities: tempEntityJsonList,
        width: tempSize,
        height: tempSize
    });
}

gameUtils.addCommandListener(
    "getState",
    true,
    function(command, player, commandList) {
        addSetEntityGridCommand(player, commandList);
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


