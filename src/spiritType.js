
import {simpleSpiritSet, complexSpiritClassIdSet, dirtyComplexSpiritSet, SimpleSpirit, ComplexSpirit, PlayerSpirit} from "./spirit.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let gameUtils = ostracodMultiplayer.gameUtils;
let dbUtils = ostracodMultiplayer.dbUtils;

// Map from serial integer to SimpleSpiritType.
export let simpleSpiritTypeMap = {};
// Map from spirit class ID to ComplexSpiritType.
let complexSpiritTypeMap = {};

// A SpiritType serves the following purposes:
// > Identify whether a spirit instance matches particular criteria
// > Create new instances of spirits

class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpirit, getClientJson, convertJsonToSpirit, craft
    
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
        complexSpiritTypeMap[this.spiritClassId] = this;
    }
    
    matchesSpirit(spirit) {
        return (spirit instanceof ComplexSpirit
            && this.spiritClassId === spirit.classId);
    }
    
    getClientJson() {
        return {
            type: "complex",
            classId: this.spirit.classId
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
            return new PlayerSpirit(tempPlayer);
        }
    }
    
    craft() {
        throw new Error("Cannot craft player.");
    }
}

new PlayerSpiritType();

export function convertJsonToSpirit(data) {
    let tempType;
    if (typeof data === "number") {
        tempType = simpleSpiritTypeMap[data];
    } else {
        tempType = complexSpiritTypeMap[data.classId];
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


