
import {simpleSpiritSet, complexSpiritClassIdSet, dirtyComplexSpiritSet, spiritColorAmount, SimpleSpirit, ComplexSpirit, PlayerSpirit, MachineSpirit} from "./spirit.js";
import {convertJsonToInventory} from "./inventory.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let gameUtils = ostracodMultiplayer.gameUtils;
let dbUtils = ostracodMultiplayer.dbUtils;

// Map from serial integer to SimpleSpiritType.
export let simpleSpiritTypeMap = {};
// Map from spirit class ID to list of ComplexSpiritType.
export let complexSpiritTypeMap = {};

// A SpiritType serves the following purposes:
// > Identify whether a spirit instance matches particular criteria
// > Create new instances of spirits

class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpirit, matchesSpiritJson, getClientJson, convertJsonToSpirit, craft
    
    constructor() {
    
    }
    
    craft() {
        return null;
    }
}

export class SimpleSpiritType extends SpiritType {
    
    constructor(spirit) {
        super();
        this.spirit = spirit;
        simpleSpiritTypeMap[this.spirit.serialInteger] = this;
    }
    
    matchesSpirit(spirit) {
        return (spirit instanceof SimpleSpirit
            && this.spirit.serialInteger === spirit.serialInteger);
    }
    
    matchesSpiritJson(data) {
        return (typeof data === "number" && this.spirit.serialInteger === data);
    }
    
    getClientJson() {
        return {
            type: "simple",
            serialInteger: this.spirit.serialInteger
        };
    }
    
    convertJsonToSpirit(data) {
        return this.spirit;
    }
    
    craft() {
        return this.spirit;
    }
}

for (let spirit of simpleSpiritSet) {
    new SimpleSpiritType(spirit);
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
    
    matchesSpirit(spirit) {
        return (spirit instanceof ComplexSpirit
            && this.spiritClassId === spirit.classId);
    }
    
    matchesSpiritJson(data) {
        return (typeof data !== "number" && this.spiritClassId === data.classId);
    }
    
    getClientJson() {
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
    
    convertJsonToSpirit(data) {
        let tempPlayer = gameUtils.getPlayerByUsername(data.attributeData.username);
        if (tempPlayer === null) {
            return null;
        } else {
            let tempInventory = convertJsonToInventory(data.containerData);
            return new PlayerSpirit(tempPlayer, tempInventory);
        }
    }
    
    craft() {
        throw new Error("Cannot craft player.");
    }
}

class MachineSpiritType extends ComplexSpiritType {
    
    constructor(colorIndex) {
        super(complexSpiritClassIdSet.machine);
        this.colorIndex = colorIndex;
    }
    
    matchesSpirit(spirit) {
        return (super.matchesSpirit(spirit) && this.colorIndex === spirit.colorIndex);
    }
    
    matchesSpiritJson(data) {
        return (super.matchesSpiritJson(data) && this.colorIndex === data.colorIndex);
    }
    
    getClientJson() {
        let output = super.getClientJson();
        output.colorIndex = this.colorIndex;
        return output;
    }
    
    convertJsonToSpirit(data) {
        let tempInventory = convertJsonToInventory(data.containerData);
        return new MachineSpirit(data.id, data.attributeData.colorIndex, tempInventory);
    }
    
    craft() {
        return new MachineSpirit(null, this.colorIndex);
    }
}

new PlayerSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new MachineSpiritType(colorIndex);
}

export function convertJsonToSpirit(data) {
    let tempType;
    if (typeof data === "number") {
        tempType = simpleSpiritTypeMap[data];
    } else {
        let tempTypeList = complexSpiritTypeMap[data.classId];
        for (let spiritType of tempTypeList) {
            if (spiritType.matchesSpiritJson(data)) {
                tempType = spiritType;
                break;
            }
        }
    }
    return tempType.convertJsonToSpirit(data);
}

export function loadComplexSpirit(id) {
    if (id in dirtyComplexSpiritSet) {
        return Promise.resolve(dirtyComplexSpiritSet[id]);
    }
    return new Promise((resolve, reject) => {
        let dbError;
        let dbResults;
        dbUtils.performTransaction(callback => {
            dbUtils.performQuery(
                "SELECT * FROM ComplexSpirits WHERE id = ?",
                [id],
                (error, results, fields) => {
                    dbError = error;
                    dbResults = results;
                    callback();
                }
            );
        }, () => {
            if (dbError) {
                reject(dbUtils.convertSqlErrorToText(dbError));
                return;
            }
            if (dbResults.length <= 0) {
                resolve(null);
                return;
            }
            let tempRow = dbResults[0];
            let output = convertJsonToSpirit({
                id: tempRow.id,
                classId: tempRow.classId,
                attributeData: JSON.parse(tempRow.attributeData),
                containerData: JSON.parse(tempRow.containerData)
            });
            output.hasDbRow = true;
            resolve(output);
        });
    });
}


