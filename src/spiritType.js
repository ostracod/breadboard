
import {simpleSpiritSerialIntegerSet, complexSpiritClassIdSet, dirtyComplexSpiritMap, simpleSpiritTypeMap, complexSpiritTypesMap, matteriteSpiritType} from "./globalData.js";
import {SimpleSpirit, PlayerSpirit, MachineSpirit, CircuitSpirit} from "./spirit.js";
import {convertJsonToInventory} from "./inventory.js";
import {RecipeComponent} from "./recipe.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let gameUtils = ostracodMultiplayer.gameUtils;
let dbUtils = ostracodMultiplayer.dbUtils;

// A SpiritType serves the following purposes:
// > Identify whether a spirit instance matches particular criteria
// > Create new instances of spirits

class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpiritDbJson, getJson, convertDbJsonToSpirit, craft
    
    constructor() {
    
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
    
    constructor(serialInteger) {
        super();
        this.serialInteger = serialInteger;
        this.spirit = new SimpleSpirit(this);
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
        return this.spirit;
    }
    
    craft() {
        return this.spirit;
    }
}

export class EmptySpiritType extends SimpleSpiritType {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.empty);
    }
}

export class BarrierSpiritType extends SimpleSpiritType {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.barrier);
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
        super(simpleSpiritSerialIntegerSet.matterite);
    }
}

export class EnergiteSpiritType extends ResourceSpiritType {
    
    constructor() {
        super(simpleSpiritSerialIntegerSet.energite);
    }
}

export class BlockSpiritType extends SimpleSpiritType {
    
    constructor(colorIndex) {
        super(simpleSpiritSerialIntegerSet.block + colorIndex);
    }
    
    canBeMined() {
        return true;
    }
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(matteriteSpiritType, 1.5)];
    }
}

export class WireSpiritType extends SimpleSpiritType {
    
    constructor(arrangement) {
        super(simpleSpiritSerialIntegerSet.wire + arrangement);
        this.arrangement = arrangement;
    }
}

class ComplexSpiritType extends SpiritType {
    
    constructor(spiritClassId) {
        super();
        this.spiritClassId = spiritClassId;
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
        super(complexSpiritClassIdSet.player);
    }
    
    convertDbJsonToSpirit(data) {
        let tempPlayer = gameUtils.getPlayerByUsername(data.attributeData.username);
        if (tempPlayer === null) {
            return null;
        } else {
            let tempInventory = convertJsonToInventory(data.containerData);
            return new PlayerSpirit(this, tempPlayer, tempInventory);
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
        super(complexSpiritClassIdSet.machine);
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
        let tempInventory = convertJsonToInventory(data.containerData);
        return new MachineSpirit(this, data.id, tempInventory);
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
        return [new RecipeComponent(matteriteSpiritType, 2.25)];
    }
}

export class CircuitSpiritType extends ComplexSpiritType {
    
    constructor() {
        super(complexSpiritClassIdSet.circuit);
    }
    
    convertDbJsonToSpirit(data) {
        return new CircuitSpirit(this, data.id);
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
        return [new RecipeComponent(matteriteSpiritType, 0.75)];
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
            let output = convertDbJsonToSpirit({
                id: tempRow.id,
                classId: tempRow.classId,
                attributeData: JSON.parse(tempRow.attributeData),
                containerData: JSON.parse(tempRow.containerData)
            });
            output.hasDbRow = true;
            resolve(output);
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


