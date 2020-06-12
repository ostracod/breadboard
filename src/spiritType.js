
import {dirtyComplexSpiritSet, SimpleSpirit, ComplexSpirit, PlayerSpirit, MachineSpirit, CircuitSpirit} from "./spirit.js";
import {convertJsonToInventory} from "./inventory.js";
import {RecipeComponent} from "./recipeComponent.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let gameUtils = ostracodMultiplayer.gameUtils;
let dbUtils = ostracodMultiplayer.dbUtils;

export const simpleSpiritSerialIntegerSet = {
    empty: 0,
    barrier: 1,
    matterite: 2,
    energite: 3,
    block: 4,
    loading: 30,
    wire: 31
};

export const complexSpiritClassIdSet = {
    player: 0,
    machine: 1,
    circuit: 2
};

export const spiritColorAmount = 16;
export const wireArrangementAmount = 12;

// Map from serial integer to SimpleSpiritType.
export let simpleSpiritTypeMap = {};
// Map from spirit class ID to list of ComplexSpiritType.
export let complexSpiritTypeMap = {};

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

export let emptySpiritType = new EmptySpiritType();
export let emptySpirit = emptySpiritType.spirit;
new BarrierSpiritType();
let matteriteSpiritType = new MatteriteSpiritType();
new EnergiteSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new BlockSpiritType(colorIndex);
}
for (let arrangement = 0; arrangement < wireArrangementAmount; arrangement++) {
    new WireSpiritType(arrangement);
}

class ComplexSpiritType extends SpiritType {
    
    constructor(spiritClassId) {
        super();
        this.spiritClassId = spiritClassId;
        if (!(this.spiritClassId in complexSpiritTypeMap)) {
            complexSpiritTypeMap[this.spiritClassId] = [];
        }
        complexSpiritTypeMap[this.spiritClassId].push(this);
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

class PlayerSpiritType extends ComplexSpiritType {
    
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

class MachineSpiritType extends ComplexSpiritType {
    
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

class CircuitSpiritType extends ComplexSpiritType {
    
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
    
    getBaseRecycleProducts() {
        return [new RecipeComponent(matteriteSpiritType, 0.75)];
    }
}

export let playerSpiritType = new PlayerSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new MachineSpiritType(colorIndex);
}
export let circuitSpiritType = new CircuitSpiritType();

export function convertDbJsonToSpirit(data) {
    let tempType;
    if (typeof data === "number") {
        tempType = simpleSpiritTypeMap[data];
    } else {
        let tempTypeList = complexSpiritTypeMap[data.classId];
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
    if (id in dirtyComplexSpiritSet) {
        return Promise.resolve(dirtyComplexSpiritSet[id]);
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


