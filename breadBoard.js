
var express = require("express");
var ostracodMultiplayer = require("ostracod-multiplayer").ostracodMultiplayer;
var gameDelegate = require("./gameDelegate").gameDelegate;
var tempResource = require("./spirit");
var simpleSpiritSerialIntegerSet = tempResource.simpleSpiritSerialIntegerSet;
var complexSpiritClassIdSet = tempResource.complexSpiritClassIdSet;
var recipeDataList = require("./recipe").recipeDataList;

console.log("Starting BreadBoard server...");

var router = express.Router();

router.get("/javascript/gameConstants.js", function(req, res, next) {
    var tempLineList = [
        "var simpleSpiritSerialIntegerSet = " + JSON.stringify(simpleSpiritSerialIntegerSet) + ";",
        "var complexSpiritClassIdSet = " + JSON.stringify(complexSpiritClassIdSet) + ";",
        "var recipeDataList = " + JSON.stringify(recipeDataList) + ";"
    ];
    res.send(tempLineList.join("\n"));
});

var tempResult = ostracodMultiplayer.initializeServer(__dirname, gameDelegate, [router]);

if (!tempResult) {
    process.exit(1);
}


