
var express = require("express");
var ostracodMultiplayer = require("ostracod-multiplayer").ostracodMultiplayer;
var gameDelegate = require("./gameDelegate.js").gameDelegate;
var worldTileTypeSet = require("./worldTile").worldTileTypeSet;

console.log("Starting BreadBoard server...");

var router = express.Router();

router.get("/javascript/gameConstants.js", function(req, res, next) {
    res.send("var worldTileTypeSet = " + JSON.stringify(worldTileTypeSet));
});

var tempResult = ostracodMultiplayer.initializeServer(__dirname, gameDelegate, [router]);

if (!tempResult) {
    process.exit(1);
}


