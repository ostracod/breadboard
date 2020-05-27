
import * as pathUtils from "path";
import express from "express";
import ostracodMultiplayer from "ostracod-multiplayer";
import {gameDelegate} from "./src/gameDelegate.js";
import {simpleSpiritSerialIntegerSet, complexSpiritClassIdSet} from "./src/spiritType.js";
import {recipeDataList} from "./src/recipe.js";

let ostracodMultiplayerInstance = ostracodMultiplayer.ostracodMultiplayer;

console.log("Starting BreadBoard server...");

let router = express.Router();

router.get("/javascript/gameConstants.js", (req, res, next) => {
    let tempLineList = [
        `let simpleSpiritSerialIntegerSet = ${JSON.stringify(simpleSpiritSerialIntegerSet)};`,
        `let complexSpiritClassIdSet = ${JSON.stringify(complexSpiritClassIdSet)};`,
        `let recipeDataList = ${JSON.stringify(recipeDataList)};`
    ];
    res.send(tempLineList.join("\n"));
});

let tempResult = ostracodMultiplayerInstance.initializeServer(
    pathUtils.resolve(),
    gameDelegate,
    [router]
);

if (!tempResult) {
    process.exit(1);
}


