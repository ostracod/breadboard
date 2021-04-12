
import {simpleSpiritSerialIntegerSet, complexSpiritClassIdSet, simpleSpiritTypeSet, complexSpiritTypeSet, dirtyComplexSpiritMap, simpleSpiritTypeMap, complexSpiritTypesMap} from "./globalData.js";
import {SpiritTypeJson, SimpleSpiritTypeJson, ComplexSpiritTypeJson, MachineSpiritTypeJson, SpiritDbJson, SimpleSpiritDbJson, PlayerSpiritDbJson, MachineSpiritDbJson, WorldSpiritDbJson, CircuitSpiritDbJson, SpiritNestedDbJson, Player} from "./interfaces.js";
import {Spirit, SimpleSpirit, ComplexSpirit, PlayerSpirit, MachineSpirit, WorldSpirit, CircuitSpirit} from "./spirit.js";
import {convertDbJsonToInventory} from "./inventory.js";
import {RecipeComponent} from "./recipe.js";
import {convertDbJsonToWorldTileGrid, convertDbJsonToCircuitTileGrid} from "./tileGrid.js";
import {niceUtils} from "./niceUtils.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let gameUtils = ostracodMultiplayer.gameUtils;

// A SpiritType serves the following purposes:
// > Identify whether a spirit instance matches particular criteria
// > Create new instances of spirits

export abstract class SpiritType<T extends Spirit = Spirit> {
    
    baseName: string;
    
    constructor(baseName: string) {
        this.baseName = baseName;
    }
    
    matchesSpirit(spirit: Spirit): boolean {
        return (spirit.spiritType === this);
    }
    
    canBeMined(): boolean {
        return false;
    }
    
    canBeInspected(): boolean {
        return false;
    }
    
    getBaseRecycleProducts(): RecipeComponent[] {
        return [];
    }
    
    isFreeToCraft(): boolean {
        return false;
    }
    
    abstract matchesSpiritDbJson(data: SpiritDbJson): boolean;
    
    abstract getJson(): SpiritTypeJson;
    
    abstract matchesJson(data: SpiritTypeJson): boolean;
    
    abstract convertDbJsonToSpirit(
        data: SpiritDbJson,
        shouldPerformTransaction: boolean,
    ): Promise<T>;
    
    abstract craft(): T;
}

export class SimpleSpiritType extends SpiritType<SimpleSpirit> {
    
    serialInteger: number;
    spirit: SimpleSpirit;
    
    constructor(baseName: string, offset = 0) {
        super(baseName);
        this.serialInteger = simpleSpiritSerialIntegerSet[this.baseName] + offset;
        this.spirit = new SimpleSpirit(this);
        simpleSpiritTypeSet[this.baseName] = this;
        simpleSpiritTypeMap[this.serialInteger] = this;
    }
    
    matchesSpiritDbJson(data: SpiritDbJson) {
        return (typeof data === "number" && this.serialInteger === data);
    }
    
    getJson(): SimpleSpiritTypeJson {
        return {
            type: "simple",
            serialInteger: this.serialInteger
        };
    }
    
    matchesJson(data: SpiritTypeJson): boolean {
        return (data.type === "simple"
            && this.spirit.serialInteger === (data as SimpleSpiritTypeJson).serialInteger);
    }
    
    convertDbJsonToSpirit(
        data: SimpleSpiritDbJson,
        shouldPerformTransaction: boolean,
    ): Promise<SimpleSpirit> {
        return Promise.resolve(this.spirit);
    }
    
