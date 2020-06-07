
import {Tile} from "./tile.js";
import {simpleSpiritSerialIntegerSet, emptySpiritType} from "./spiritType.js";
import {simpleSpiritSet} from "./spirit.js";
import {getWorldTileWithSpirit} from "./worldTileFactory.js";

// Map from spirit serial integer to WorldTile.
export let simpleWorldTileMap = {};

class WorldTile extends Tile {
    
    addEvent(world, pos) {
        // Do nothing.
    }
    
    removeEvent() {
        // Do nothing.
    }
    
    moveEvent(pos) {
        // Do nothing.
    }
    
    canBeMined() {
        return this.spirit.canBeMined();
    }
}

class SimpleWorldTile extends WorldTile {
    
    constructor(simpleSpirit) {
        super(simpleSpirit);
        let tempSerialInteger = this.spirit.serialInteger;
        simpleWorldTileMap[tempSerialInteger] = this;
    }
    
    getClientJson() {
        return this.spirit.getClientJson();
    }
    
    getDbJson() {
        return this.spirit.getNestedDbJson();
    }
}

for (let serialInteger in simpleSpiritSet) {
    let tempSpirit = simpleSpiritSet[serialInteger];
    new SimpleWorldTile(tempSpirit);
}

function getSimpleWorldTile(spiritKey) {
    let tempInteger = simpleSpiritSerialIntegerSet[spiritKey];
    return simpleWorldTileMap[tempInteger];
}

export let emptyWorldTile = getSimpleWorldTile("empty");
export let barrierWorldTile = getSimpleWorldTile("barrier");
export let matteriteWorldTile = getSimpleWorldTile("matterite");
export let energiteWorldTile = getSimpleWorldTile("energite");

class ComplexWorldTile extends WorldTile {
    
    constructor(spirit) {
        super(spirit);
        this.world = null;
        this.pos = null;
    }
    
    getClientJson() {
        return {
            spirit: this.spirit.getClientJson()
        };
    }
    
    getDbJson() {
        let tempSpiritData = this.spirit.getNestedDbJson();
        if (tempSpiritData === null) {
            return emptyWorldTile.getDbJson();
        }
        return {
            spirit: tempSpiritData
        };
    }
    
    addEvent(world, pos) {
        super.addEvent(world, pos);
        this.world = world;
        this.pos = pos.copy();
    }
    
    removeEvent() {
        super.removeEvent();
        this.world = null;
        this.pos = null;
    }
    
    moveEvent(pos) {
        super.moveEvent(pos);
        this.pos.set(pos);
    }
    
    addToWorld(world, pos) {
        world.setTile(pos, this);
    }
    
    removeFromWorld() {
        this.world.setTile(this.pos, emptyWorldTile);
    }
    
    move(offset) {
        let tempNextPos = this.pos.copy();
        tempNextPos.add(offset);
        let tempTile = this.world.getTile(tempNextPos);
        if (tempTile.spirit.spiritType !== emptySpiritType) {
            return false;
        }
        this.world.swapTiles(this.pos, tempNextPos);
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
    
    addEvent(world, pos) {
        super.addEvent(world, pos);
        this.world.playerTileList.push(this);
    }
    
    removeEvent() {
        let index = this.world.findPlayerTile(this.spirit.player);
        this.world.playerTileList.splice(index, 1);
        super.removeEvent();
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
            return false;
        }
        let tempTile = this.world.getTile(pos);
        if (!tempTile.canBeMined()) {
            return false;
        }
        this.world.setTile(pos, emptyWorldTile);
        this.spirit.inventory.incrementItemCountBySpirit(tempTile.spirit);
        return true;
    }
    
    placeWorldTile(pos, spiritReference) {
        let tempTile = this.world.getTile(pos);
        if (tempTile.spirit.spiritType !== emptySpiritType) {
            return false;
        }
        let tempItem = this.spirit.inventory.getItemBySpiritReference(spiritReference);
        if (tempItem === null) {
            return false;
        }
        if (tempItem.count < 1) {
            return false;
        }
        tempItem.setCount(tempItem.count - 1);
        tempTile = getWorldTileWithSpirit(tempItem.spirit);
        this.world.setTile(pos, tempTile);
        return true;
    }
    
    inspect(spiritReference) {
        // TODO: Allow inspection of tile adjacent to player.
        return this.spirit.inspect(spiritReference);
    }
}

export class MachineWorldTile extends ComplexWorldTile {
    
}


