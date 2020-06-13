
import {complexSpiritClassIdSet, simpleWorldTileMap, complexWorldTileFactoryMap} from "./globalData.js";
import {convertNestedDbJsonToSpirit} from "./spiritType.js";
import {SimpleSpirit, ComplexSpirit} from "./spirit.js";
import {ComplexWorldTile, PlayerWorldTile, MachineWorldTile} from "./worldTile.js";

export class ComplexWorldTileFactory {
    
    constructor(spiritClassId) {
        complexWorldTileFactoryMap[spiritClassId] = this;
    }
    
    convertDbJsonToTile(data, spirit) {
        return new ComplexWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new ComplexWorldTile(spirit);
    }
}

export class PlayerWorldTileFactory extends ComplexWorldTileFactory {
    
    constructor() {
        super(complexSpiritClassIdSet.player);
    }
    
    convertDbJsonToTile(data, spirit) {
        throw new Error("Player should not be persisted as world tile.");
    }
    
    createTileWithSpirit(spirit) {
        return new PlayerWorldTile(spirit);
    }
}

export class MachineWorldTileFactory extends ComplexWorldTileFactory {
    
    constructor() {
        super(complexSpiritClassIdSet.machine);
    }
    
    convertDbJsonToTile(data, spirit) {
        return new MachineWorldTile(spirit);
    }
    
    createTileWithSpirit(spirit) {
        return new MachineWorldTile(spirit);
    }
}

export function getWorldTileWithSpirit(spirit) {
    if (spirit instanceof SimpleSpirit) {
        return simpleWorldTileMap[spirit.serialInteger];
    }
    if (spirit instanceof ComplexSpirit) {
        let tempFactory = complexWorldTileFactoryMap[spirit.classId];
        return tempFactory.createTileWithSpirit(spirit);
    }
    return null;
}

export function convertDbJsonToWorldTile(data, shouldPerformTransaction = true) {
    if (typeof data === "number") {
        return Promise.resolve(simpleWorldTileMap[data]);
    } else {
        return convertNestedDbJsonToSpirit(
            data.spirit,
            shouldPerformTransaction
        ).then(spirit => {
            let tempFactory = complexWorldTileFactoryMap[spirit.classId];
            return tempFactory.convertDbJsonToTile(data, spirit);
        });
    }
}


