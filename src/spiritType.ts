
import {simpleSpiritSerialIntegerSet, complexSpiritClassIdSet, simpleSpiritTypeSet, complexSpiritTypeSet, dirtyComplexSpiritMap, simpleSpiritTypeMap, complexSpiritTypesMap} from "./globalData.js";
import {SpiritTypeJson, ComplexSpiritTypeJson, MachineSpiritTypeJson} from "./interfaces.js";
import {Spirit, SimpleSpirit, PlayerSpirit, MachineSpirit, WorldSpirit, CircuitSpirit} from "./spirit.js";
import {convertDbJsonToInventory} from "./inventory.js";
import {RecipeComponent} from "./recipe.js";
import {convertDbJsonToWorldTileGrid, convertDbJsonToCircuitTileGrid} from "./tileGrid.js";
import {niceUtils} from "./niceUtils.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let gameUtils = ostracodMultiplayer.gameUtils;

// A SpiritType serves the following purposes:
// > Identify whether a spirit instance matches particular criteria
// > Create new instances of spirits

export abstract class SpiritType {
    
    baseName: string;
    
    constructor(baseName) {
        this.baseName = baseName;
    }
    
    matchesSpirit(spirit) {
        return (spirit.spiritType === this);
    }
    
    canBeMined() {
        return false;
    }
    
    canBeInspected() {
        return false;
    }
    
    // Returns a list of RecipeComponent.
    getBaseRecycleProducts() {
        return [];
    }
    
    isFreeToCraft() {
        return false;
    }
    
    abstract matchesSpiritDbJson(data): boolean;
    
    abstract getJson(): SpiritTypeJson;
    
    abstract matchesJson(data): boolean;
    
    abstract convertDbJsonToSpirit(data, shouldPerformTransaction): Promise<Spirit>;
    
    abstract craft(): Spirit;
}

export class SimpleSpiritType extends SpiritType {
    
    serialInteger: number;
    spirit: SimpleSpirit;
    
    constructor(baseName, offset = 0) {
        super(baseName);
        this.serialInteger = simpleSpiritSerialIntegerSet[this.baseName] + offset;
        this.spirit = new SimpleSpirit(this);
        simpleSpiritTypeSet[this.baseName] = this;
        simpleSpiritTypeMap[this.serialInteger] = this;
    }
    
    matchesSpiritDbJson(data) {
        return (typeof data === "number" && this.serialInteger === data);
    }
    
    getJson() {
        return {
            type: "simple",
            serialInteger: this.serialInteger
        };
    }
    
    matchesJson(data) {
        return (data.type === "simple" && this.spirit.serialInteger === data.serialInteger);
    }
    
    convertDbJsonToSpirit(data, shouldPerformTransaction) {
        return Promise.resolve(this.spirit);
    }
    
    craft() {
        return this.spirit;
    }
}

export class EmptySpiritType extends SimpleSpiritType {
    
    constructor() {
        super("empty");
    }
    
    isFreeToCraft() {
        return true;
    }
}

export class BarrierSpiritType extends SimpleSpiritType {
    
    constructor() {
        super("barrier");
    }
}

class ResourceSpiritType extends SimpleSpiritType {
    
    canBeMined() {
        return true;
    }
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(this, 1)];
    }
}

export class MatteriteSpiritType extends ResourceSpiritType {
    
    constructor() {
        super("matterite");
    }
}

export class EnergiteSpiritType extends ResourceSpiritType {
    
    constructor() {
        super("energite");
    }
}

export class BlockSpiritType extends SimpleSpiritType {
    
    constructor(colorIndex) {
        super("block", colorIndex);
    }
    
    canBeMined() {
        return true;
    }
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(simpleSpiritTypeSet.matterite, 1.5)];
    }
}

export class WireSpiritType extends SimpleSpiritType {
    
    arrangement: number;
    
    constructor(arrangement) {
        super("wire", arrangement);
        this.arrangement = arrangement;
    }
    
    isFreeToCraft() {
        return true;
    }
}

export abstract class ComplexSpiritType extends SpiritType {
    
    spiritClassId: number;
    
    constructor(baseName) {
        super(baseName);
        this.spiritClassId = complexSpiritClassIdSet[this.baseName];
        complexSpiritTypeSet[this.baseName] = this;
        if (!(this.spiritClassId in complexSpiritTypesMap)) {
            complexSpiritTypesMap[this.spiritClassId] = [];
        }
        complexSpiritTypesMap[this.spiritClassId].push(this);
    }
    
    matchesSpiritDbJson(data) {
        return (typeof data !== "number" && this.spiritClassId === data.classId);
    }
    
    getJson(): ComplexSpiritTypeJson {
        return {
            type: "complex",
            classId: this.spiritClassId
        };
    }
    
    matchesJson(data) {
        return (data.type === "complex" && this.spiritClassId === data.classId);
    }
}

export class PlayerSpiritType extends ComplexSpiritType {
    
    constructor() {
        super("player");
    }
    
