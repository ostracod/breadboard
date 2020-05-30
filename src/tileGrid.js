
import {Pos} from "./pos.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let dbUtils = ostracodMultiplayer.dbUtils;

export class TileGrid {
    
    constructor(width, height, fillTile, outsideTile) {
        this.width = width;
        this.height = height;
        this.outsideTile = outsideTile;
        this.length = this.width * this.height;
        this.tileList = [];
        while (this.tileList.length < this.length) {
            this.tileList.push(fillTile);
        }
    }
    
    convertPosToIndex(pos) {
        if (pos.x < 0 || pos.x >= this.width
                || pos.y < 0 || pos.y >= this.height) {
            return null;
        }
        return pos.x + pos.y * this.width;
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
        this.tileList[index] = tile;
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

export function convertDbJsonToTileGrid(data, fillTile, outsideTile, convertDbJsonToTile) {
    return new Promise((resolve, reject) => {
        let output = new TileGrid(data.width, data.height, fillTile, outsideTile);
        dbUtils.performTransaction(callback => {
            let index = 0;
            function convertNextTile() {
                if (index >= data.tiles.length) {
                    callback();
                    return;
                }
                convertDbJsonToTile(
                    data.tiles[index],
                    false
                ).then(tile => {
                    output.tileList[index] = tile;
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


