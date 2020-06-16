
import {simpleSpiritSet, worldTileFactory, circuitTileFactory} from "./globalData.js";
import {Pos} from "./pos.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let dbUtils = ostracodMultiplayer.dbUtils;

export class TileGrid {
    
    constructor(width, height, tileFactory) {
        this.width = width;
        this.height = height;
        this.tileFactory = tileFactory;
        this.fillTile = this.tileFactory.getTileWithSpirit(simpleSpiritSet.empty);
        this.outsideTile = this.tileFactory.getTileWithSpirit(simpleSpiritSet.barrier);
        this.length = this.width * this.height;
        this.tileList = [];
        while (this.tileList.length < this.length) {
            this.tileList.push(null);
        }
        let tempPos = new Pos(0, 0);
        while (tempPos.y < this.height) {
            this.setTile(tempPos, this.fillTile);
            this.advancePos(tempPos);
        }
    }
    
    convertPosToIndex(pos) {
        if (pos.x < 0 || pos.x >= this.width
                || pos.y < 0 || pos.y >= this.height) {
            return null;
        }
        return pos.x + pos.y * this.width;
    }
    
    advancePos(pos) {
        pos.x += 1;
        if (pos.x >= this.width) {
            pos.x = 0;
            pos.y += 1;
        }
    }
    
    getTile(pos) {
        let index = this.convertPosToIndex(pos);
        if (index === null) {
            return this.outsideTile;
        }
        return this.tileList[index];
    }
    
    setTile(pos, tile) {
        let index = this.convertPosToIndex(pos);
        if (index === null) {
            return;
        }
        let oldTile = this.tileList[index];
        if (oldTile !== null) {
            oldTile.removeFromGridEvent();
        }
        this.tileList[index] = tile;
        tile.addToGridEvent(this, pos);
    }
    
    swapTiles(pos1, pos2) {
        let index1 = this.convertPosToIndex(pos1);
        let index2 = this.convertPosToIndex(pos2);
        let tempTile1 = this.tileList[index1];
        let tempTile2 = this.tileList[index2];
        this.tileList[index1] = tempTile2;
        this.tileList[index2] = tempTile1;
        tempTile1.moveEvent(pos2);
        tempTile2.moveEvent(pos1);
    }
    
    getWindowClientJson(pos, width, height) {
        let output = [];
        let tempOffset = new Pos(0, 0);
        let tempPos = new Pos(0, 0);
        while (tempOffset.y < height) {
            tempPos.set(pos);
            tempPos.add(tempOffset);
            let tempTile = this.getTile(tempPos);
            output.push(tempTile.getClientJson());
            tempOffset.x += 1;
            if (tempOffset.x >= width) {
                tempOffset.x = 0;
                tempOffset.y += 1;
            }
        }
        return output;
    }
    
    getJson(getTileJson) {
        return {
            width: this.width,
            height: this.height,
            tiles: this.tileList.map(tile => getTileJson(tile))
        };
    }
    
    getClientJson() {
        return this.getJson(tile => tile.getClientJson());
    }
    
    getDbJson() {
        return this.getJson(tile => tile.getDbJson());
    }
}

export function createWorldTileGrid(width, height) {
    return new TileGrid(width, height, worldTileFactory);
}

export function createCircuitTileGrid(width, height) {
    return new TileGrid(width, height, circuitTileFactory);
}

function convertDbJsonToTileGrid(data, tileFactory) {
    return new Promise((resolve, reject) => {
        let output = new TileGrid(data.width, data.height, tileFactory);
        dbUtils.performTransaction(callback => {
            let tempPos = new Pos(0, 0);
            let index = 0;
            function convertNextTile() {
                if (index >= data.tiles.length) {
                    callback();
                    return;
                }
                tileFactory.convertDbJsonToTile(data.tiles[index], false).then(tile => {
                    output.setTile(tempPos, tile);
                    output.advancePos(tempPos);
                    index += 1;
                    convertNextTile();
                });
            }
            convertNextTile();
        }, () => {
            resolve(output);
        });
    });
}

export function convertDbJsonToWorldTileGrid(data) {
    return convertDbJsonToTileGrid(data, worldTileFactory);
}

export function convertDbJsonToCircuitTileGrid(data) {
    return convertDbJsonToTileGrid(data, circuitTileFactory);
}