    convertDbJsonToSpirit(data, shouldPerformTransaction) {
        let tempPlayer = gameUtils.getPlayerByUsername(data.attributeData.username);
        if (tempPlayer === null) {
            return Promise.resolve(null);
        } else {
            return convertDbJsonToInventory(
                data.containerData,
                shouldPerformTransaction
            ).then(inventory => {
                return new PlayerSpirit(this, tempPlayer, inventory);
            });
        }
    }
    
    craft(): Spirit {
        throw new Error("Cannot craft player.");
    }
    
    createPlayerSpirit(player) {
        return new PlayerSpirit(this, player);
    }
}

export class MachineSpiritType extends ComplexSpiritType {
    
    colorIndex: number;
    
    constructor(colorIndex) {
        super("machine");
        this.colorIndex = colorIndex;
    }
    
    matchesSpiritDbJson(data) {
        return (super.matchesSpiritDbJson(data)
            && this.colorIndex === data.attributeData.colorIndex);
    }
    
    getJson(): MachineSpiritTypeJson {
        let output = super.getJson() as MachineSpiritTypeJson;
        output.colorIndex = this.colorIndex;
        return output;
    }
    
    matchesJson(data) {
        return (super.matchesJson(data) && this.colorIndex === data.colorIndex);
    }
    
    convertDbJsonToSpirit(data, shouldPerformTransaction) {
        return convertDbJsonToInventory(
            data.containerData,
            shouldPerformTransaction
        ).then(inventory => {
            return new MachineSpirit(this, data.id, inventory);
        });
    }
    
    craft() {
        return new MachineSpirit(this, null);
    }
    
    canBeMined() {
        return true;
    }
    
    canBeInspected() {
        return true;
    }
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(simpleSpiritTypeSet.matterite, 2.25)];
    }
}

export class WorldSpiritType extends ComplexSpiritType {
    
    constructor() {
        super("world");
    }
    
    convertDbJsonToSpirit(data, shouldPerformTransaction) {
        return convertDbJsonToWorldTileGrid(
            data.containerData,
            shouldPerformTransaction
        ).then(tileGrid => {
            return new WorldSpirit(this, data.id, tileGrid);
        });
    }
    
    craft() {
        return new WorldSpirit(this, null);
    }
}

export class CircuitSpiritType extends ComplexSpiritType {
    
    constructor() {
        super("circuit");
    }
    
    convertDbJsonToSpirit(data, shouldPerformTransaction) {
        return convertDbJsonToCircuitTileGrid(
            data.containerData,
            shouldPerformTransaction
        ).then(tileGrid => {
            return new CircuitSpirit(this, data.id, tileGrid);
        });
    }
    
    craft() {
        return new CircuitSpirit(this, null);
    }
    
    canBeMined() {
        return true;
    }
    
    canBeInspected() {
        return true;
    }
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(simpleSpiritTypeSet.matterite, 0.75)];
    }
}

export function convertDbJsonToSpirit(data, shouldPerformTransaction = true) {
    let tempType;
    if (typeof data === "number") {
        tempType = simpleSpiritTypeMap[data];
    } else {
        let tempTypeList = complexSpiritTypesMap[data.classId];
        for (let spiritType of tempTypeList) {
            if (spiritType.matchesSpiritDbJson(data)) {
                tempType = spiritType;
                break;
            }
        }
    }
    return tempType.convertDbJsonToSpirit(data, shouldPerformTransaction);
}

export function loadComplexSpirit(id, shouldPerformTransaction = true) {
    if (id in dirtyComplexSpiritMap) {
        return Promise.resolve(dirtyComplexSpiritMap[id]);
    }
    let output;
    return niceUtils.performConditionalDbTransaction(shouldPerformTransaction, () => {
        return niceUtils.performDbQuery(
            "SELECT * FROM ComplexSpirits WHERE id = ?",
            [id]
        ).then(results => {
            let tempRow = results[0];
            return convertDbJsonToSpirit({
                id: tempRow.id,
                classId: tempRow.classId,
                attributeData: JSON.parse(tempRow.attributeData),
                containerData: JSON.parse(tempRow.containerData)
            }, false);
        }).then(spirit => {
            spirit.hasDbRow = true;
            output = spirit;
        });
    }).then(() => output);
}

export function convertNestedDbJsonToSpirit(data, shouldPerformTransaction = true) {
    if (typeof data === "number" || "classId" in data) {
        return Promise.resolve(convertDbJsonToSpirit(data, shouldPerformTransaction));
    }
    return loadComplexSpirit(data.id, shouldPerformTransaction);
}

export function convertJsonToSpiritType(data) {
    if (data.type == "simple") {
        return simpleSpiritTypeMap[data.serialInteger];
    }
    if (data.type == "complex") {
        let tempTypeList = complexSpiritTypesMap[data.classId];
        for (let spiritType of tempTypeList) {
            if (spiritType.matchesJson(data)) {
                return spiritType;
            }
        }
    }
    return null;
}


