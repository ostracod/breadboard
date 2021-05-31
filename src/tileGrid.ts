
import { simpleSpiritSet, worldTileFactory, circuitTileFactory } from "./globalData.js";
import { TileGridJson, TileGridClientJson, TileGridDbJson, TileClientJson } from "./interfaces.js";
import { Pos } from "./pos.js";
import { niceUtils } from "./niceUtils.js";
import { ComplexSpirit } from "./spirit.js";
import { Tile } from "./tile.js";
import { WorldTile } from "./worldTile.js";
import { CircuitTile } from "./circuitTile.js";
import { TileFactory } from "./tileFactory.js";

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
        const tempPos = new Pos(0, 0);
        while (tempPos.y < this.height) {
            this.setTile(tempPos, this.fillTile);
            this.advancePos(tempPos);
        }
    }
    
    populateParentSpirit(spirit: ComplexSpirit): void {
        this.parentSpirit = spirit;
        for (const tile of this.tileList) {
            tile.spirit.populateParentSpirit(this.parentSpirit);
        }
    }
    
    markAsDirty(): void {
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
        const index = this.convertPosToIndex(pos);
        if (index === null) {
            return this.outsideTile;
        }
        return this.tileList[index];
    }
    
    setTile(pos: Pos, tile: T): void {
        const index = this.convertPosToIndex(pos);
        if (index === null) {
            return;
        }
        const oldTile = this.tileList[index];
        if (oldTile !== null) {
            oldTile.removeFromGridEvent();
        }
        this.tileList[index] = tile;
        tile.addToGridEvent(this, pos);
        this.markAsDirty();
    }
    
    swapTiles(pos1: Pos, pos2: Pos): void {
        const index1 = this.convertPosToIndex(pos1);
        const index2 = this.convertPosToIndex(pos2);
        const tempTile1 = this.tileList[index1];
        const tempTile2 = this.tileList[index2];
        this.tileList[index1] = tempTile2;
        this.tileList[index2] = tempTile1;
        tempTile1.moveEvent(pos2);
        tempTile2.moveEvent(pos1);
        this.markAsDirty();
    }
    
    getWindowClientJson(pos: Pos, width: number, height: number): TileClientJson[] {
        const output = [];
        const tempOffset = new Pos(0, 0);
        const tempPos = new Pos(0, 0);
        while (tempOffset.y < height) {
            tempPos.set(pos);
            tempPos.add(tempOffset);
            const tempTile = this.getTile(tempPos);
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
            tiles: this.tileList.map((tile) => getTileJson(tile)),
        };
    }
    
    getClientJson(): TileGridClientJson {
        return this.getJson((tile) => tile.getClientJson());
    }
    
    getDbJson(): TileGridDbJson {
        return this.getJson((tile) => tile.getDbJson());
    }
}

export const createWorldTileGrid = (width: number, height: number): TileGrid<WorldTile> => (
    new TileGrid<WorldTile>(width, height, worldTileFactory)
);

export const createCircuitTileGrid = (
    width: number,
    height: number,
): TileGrid<CircuitTile> => (
    new TileGrid<CircuitTile>(width, height, circuitTileFactory)
);

const convertDbJsonToTileGrid = async <T extends Tile>(
    data: TileGridDbJson,
    tileFactory: TileFactory<T>,
    shouldPerformTransaction: boolean,
): Promise<TileGrid<T>> => {
    const output = new TileGrid<T>(data.width, data.height, tileFactory);
    await niceUtils.performConditionalDbTransaction(shouldPerformTransaction, async () => {
        const tempPos = new Pos(0, 0);
        for (const tileData of data.tiles) {
            const tile = await tileFactory.convertDbJsonToTile(
                tileData as ReturnType<T["getDbJson"]>,
                false,
            );
            output.setTile(tempPos, tile);
            output.advancePos(tempPos);
        }
    });
    return output;
};

export const convertDbJsonToWorldTileGrid = async (
    data: TileGridDbJson,
    shouldPerformTransaction = true,
): Promise<TileGrid<WorldTile>> => (
    await convertDbJsonToTileGrid<WorldTile>(
        data,
        worldTileFactory,
        shouldPerformTransaction,
    )
);

export const convertDbJsonToCircuitTileGrid = async (
    data: TileGridDbJson,
    shouldPerformTransaction = true,
): Promise<TileGrid<CircuitTile>> => (
    await convertDbJsonToTileGrid<CircuitTile>(
        data,
        circuitTileFactory,
        shouldPerformTransaction,
    )
);


