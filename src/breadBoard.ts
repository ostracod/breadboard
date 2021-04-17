
import * as pathUtils from "path";
import express from "express";
import ostracodMultiplayer from "ostracod-multiplayer";

import { simpleSpiritSerialIntegerSet, complexSpiritClassIdSet, recipeDataList } from "./globalData.js";
import { loadNextComplexSpiritId } from "./spirit.js";
import { gameDelegate, loadOrCreateWorldSpirit } from "./gameDelegate.js";
import { niceUtils } from "./niceUtils.js";

const ostracodMultiplayerInstance = ostracodMultiplayer.ostracodMultiplayer;

// eslint-disable-next-line new-cap
const router = express.Router();

router.get("/javascript/gameConstants.js", (req, res, next) => {
    const tempLineList = [
        `let simpleSpiritSerialIntegerSet = ${JSON.stringify(simpleSpiritSerialIntegerSet)};`,
        `let complexSpiritClassIdSet = ${JSON.stringify(complexSpiritClassIdSet)};`,
        `let recipeDataList = ${JSON.stringify(recipeDataList)};`,
    ];
    res.send(tempLineList.join("\n"));
});

console.log("Starting BreadBoard server...");
const tempResult = ostracodMultiplayerInstance.initializeServer(
    pathUtils.resolve(),
    gameDelegate,
    [router]
);
if (!tempResult) {
    process.exit(1);
}

console.log("Loading world...");
// TODO: Disable web requests until this promise finishes.
niceUtils.performDbTransaction(() => (
    loadNextComplexSpiritId().then(loadOrCreateWorldSpirit)
)).then(() => {
    console.log("Finished loading world.");
});


