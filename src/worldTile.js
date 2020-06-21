
import {simpleSpiritTypeSet, simpleWorldTileSet, simpleWorldTileMap, worldTileFactory} from "./globalData.js";
import {Tile, simpleTileComplexity, complexTileComplexity} from "./tile.js";

export class WorldTile extends Tile {
    
    getSimpleTileSet() {
        return simpleWorldTileSet;
    }
    
    getSimpleTileMap() {
        return simpleWorldTileMap;
    }
    
    addToWorldEvent(worldSpirit) {
        // Do nothing.
    }
    
    removeFromWorldEvent() {
        // Do nothing.
    }
    
    canBeMined() {
        return this.spirit.canBeMined();
    }
}

export class SimpleWorldTile extends WorldTile {
    
    constructor(spirit) {
        super(spirit, simpleTileComplexity);
    }
}

export class ComplexWorldTile extends WorldTile {
    
    constructor(spirit) {
        super(spirit, complexTileComplexity);
        this.worldSpirit = null;
        this.pos = null;
    }
    
    addToGridEvent(tileGrid, pos) {
        super.addToGridEvent(tileGrid, pos);
        this.pos = pos.copy();
    }
    
    removeFromGridEvent() {
        super.removeFromGridEvent();
        this.pos = null;
    }
    
    addToWorldEvent(worldSpirit) {
        super.addToWorldEvent(worldSpirit);
        this.worldSpirit = worldSpirit;
    }
    
    removeFromWorldEvent() {
        super.removeFromWorldEvent();
        this.worldSpirit = null;
    }
    
    moveEvent(pos) {
        super.moveEvent(pos);
        this.pos.set(pos);
    }
    
    addToWorld(worldSpirit, pos) {
        worldSpirit.setTile(pos, this);
    }
    
    removeFromWorld() {
        this.worldSpirit.setTile(this.pos, simpleWorldTileSet.empty);
    }
    
    move(offset) {
        let tempNextPos = this.pos.copy();
        tempNextPos.add(offset);
        let tempTile = this.worldSpirit.getTile(tempNextPos);
        if (tempTile.spirit.spiritType !== simpleSpiritTypeSet.empty) {
            return false;
        }
        this.worldSpirit.swapTiles(this.pos, tempNextPos);
        return true;
    }
}

class TimeBudget {
    
    constructor(maximumTime) {
        this.maximumTime = maximumTime;
        this.time = this.maximumTime;
        this.lastTimestamp = Date.now() / 1000;
    }
    
    spendTime(amount) {
        
        // Update the amount of time we can spend.
        let tempTimestamp = Date.now() / 1000;
        this.time += tempTimestamp - this.lastTimestamp;
        if (this.time > this.maximumTime) {
            this.time = this.maximumTime;
        }
        this.lastTimestamp = tempTimestamp;
        
        // Determine if we have enough time to spend.
        if (this.time <= 0) {
            return false
        }
        
        // Spend the time.
        this.time -= amount;
        return true;
    }
}

export class PlayerWorldTile extends ComplexWorldTile {
    
    constructor(playerSpirit) {
        super(playerSpirit);
        this.walkControllerData = null;
        this.walkTimeBudget = new TimeBudget(6);
        this.mineTimeBudget = new TimeBudget(6);
    }
    
    getClientJson() {
        let output = super.getClientJson();
        output.walkController = this.walkControllerData;
        return output;
    }
    
    getDbJson() {
        return simpleWorldTileSet.empty.getDbJson();
    }
    
    addToWorldEvent(worldSpirit) {
        super.addToWorldEvent(worldSpirit);
        this.worldSpirit.playerTileList.push(this);
    }
    
    removeFromWorldEvent() {
        let index = this.worldSpirit.findPlayerTile(this.spirit.player);
        this.worldSpirit.playerTileList.splice(index, 1);
        super.removeFromWorldEvent();
    }
    
    walk(offset) {
        let tempResult = this.walkTimeBudget.spendTime(0.08);
        if (!tempResult) {
            return;
        }
        this.move(offset);
    }
    
    mine(pos) {
        let tempResult = this.mineTimeBudget.spendTime(1.44);
        if (!tempResult) {
            return;
        }
        let tempTile = this.worldSpirit.getTile(pos);
        if (!tempTile.canBeMined()) {
            return;
        }
        this.worldSpirit.setTile(pos, simpleWorldTileSet.empty);
        this.spirit.inventory.incrementItemCountBySpirit(tempTile.spirit);
    }
    
    placeWorldTile(pos, spiritReference) {
        let tempTile = this.worldSpirit.getTile(pos);
        if (tempTile.spirit.spiritType !== simpleSpiritTypeSet.empty) {
            return;
        }
        let tempItem = this.spirit.inventory.getItemBySpiritReference(spiritReference);
        if (tempItem === null) {
            return;
        }
        if (tempItem.count < 1) {
            return;
        }
        tempItem.setCount(tempItem.count - 1);
        tempTile = worldTileFactory.getTileWithSpirit(tempItem.spirit);
        this.worldSpirit.setTile(pos, tempTile);
    }
}

export class MachineWorldTile extends ComplexWorldTile {
    
}


