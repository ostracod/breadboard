
import { simpleSpiritSerialIntegerSet, complexSpiritClassIdSet, simpleSpiritTypeSet, complexSpiritTypeSet, dirtyComplexSpiritMap, simpleSpiritTypeMap, complexSpiritTypesMap } from "./globalData.js";
import { SpiritTypeJson, SimpleSpiritTypeJson, ComplexSpiritTypeJson, MachineSpiritTypeJson, SpiritDbJson, SimpleSpiritDbJson, ComplexSpiritDbJson, SpiritNestedDbJson, Player } from "./interfaces.js";
import { Spirit, SimpleSpirit, ComplexSpirit, MachineSpirit } from "./spirit.js";
import { PlayerSpirit } from "./playerSpirit.js";
import { CircuitSpirit, ConstantLogicSpirit } from "./logicSpirit.js";
import { WorldSpirit } from "./worldSpirit.js";
import { convertDbJsonToInventory } from "./inventory.js";
import { RecipeComponent } from "./recipe.js";
import { convertDbJsonToWorldTileGrid, convertDbJsonToCircuitTileGrid } from "./tileGrid.js";
import { niceUtils } from "./niceUtils.js";

import ostracodMultiplayer from "ostracod-multiplayer";
const { gameUtils } = ostracodMultiplayer;

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
        data: ReturnType<T["getDbJson"]>,
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
    
    matchesSpiritDbJson(data: SpiritDbJson): boolean {
        return (typeof data === "number" && this.serialInteger === data);
    }
    
    getJson(): SimpleSpiritTypeJson {
        return {
            type: "simple",
            serialInteger: this.serialInteger,
        };
    }
    
    matchesJson(data: SpiritTypeJson): boolean {
        return (data.type === "simple"
            && this.spirit.serialInteger === (data as SimpleSpiritTypeJson).serialInteger);
    }
    
    async convertDbJsonToSpirit(
        data: SimpleSpiritDbJson,
        shouldPerformTransaction: boolean,
    ): Promise<SimpleSpirit> {
        return this.spirit;
    }
    
    craft(): SimpleSpirit {
        return this.spirit;
    }
}

export class EmptySpiritType extends SimpleSpiritType {
    
    constructor() {
        super("empty");
    }
    
    isFreeToCraft(): boolean {
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
    
    constructor(colorIndex: number) {
        super("block", colorIndex);
    }
    
    canBeMined(): boolean {
        return true;
    }
    
    getBaseRecycleProducts(): RecipeComponent[] {
        return [new RecipeComponent(simpleSpiritTypeSet.matterite, 1.5)];
    }
}

export class WireSpiritType extends SimpleSpiritType {
    
    arrangement: number;
    
    constructor(arrangement: number) {
        super("wire", arrangement);
        this.arrangement = arrangement;
    }
    
