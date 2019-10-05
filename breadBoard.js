
var ostracodMultiplayer = require("ostracod-multiplayer").ostracodMultiplayer;

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

console.log("Starting BreadBoard server...");

var tempResult = ostracodMultiplayer.initializeServer(__dirname, gameDelegate, []);

if (!tempResult) {
    process.exit(1);
}


