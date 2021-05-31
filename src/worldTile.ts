
import { simpleSpiritTypeSet, simpleWorldTileSet, simpleWorldTileMap } from "./globalData.js";
import { WalkControllerJson, PlayerWorldTileClientJson, TileDbJson } from "./interfaces.js";
import { Pos } from "./pos.js";
import { Spirit, SimpleSpirit, ComplexSpirit, MachineSpirit } from "./spirit.js";
import { PlayerSpirit } from "./playerSpirit.js";
import { WorldSpirit } from "./worldSpirit.js";
import { SpiritReference } from "./spiritReference.js";
import { Tile, simpleTileComplexity, ComplexTileComplexity } from "./tile.js";
import { TileGrid } from "./tileGrid.js";

export class WorldTile<T extends Spirit = Spirit> extends Tile<T> {
    
    getSimpleTileSet(): {[name: string]: SimpleWorldTile} {
        return simpleWorldTileSet;
    }
    
    getSimpleTileMap(): {[serialInteger: string]: SimpleWorldTile} {
        return simpleWorldTileMap;
    }
    
    addToWorldEvent(worldSpirit: WorldSpirit): void {
        // Do nothing.
    }
    
    removeFromWorldEvent(): void {
        // Do nothing.
    }
    
    canBeMined(): boolean {
        return this.spirit.canBeMined();
    }
}

export class SimpleWorldTile extends WorldTile<SimpleSpirit> {
    
    constructor(spirit: SimpleSpirit) {
        super(spirit, simpleTileComplexity);
    }
}

export class ComplexWorldTile<T extends ComplexSpirit = ComplexSpirit> extends WorldTile<T> {
    
    worldSpirit: WorldSpirit;
    pos: Pos;
    
    constructor(spirit: T) {
        super(spirit, new ComplexTileComplexity());
        this.worldSpirit = null;
        this.pos = null;
    }
    
    addToGridEvent(tileGrid: TileGrid<WorldTile>, pos: Pos): void {
        super.addToGridEvent(tileGrid, pos);
        this.pos = pos.copy();
    }
    
    removeFromGridEvent(): void {
        super.removeFromGridEvent();
        this.pos = null;
    }
    
    addToWorldEvent(worldSpirit: WorldSpirit): void {
        super.addToWorldEvent(worldSpirit);
        this.worldSpirit = worldSpirit;
    }
    
    removeFromWorldEvent(): void {
        super.removeFromWorldEvent();
        this.worldSpirit = null;
    }
    
    moveEvent(pos: Pos): void {
        super.moveEvent(pos);
        this.pos.set(pos);
    }
    
    addToWorld(worldSpirit: WorldSpirit, pos: Pos): void {
        worldSpirit.setTile(pos, this);
    }
    
    removeFromWorld(): void {
        this.worldSpirit.setTile(this.pos, simpleWorldTileSet.empty);
    }
    
    move(offset: Pos): boolean {
        const tempNextPos = this.pos.copy();
        tempNextPos.add(offset);
        const tempTile = this.worldSpirit.getTile(tempNextPos);
        if (tempTile.spirit.spiritType !== simpleSpiritTypeSet.empty) {
            return false;
        }
        this.worldSpirit.swapTiles(this.pos, tempNextPos);
        return true;
    }
}

class TimeBudget {
    
    maximumTime: number;
    time: number;
    lastTimestamp: number;
    
    constructor(maximumTime: number) {
        this.maximumTime = maximumTime;
        this.time = this.maximumTime;
        this.lastTimestamp = Date.now() / 1000;
    }
    
    spendTime(amount: number): boolean {
        
        // Update the amount of time we can spend.
        const tempTimestamp = Date.now() / 1000;
        this.time += tempTimestamp - this.lastTimestamp;
        if (this.time > this.maximumTime) {
            this.time = this.maximumTime;
        }
        this.lastTimestamp = tempTimestamp;
        
        // Determine if we have enough time to spend.
        if (this.time <= 0) {
            return false;
        }
        
        // Spend the time.
        this.time -= amount;
        return true;
    }
}

export class PlayerWorldTile extends ComplexWorldTile<PlayerSpirit> {
    
    walkControllerData: WalkControllerJson;
    walkTimeBudget: TimeBudget;
    mineTimeBudget: TimeBudget;
    
    constructor(playerSpirit: PlayerSpirit) {
        super(playerSpirit);
        this.walkControllerData = null;
        this.walkTimeBudget = new TimeBudget(6);
        this.mineTimeBudget = new TimeBudget(6);
    }
    
    getClientJson(): PlayerWorldTileClientJson {
        const output = super.getClientJson() as PlayerWorldTileClientJson;
        output.walkController = this.walkControllerData;
        return output;
    }
    
    getDbJson(): TileDbJson {
        return simpleWorldTileSet.empty.getDbJson();
    }
    
    addToWorldEvent(worldSpirit: WorldSpirit): void {
        super.addToWorldEvent(worldSpirit);
        this.worldSpirit.playerTileList.push(this);
    }
    
    removeFromWorldEvent(): void {
        const index = this.worldSpirit.findPlayerTile(this.spirit.player);
        this.worldSpirit.playerTileList.splice(index, 1);
        super.removeFromWorldEvent();
    }
    
    walk(offset: Pos): void {
        const tempResult = this.walkTimeBudget.spendTime(0.08);
        if (!tempResult) {
            return;
        }
        this.move(offset);
    }
    
    mine(pos: Pos): void {
        const tempResult = this.mineTimeBudget.spendTime(1.44);
        if (!tempResult) {
            return;
        }
        const tempTile = this.worldSpirit.getTile(pos);
        if (!tempTile.canBeMined()) {
            return;
        }
        this.worldSpirit.setTile(pos, simpleWorldTileSet.empty);
        this.spirit.inventory.incrementItemCountBySpirit(tempTile.spirit);
    }
    
    placeWorldTile(pos: Pos, spiritReference: SpiritReference): void {
        let tempTile = this.worldSpirit.getTile(pos);
        if (tempTile.spirit.spiritType !== simpleSpiritTypeSet.empty) {
            return;
        }
        const tempItem = this.spirit.inventory.getItemBySpiritReference(spiritReference);
        if (tempItem === null) {
            return;
        }
        if (tempItem.count < 1) {
            return;
        }
        tempItem.setCount(tempItem.count - 1);
        tempTile = tempItem.spirit.getWorldTile();
        this.worldSpirit.setTile(pos, tempTile);
    }
}

export class MachineWorldTile extends ComplexWorldTile<MachineSpirit> {
    
}