    isFreeToCraft(): boolean {
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
            classId: this.spiritClassId,
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
    
    async convertDbJsonToSpirit(
        data: ComplexSpiritDbJson<PlayerSpirit>,
        shouldPerformTransaction: boolean,
    ): Promise<PlayerSpirit> {
        const tempPlayer = gameUtils.getPlayerByUsername(data.attributeData.username);
        if (tempPlayer === null) {
            return null;
        } else {
            const inventory = await convertDbJsonToInventory(
                data.containerData,
                shouldPerformTransaction
            );
            return new PlayerSpirit(this, tempPlayer, inventory);
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
            && this.colorIndex === (data as ComplexSpiritDbJson).attributeData.colorIndex);
    }
    
    getJson(): MachineSpiritTypeJson {
        const output = super.getJson() as MachineSpiritTypeJson;
        output.colorIndex = this.colorIndex;
        return output;
    }
    
    matchesJson(data: SpiritTypeJson): boolean {
        return (super.matchesJson(data)
            && this.colorIndex === (data as MachineSpiritTypeJson).colorIndex);
    }
    
    async convertDbJsonToSpirit(
        data: ComplexSpiritDbJson<MachineSpirit>,
        shouldPerformTransaction: boolean,
    ): Promise<MachineSpirit> {
        const inventory = await convertDbJsonToInventory(
            data.containerData,
            shouldPerformTransaction
        );
        return new MachineSpirit(this, data.id, inventory);
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
    
    async convertDbJsonToSpirit(
        data: ComplexSpiritDbJson<WorldSpirit>,
        shouldPerformTransaction: boolean,
    ): Promise<WorldSpirit> {
        const tileGrid = await convertDbJsonToWorldTileGrid(
            data.containerData,
            shouldPerformTransaction
        );
        return new WorldSpirit(this, data.id, tileGrid);
    }
    
    craft(): WorldSpirit {
        return new WorldSpirit(this, null);
    }
}

export class CircuitSpiritType extends ComplexSpiritType<CircuitSpirit> {
    
    constructor() {
        super("circuit");
    }
    
    async convertDbJsonToSpirit(
        data: ComplexSpiritDbJson<CircuitSpirit>,
        shouldPerformTransaction: boolean,
    ): Promise<CircuitSpirit> {
        const tileGrid = await convertDbJsonToCircuitTileGrid(
            data.containerData,
            shouldPerformTransaction
        );
        return new CircuitSpirit(this, data.id, tileGrid);
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

export class ConstantLogicSpiritType extends ComplexSpiritType<ConstantLogicSpirit> {
    
    constructor() {
        super("constantLogic");
    }
    
    async convertDbJsonToSpirit(
        data: ComplexSpiritDbJson<ConstantLogicSpirit>,
        shouldPerformTransaction: boolean,
    ): Promise<ConstantLogicSpirit> {
        return new ConstantLogicSpirit(this, data.id, data.attributeData.constantValue);
    }
    
    craft(): ConstantLogicSpirit {
        return new ConstantLogicSpirit(this, null);
    }
    
    isFreeToCraft(): boolean {
        return true;
    }
}

export const convertDbJsonToSpirit = async (
    data: SpiritDbJson,
    shouldPerformTransaction = true,
): Promise<Spirit> => {
    let tempType;
    if (typeof data === "number") {
        tempType = simpleSpiritTypeMap[data];
    } else {
        const tempTypeList = complexSpiritTypesMap[data.classId];
        for (const spiritType of tempTypeList) {
            if (spiritType.matchesSpiritDbJson(data)) {
                tempType = spiritType;
                break;
            }
        }
    }
    return await tempType.convertDbJsonToSpirit(data, shouldPerformTransaction);
};

export const loadComplexSpirit = async (
    id: number,
    shouldPerformTransaction = true,
): Promise<ComplexSpirit> => {
    if (id in dirtyComplexSpiritMap) {
        return dirtyComplexSpiritMap[id];
    }
    let output;
    await niceUtils.performConditionalDbTransaction(shouldPerformTransaction, async () => {
        const results = await niceUtils.performDbQuery(
            "SELECT * FROM ComplexSpirits WHERE id = ?",
            [id]
        );
        const [tempRow] = results;
        output = await convertDbJsonToSpirit({
            id: tempRow.id,
            parentId: tempRow.parentId,
            classId: tempRow.classId,
            attributeData: JSON.parse(tempRow.attributeData),
            containerData: JSON.parse(tempRow.containerData),
        }, false) as ComplexSpirit;
        output.hasDbRow = true;
    });
    return output;
};

export const convertNestedDbJsonToSpirit = async (
    nestedData: SpiritNestedDbJson,
    shouldPerformTransaction = true,
): Promise<Spirit> => {
    let tempData: SpiritDbJson;
    if (typeof nestedData === "number") {
        tempData = nestedData;
    } else if ("classId" in nestedData) {
        tempData = {
            id: nestedData.id,
            parentId: null,
            classId: nestedData.classId,
            attributeData: nestedData.attributeData,
            containerData: nestedData.containerData,
        };
    } else {
        return await loadComplexSpirit(nestedData.id, shouldPerformTransaction);
    }
    return convertDbJsonToSpirit(tempData, shouldPerformTransaction);
};

export const convertJsonToSpiritType = (data: SpiritTypeJson): SpiritType => {
    if (data.type === "simple") {
        return simpleSpiritTypeMap[(data as SimpleSpiritTypeJson).serialInteger];
    }
    if (data.type === "complex") {
        const tempTypeList = complexSpiritTypesMap[(data as ComplexSpiritTypeJson).classId];
        for (const spiritType of tempTypeList) {
            if (spiritType.matchesJson(data)) {
                return spiritType;
            }
        }
    }
    return null;
};


