
import {simpleSpiritSerialIntegerSet, complexSpiritClassIdSet, simpleSpiritTypeSet, complexSpiritTypeSet, dirtyComplexSpiritMap, simpleSpiritTypeMap, complexSpiritTypesMap} from "./globalData.js";
import {SimpleSpirit, PlayerSpirit, MachineSpirit, CircuitSpirit} from "./spirit.js";
import {convertDbJsonToInventory} from "./inventory.js";
import {RecipeComponent} from "./recipe.js";
import {convertDbJsonToCircuitTileGrid} from "./tileGrid.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let gameUtils = ostracodMultiplayer.gameUtils;
let dbUtils = ostracodMultiplayer.dbUtils;

// A SpiritType serves the following purposes:
// > Identify whether a spirit instance matches particular criteria
// > Create new instances of spirits

class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpiritDbJson, getJson, convertDbJsonToSpirit, craft
    
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
}

export class SimpleSpiritType extends SpiritType {
    
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
    
    convertDbJsonToSpirit(data) {
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
    
    constructor(arrangement) {
        super("wire", arrangement);
        this.arrangement = arrangement;
    }
}

class ComplexSpiritType extends SpiritType {
    
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
    
    getJson() {
        return {
            type: "complex",
            classId: this.spiritClassId
        };
    }
}

export class PlayerSpiritType extends ComplexSpiritType {
    
    constructor() {
        super("player");
    }
    
    convertDbJsonToSpirit(data) {
        let tempPlayer = gameUtils.getPlayerByUsername(data.attributeData.username);
        if (tempPlayer === null) {
            return Promise.resolve(null);
        } else {
            return convertDbJsonToInventory(data.containerData).then(inventory => {
                return new PlayerSpirit(this, tempPlayer, inventory);
            });
        }
    }
    
    craft() {
        throw new Error("Cannot craft player.");
    }
    
    createPlayerSpirit(player) {
        return new PlayerSpirit(this, player);
    }
}

export class MachineSpiritType extends ComplexSpiritType {
    
    constructor(colorIndex) {
        super("machine");
        this.colorIndex = colorIndex;
    }
    
    matchesSpiritDbJson(data) {
        return (super.matchesSpiritDbJson(data)
            && this.colorIndex === data.attributeData.colorIndex);
    }
    
    getJson() {
        let output = super.getJson();
        output.colorIndex = this.colorIndex;
        return output;
    }
    
    convertDbJsonToSpirit(data) {
        return convertDbJsonToInventory(data.containerData).then(inventory => {;
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

export class CircuitSpiritType extends ComplexSpiritType {
    
    constructor() {
        super("circuit");
    }
    
    convertDbJsonToSpirit(data) {
        return convertDbJsonToCircuitTileGrid(data.containerData).then(tileGrid => {
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

export function convertDbJsonToSpirit(data) {
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
    return tempType.convertDbJsonToSpirit(data);
}

export function loadComplexSpirit(id, shouldPerformTransaction = true) {
    if (id in dirtyComplexSpiritMap) {
        return Promise.resolve(dirtyComplexSpiritMap[id]);
    }
    
    let dbError;
    let dbResults;
    
    function performQuery(callback) {
        dbUtils.performQuery(
            "SELECT * FROM ComplexSpirits WHERE id = ?",
            [id],
            (error, results, fields) => {
                dbError = error;
                dbResults = results;
                callback();
            }
        );
    }
    
    return new Promise((resolve, reject) => {
        
        function processResults() {
            if (dbError) {
                reject(dbUtils.convertSqlErrorToText(dbError));
                return;
            }
            if (dbResults.length <= 0) {
                resolve(null);
                return;
            }
            let tempRow = dbResults[0];
            convertDbJsonToSpirit({
                id: tempRow.id,
                classId: tempRow.classId,
                attributeData: JSON.parse(tempRow.attributeData),
                containerData: JSON.parse(tempRow.containerData)
            }).then(spirit => {
                spirit.hasDbRow = true;
                resolve(spirit);
            });
        }
        
        if (shouldPerformTransaction) {
            dbUtils.performTransaction(performQuery, processResults);
        } else {
            performQuery(processResults);
        }
    });
}

export function convertNestedDbJsonToSpirit(data, shouldPerformTransaction = true) {
    if (typeof data === "number" || "classId" in data) {
        return Promise.resolve(convertDbJsonToSpirit(data));
    }
    return loadComplexSpirit(data.id, shouldPerformTransaction);
}


