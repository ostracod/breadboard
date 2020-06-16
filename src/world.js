
import {simpleSpiritTypeSet, complexSpiritTypeSet, simpleWorldTileSet} from "./globalData.js";
import {Pos} from "./pos.js";
import {createWorldTileGrid, convertDbJsonToWorldTileGrid} from "./tileGrid.js";
import {PlayerWorldTile} from "./worldTile.js";
import {getNextComplexSpiritId, setNextComplexSpiritId} from "./spirit.js";
import {loadComplexSpirit} from "./spiritType.js";

import * as fs from "fs";

const worldFilePath = "./world.json";
const defaultWorldSize = 100;

export class World {
    
    constructor(width, height) {
        this.tileGrid = null;
        this.playerTileList = [];
    }
    
    loadTileGrid() {
        if (fs.existsSync(worldFilePath)) {
            let tempData = JSON.parse(fs.readFileSync(worldFilePath, "utf8"));
            setNextComplexSpiritId(tempData.nextComplexSpiritId);
            return convertDbJsonToWorldTileGrid(tempData.tileGrid).then(tileGrid => {
                this.tileGrid = tileGrid
            });
        } else {
            this.tileGrid = createWorldTileGrid(defaultWorldSize, defaultWorldSize);
            this.generateTerrain();
            return Promise.resolve();
        }
    }
    
    generateTerrain() {
        for (let count = 0; count < 1000; count++) {
            let tempTile;
            if (Math.random() < 0.5) {
                tempTile = simpleWorldTileSet.matterite;
            } else {
                tempTile = simpleWorldTileSet.energite;
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
        tempOldTile.removeFromWorldEvent();
        tile.addToWorldEvent(this);
    }
    
    swapTiles(pos1, pos2) {
        this.tileGrid.swapTiles(pos1, pos2);
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
        if (index < 0) {
            return null;
        }
        return this.playerTileList[index];
    }
    
    getPlayerSpirit(player) {
        let tempTile = this.getPlayerTile(player);
        if (tempTile === null) {
            return null;
        }
        return tempTile.spirit;
    }
    
    addPlayerTile(player) {
        let tempTile = this.getPlayerTile(player);
        if (tempTile !== null) {
            return Promise.resolve(tempTile.spirit);
        }
        let tempPromise;
        let tempId = player.extraFields.complexSpiritId;
        if (tempId === null) {
            let tempSpirit = complexSpiritTypeSet.player.createPlayerSpirit(player);
            tempPromise = Promise.resolve(tempSpirit);
        } else {
            tempPromise = loadComplexSpirit(tempId);
        }
        return tempPromise.then(spirit => {
            let tempTile = new PlayerWorldTile(spirit);
            // TODO: Make player tile placement more robust.
            let tempPos = new Pos(3, 3);
            while (true) {
                let tempOldTile = this.getTile(tempPos);
                if (tempOldTile.spirit.spiritType === simpleSpiritTypeSet.empty) {
                    break;
                }
                tempPos.x += 1;
            }
            tempTile.addToWorld(this, tempPos);
            return spirit;
        });
    }
    
    tick() {
        // TODO: Put something here.
        
        return Promise.resolve();
    }
    
    getDbJson() {
        return {
            nextComplexSpiritId: getNextComplexSpiritId(),
            tileGrid: this.tileGrid.getDbJson()
        };
    }
    
    persist() {
        fs.writeFileSync(worldFilePath, JSON.stringify(this.getDbJson()));
    }
}


