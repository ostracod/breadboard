
import {simpleSpiritSet, worldTileFactory, circuitTileFactory} from "./globalData.js";
import {TileGridJson, TileGridClientJson, TileGridDbJson, TileClientJson} from "./interfaces.js";
import {Pos} from "./pos.js";
import {niceUtils} from "./niceUtils.js";
import {ComplexSpirit} from "./spirit.js";
import {Tile} from "./tile.js";
import {WorldTile} from "./worldTile.js";
import {CircuitTile} from "./circuitTile.js";
import {TileFactory} from "./tileFactory.js";

export class TileGrid<T extends Tile = Tile> {
    
    width: number;
    height: number;
    tileFactory: TileFactory<T>;
    parentSpirit: ComplexSpirit;
    fillTile: T;
    outsideTile: T;
    length: number;
    tileList: T[];
    
    constructor(width: number, height: number, tileFactory: TileFactory<T>) {
        this.width = width;
        this.height = height;
        this.tileFactory = tileFactory;
        this.parentSpirit = null;
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
    
    populateParentSpirit(spirit: ComplexSpirit): void {
        this.parentSpirit = spirit;
        for (let tile of this.tileList) {
            tile.spirit.populateParentSpirit(this.parentSpirit);
        }
    }
    
    markParentSpiritAsDirty(): void {
        if (this.parentSpirit === null) {
            return;
        }
        this.parentSpirit.markAsDirty();
    }
    
    convertPosToIndex(pos: Pos): number {
        if (pos.x < 0 || pos.x >= this.width
                || pos.y < 0 || pos.y >= this.height) {
            return null;
        }
        return pos.x + pos.y * this.width;
    }
    
    advancePos(pos: Pos): void {
        pos.x += 1;
        if (pos.x >= this.width) {
            pos.x = 0;
            pos.y += 1;
        }
    }
    
    getTile(pos: Pos): T {
        let index = this.convertPosToIndex(pos);
        if (index === null) {
            return this.outsideTile;
        }
        return this.tileList[index];
    }
    
    setTile(pos: Pos, tile: T): void {
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
        this.markParentSpiritAsDirty();
    }
    
    swapTiles(pos1: Pos, pos2: Pos): void {
        let index1 = this.convertPosToIndex(pos1);
        let index2 = this.convertPosToIndex(pos2);
        let tempTile1 = this.tileList[index1];
        let tempTile2 = this.tileList[index2];
        this.tileList[index1] = tempTile2;
        this.tileList[index2] = tempTile1;
        tempTile1.moveEvent(pos2);
        tempTile2.moveEvent(pos1);
        this.markParentSpiritAsDirty();
    }
    
    getWindowClientJson(pos: Pos, width: number, height: number): TileClientJson {
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
    
    getJson<T2>(getTileJson: (tile: T) => T2): TileGridJson<T2> {
        return {
            width: this.width,
            height: this.height,
            tiles: this.tileList.map(tile => getTileJson(tile))
        };
    }
    
    getClientJson(): TileGridClientJson {
        return this.getJson(tile => tile.getClientJson());
    }
    
    getDbJson(): TileGridDbJson {
        return this.getJson(tile => tile.getDbJson());
    }
}

export function createWorldTileGrid(width: number, height: number): TileGrid<WorldTile> {
    return new TileGrid<WorldTile>(width, height, worldTileFactory);
}

export function createCircuitTileGrid(width: number, height: number): TileGrid<CircuitTile> {
    return new TileGrid<CircuitTile>(width, height, circuitTileFactory);
}

function convertDbJsonToTileGrid<T extends Tile>(
    data: TileGridDbJson,
    tileFactory: TileFactory<T>,
    shouldPerformTransaction: boolean
): Promise<TileGrid<T>> {
    let output = new TileGrid<T>(data.width, data.height, tileFactory);
    return niceUtils.performConditionalDbTransaction(shouldPerformTransaction, () => {
        let tempPos = new Pos(0, 0);
        return data.tiles.reduce((accumulator, tileData) => {
            return accumulator.then(() => {
                return tileFactory.convertDbJsonToTile(tileData, false);
            }).then(tile => {
                output.setTile(tempPos, tile);
                output.advancePos(tempPos);
            });
        }, Promise.resolve());
    }).then(() => output);
}

export function convertDbJsonToWorldTileGrid(
    data: TileGridDbJson,
    shouldPerformTransaction = true,
): Promise<TileGrid<WorldTile>> {
    return convertDbJsonToTileGrid<WorldTile>(
        data,
        worldTileFactory,
        shouldPerformTransaction,
    );
}

export function convertDbJsonToCircuitTileGrid(
    data: TileGridDbJson,
    shouldPerformTransaction = true,
): Promise<TileGrid<CircuitTile>> {
    return convertDbJsonToTileGrid<CircuitTile>(
        data,
        circuitTileFactory,
        shouldPerformTransaction,
    );
}


