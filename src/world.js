
import {Pos} from "./pos.js";
import {TileGrid, convertJsonToTileGrid} from "./tileGrid.js";
import {emptyWorldTile, barrierWorldTile, matteriteWorldTile, energiteWorldTile} from "./worldTile.js";
import {getWorldTileWithSpirit} from "./worldTileFactory.js";

import * as fs from "fs";

const worldFilePath = "./world.json";
const defaultWorldSize = 100;
const worldFillTile = emptyWorldTile;
const worldOutsideTile = barrierWorldTile;

class World {
    
    constructor(width, height) {
        if (fs.existsSync(worldFilePath)) {
            let tempData = JSON.parse(fs.readFileSync(worldFilePath, "utf8"));
            this.tileGrid = convertJsonToTileGrid(
                tempData,
                worldFillTile,
                worldOutsideTile,
                getWorldTileWithSpirit
            );
        } else {
            this.tileGrid = new TileGrid(
                defaultWorldSize,
                defaultWorldSize,
                worldFillTile,
                worldOutsideTile
            );
            this.generateTerrain();
        }
        this.playerTileList = [];
    }
    
    generateTerrain() {
        for (let count = 0; count < 1000; count++) {
            let tempTile;
            if (Math.random() < 0.5) {
                tempTile = matteriteWorldTile;
            } else {
                tempTile = energiteWorldTile;
            }
            let tempPos = new Pos(
                Math.floor(Math.random() * this.tileGrid.width),
                Math.floor(Math.random() * this.tileGrid.height)
            );
            this.tileGrid.setTile(tempPos, tempTile);
        }
    }
    
    getTile(pos) {
        return this.tileGrid.getTile(pos);
    }
    
    setTile(pos, tile) {
        let tempOldTile = this.tileGrid.getTile(pos);
        this.tileGrid.setTile(pos, tile);
        tempOldTile.removeEvent();
        tile.addEvent(this, pos);
    }
    
    swapTiles(pos1, pos2) {
        let tempTile1 = this.tileGrid.getTile(pos1);
        let tempTile2 = this.tileGrid.getTile(pos2);
        this.tileGrid.setTile(pos2, tempTile1);
        this.tileGrid.setTile(pos1, tempTile2);
        tempTile1.moveEvent(pos2);
        tempTile2.moveEvent(pos1);
    }
    
    getClientJson(pos, width, height) {
        return this.tileGrid.getWindowClientJson(pos, width, height);
    }
    
    findPlayerTile(player) {
        for (let index = 0; index < this.playerTileList.length; index++) {
            let tempTile = this.playerTileList[index];
            let tempPlayer = tempTile.spirit.player;
            if (tempPlayer.username == player.username) {
                return index;
            }
        }
        return -1;
    }
    
    getPlayerTile(player) {
        let index = this.findPlayerTile(player);
        return this.playerTileList[index];
    }
    
    getPlayerSpirit(player) {
        let tempTile = this.getPlayerTile(player);
        return tempTile.spirit;
    }
    
    tick() {
        // TODO: Put something here.
        
    }
    
    getDbJson() {
        return this.tileGrid.getDbJson();
    }
    
    persist() {
        fs.writeFileSync(worldFilePath, JSON.stringify(this.getDbJson()));
    }
}

export let world = new World();


