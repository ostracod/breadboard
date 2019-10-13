
var ostracodMultiplayer = require("ostracod-multiplayer").ostracodMultiplayer;
var gameDelegate = require("./gameDelegate.js").gameDelegate;

console.log("Starting BreadBoard server...");

var tempResult = ostracodMultiplayer.initializeServer(__dirname, gameDelegate, []);

if (!tempResult) {
    process.exit(1);
}