    craft(): SimpleSpirit {
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

export abstract class ComplexSpiritType<T extends ComplexSpirit = ComplexSpirit> extends SpiritType<T> {
    
    spiritClassId: number;
    
    constructor(baseName: string) {
        super(baseName);
        this.spiritClassId = complexSpiritClassIdSet[this.baseName];
        complexSpiritTypeSet[this.baseName] = this;
        if (!(this.spiritClassId in complexSpiritTypesMap)) {
            complexSpiritTypesMap[this.spiritClassId] = [];
        }
        complexSpiritTypesMap[this.spiritClassId].push(this);
    }
    
    matchesSpiritDbJson(data: SpiritDbJson): boolean {
        return (typeof data !== "number" && this.spiritClassId === data.classId);
    }
    
    getJson(): ComplexSpiritTypeJson {
        return {
            type: "complex",
            classId: this.spiritClassId
        };
    }
    
    matchesJson(data: SpiritTypeJson): boolean {
        return (data.type === "complex"
            && this.spiritClassId === (data as ComplexSpiritTypeJson).classId);
    }
}

export class PlayerSpiritType extends ComplexSpiritType<PlayerSpirit> {
    
    constructor() {
        super("player");
    }
    
    convertDbJsonToSpirit(
        data: PlayerSpiritDbJson,
        shouldPerformTransaction: boolean,
    ): Promise<PlayerSpirit> {
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
    
    craft(): PlayerSpirit {
        throw new Error("Cannot craft player.");
    }
    
    createPlayerSpirit(player: Player): PlayerSpirit {
        return new PlayerSpirit(this, player);
    }
}

export class MachineSpiritType extends ComplexSpiritType<MachineSpirit> {
    
    colorIndex: number;
    
    constructor(colorIndex: number) {
        super("machine");
        this.colorIndex = colorIndex;
    }
    
    matchesSpiritDbJson(data: SpiritDbJson): boolean {
        return (super.matchesSpiritDbJson(data)
            && this.colorIndex === data.attributeData.colorIndex);
    }
    
    getJson(): MachineSpiritTypeJson {
        let output = super.getJson() as MachineSpiritTypeJson;
        output.colorIndex = this.colorIndex;
        return output;
    }
    
    matchesJson(data: SpiritTypeJson): boolean {
        return (super.matchesJson(data)
            && this.colorIndex === (data as MachineSpiritTypeJson).colorIndex);
    }
    
    convertDbJsonToSpirit(
        data: MachineSpiritDbJson,
        shouldPerformTransaction: boolean,
    ): Promise<MachineSpirit> {
        return convertDbJsonToInventory(
            data.containerData,
            shouldPerformTransaction
        ).then(inventory => {
            return new MachineSpirit(this, data.id, inventory);
        });
    }
    
    craft(): MachineSpirit {
        return new MachineSpirit(this, null);
    }
    
    canBeMined(): boolean {
        return true;
    }
    
    canBeInspected(): boolean {
        return true;
    }
    
    getBaseRecycleProducts(): RecipeComponent[] {
        return [new RecipeComponent(simpleSpiritTypeSet.matterite, 2.25)];
    }
}

export class WorldSpiritType extends ComplexSpiritType<WorldSpirit> {
    
    constructor() {
        super("world");
    }
    
    convertDbJsonToSpirit(
        data: WorldSpiritDbJson,
        shouldPerformTransaction: boolean,
    ): Promise<WorldSpirit> {
        return convertDbJsonToWorldTileGrid(
            data.containerData,
            shouldPerformTransaction
        ).then(tileGrid => {
            return new WorldSpirit(this, data.id, tileGrid);
        });
    }
    
    craft(): WorldSpirit {
        return new WorldSpirit(this, null);
    }
}

export class CircuitSpiritType extends ComplexSpiritType<CircuitSpirit> {
    
    constructor() {
        super("circuit");
    }
    
    convertDbJsonToSpirit(
        data: CircuitSpiritDbJson,
        shouldPerformTransaction: boolean,
    ): Promise<CircuitSpirit> {
        return convertDbJsonToCircuitTileGrid(
            data.containerData,
            shouldPerformTransaction
        ).then(tileGrid => {
            return new CircuitSpirit(this, data.id, tileGrid);
        });
    }
    
    craft(): CircuitSpirit {
        return new CircuitSpirit(this, null);
    }
    
    canBeMined(): boolean {
        return true;
    }
    
    canBeInspected(): boolean {
        return true;
    }
    
    getBaseRecycleProducts(): RecipeComponent[] {
        return [new RecipeComponent(simpleSpiritTypeSet.matterite, 0.75)];
    }
}

export function convertDbJsonToSpirit(
    data: SpiritDbJson,
    shouldPerformTransaction = true,
): Promise<Spirit> {
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

export function loadComplexSpirit(
    id: number,
    shouldPerformTransaction = true,
): Promise<ComplexSpirit> {
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
        }).then((spirit: ComplexSpirit) => {
            spirit.hasDbRow = true;
            output = spirit;
        });
    }).then(() => output);
}

export function convertNestedDbJsonToSpirit(
    data: SpiritNestedDbJson,
    shouldPerformTransaction = true,
): Promise<Spirit> {
    if (typeof data === "number" || "classId" in data) {
        return Promise.resolve(convertDbJsonToSpirit(data, shouldPerformTransaction));
    }
    return loadComplexSpirit(data.id, shouldPerformTransaction);
}

export function convertJsonToSpiritType(data: SpiritTypeJson): SpiritType {
    if (data.type == "simple") {
        return simpleSpiritTypeMap[(data as SimpleSpiritTypeJson).serialInteger];
    }
    if (data.type == "complex") {
        let tempTypeList = complexSpiritTypesMap[(data as ComplexSpiritTypeJson).classId];
        for (let spiritType of tempTypeList) {
            if (spiritType.matchesJson(data)) {
                return spiritType;
            }
        }
    }
    return null;
}


