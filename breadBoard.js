
import * as pathUtils from "path";
import express from "express";
import ostracodMultiplayer from "ostracod-multiplayer";
import {simpleSpiritSerialIntegerSet, complexSpiritClassIdSet, recipeDataList} from "./src/globalData.js";
import {gameDelegate} from "./src/gameDelegate.js";
import {world} from "./src/world.js";

let ostracodMultiplayerInstance = ostracodMultiplayer.ostracodMultiplayer;

let router = express.Router();

router.get("/javascript/gameConstants.js", (req, res, next) => {
    let tempLineList = [
        `let simpleSpiritSerialIntegerSet = ${JSON.stringify(simpleSpiritSerialIntegerSet)};`,
        `let complexSpiritClassIdSet = ${JSON.stringify(complexSpiritClassIdSet)};`,
        `let recipeDataList = ${JSON.stringify(recipeDataList)};`
    ];
    res.send(tempLineList.join("\n"));
});

console.log("Starting BreadBoard server...");
let tempResult = ostracodMultiplayerInstance.initializeServer(
    pathUtils.resolve(),
    gameDelegate,
    [router]
);
if (!tempResult) {
    process.exit(1);
}

console.log("Loading world tile grid...");
// TODO: Disable web requests until this promise finishes.
world.loadTileGrid().then(() => {
    console.log("Finished loading world tile grid.");
});


