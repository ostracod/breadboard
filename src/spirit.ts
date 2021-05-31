
import { simpleSpiritSet, simpleSpiritMap, complexSpiritMap, dirtyComplexSpiritMap } from "./globalData.js";
import { ConfigDbJson, SpiritClientJson, SimpleSpiritClientJson, ComplexSpiritClientJson, MachineSpiritClientJson, SpiritNestedDbJson, SimpleSpiritNestedDbJson, ComplexSpiritBaseDbJson, ComplexSpiritNestedDbJson, SpiritDbJson, SimpleSpiritDbJson, ComplexSpiritDbJson, ComplexSpiritContainerJson, InventorySpiritContainerJson, TileGridSpiritContainerJson, ComplexSpiritAttributeJson, MachineSpiritAttributeJson, TileDbJson } from "./interfaces.js";
import { Pos } from "./pos.js";
import { SpiritType, SimpleSpiritType, ComplexSpiritType, MachineSpiritType } from "./spiritType.js";
import { SpiritReference } from "./spiritReference.js";
import { SimpleSpiritReference, ComplexSpiritReference } from "./spiritReference.js";
import { Inventory, InventoryItem, InventoryObserver } from "./inventory.js";
import { RecipeComponent, pushRecipeComponent } from "./recipe.js";
import { Tile } from "./tile.js";
import { WorldTile, SimpleWorldTile, ComplexWorldTile, MachineWorldTile } from "./worldTile.js";
import { CircuitTile, SimpleCircuitTile, ComplexCircuitTile } from "./circuitTile.js";
import { TileGrid } from "./tileGrid.js";
import { niceUtils } from "./niceUtils.js";

let nextComplexSpiritId: number;

// The idea is that a Spirit is something which may
// exist as a Tile or Item.
// A SimpleSpirit holds no state, and may be
// serialized as a single integer.
// A ComplexSpirit holds custom state, and must
// be serialized as a JSON dictionary.

export abstract class Spirit {
    
    spiritType: SpiritType;
    
    constructor(spiritType: SpiritType) {
        this.spiritType = spiritType;
    }
    
    canBeMined(): boolean {
        return this.spiritType.canBeMined();
    }
    
    canBeInspected(): boolean {
        return this.spiritType.canBeInspected();
    }
    
    isDbRoot(): boolean {
        return false;
    }
    
    populateParentSpirit(spirit: ComplexSpirit): void {
        // Do nothing.
    }
    
    changeParentSpirit(spirit: ComplexSpirit): void {
        // Do nothing.
    }
    
    setParentTile(tile: Tile<Spirit>): void {
        // Do nothing.
    }
    
    convertDbJsonToWorldTile(data: TileDbJson): WorldTile {
        return null;
    }
    
    convertDbJsonToCircuitTile(data: TileDbJson): CircuitTile {
        return null;
    }
    
    getWorldTile(): WorldTile {
        return null;
    }
    
    getCircuitTile(): CircuitTile {
        return null;
    }
    
    destroy(): void {
        // Do nothing.
    }
    
    getRecycleProducts(): RecipeComponent[] {
        return this.spiritType.getBaseRecycleProducts();
    }
    
    abstract getClientJson(): SpiritClientJson;
    
    abstract getNestedDbJson(): SpiritNestedDbJson;
    
    abstract getDbJson(): SpiritDbJson;
    
    abstract getReference(): SpiritReference;
}

export class SimpleSpirit extends Spirit {
    
    spiritType: SimpleSpiritType;
    serialInteger: number;
    reference: SimpleSpiritReference;
    worldTile: SimpleWorldTile;
    circuitTile: SimpleCircuitTile;
    
    constructor(spiritType: SimpleSpiritType) {
        super(spiritType);
        this.serialInteger = this.spiritType.serialInteger;
        this.reference = new SimpleSpiritReference(this.serialInteger);
        simpleSpiritSet[this.spiritType.baseName] = this;
        simpleSpiritMap[this.serialInteger] = this;
        this.worldTile = new SimpleWorldTile(this);
        this.circuitTile = new SimpleCircuitTile(this);
    }
    
    convertDbJsonToWorldTile(data: TileDbJson): WorldTile {
        return this.worldTile;
    }
    
    convertDbJsonToCircuitTile(data: TileDbJson): CircuitTile {
        return this.circuitTile;
    }
    
    getWorldTile(): WorldTile {
        return this.worldTile;
    }
    
    getCircuitTile(): CircuitTile {
        return this.circuitTile;
    }
    
    getClientJson(): SimpleSpiritClientJson {
        return this.serialInteger;
    }
    
    getNestedDbJson(): SimpleSpiritNestedDbJson {
        return this.serialInteger;
    }
    
    getDbJson(): SimpleSpiritDbJson {
        return this.serialInteger;
    }
    
    getReference(): SimpleSpiritReference {
        return this.reference;
    }
}

export class ComplexSpirit extends Spirit {
    
    spiritType: ComplexSpiritType;
    id: number;
    classId: number;
    parentSpirit: ComplexSpirit;
    parentTile: Tile<ComplexSpirit>;
    reference: ComplexSpiritReference;
    hasDbRow: boolean;
    isDestroyed: boolean;
    
    constructor(spiritType: ComplexSpiritType, id: number) {
        super(spiritType);
        this.classId = this.spiritType.spiritClassId;
        this.parentSpirit = null;
        this.parentTile = null;
        if (id === null) {
            this.id = nextComplexSpiritId;
            nextComplexSpiritId += 1;
            this.markAsDirty();
        } else {
            this.id = id;
        }
        complexSpiritMap[this.id] = this;
        this.reference = new ComplexSpiritReference(this.id);
        this.hasDbRow = false;
        this.isDestroyed = false;
    }
    
    markAsDirty(): void {
        dirtyComplexSpiritMap[this.id] = this;
        if (!this.hasDbRow && this.parentSpirit !== null) {
            this.parentSpirit.markAsDirty();
        }
    }
    
    convertDbJsonToWorldTile(data: TileDbJson): ComplexWorldTile {
        return new ComplexWorldTile(this);
    }
    
    convertDbJsonToCircuitTile(data: TileDbJson): ComplexCircuitTile {
        return new ComplexCircuitTile(this);
    }
    
    getWorldTile(): ComplexWorldTile {
        return new ComplexWorldTile(this);
    }
    
    getCircuitTile(): ComplexCircuitTile {
        return new ComplexCircuitTile(this);
    }
    
    getClientJson(): ComplexSpiritClientJson {
        return {
            classId: this.classId,
            id: this.id,
        };
    }
    
    getAttributeDbJson(): ComplexSpiritAttributeJson {
        return null;
    }
    
    getContainerDbJson(): ComplexSpiritContainerJson {
        return null;
    }
    
    getDbJsonHelper(): ComplexSpiritBaseDbJson<this> {
        const output = {
            id: this.id,
            classId: this.classId,
            attributeData: this.getAttributeDbJson(),
        } as ComplexSpiritBaseDbJson<this>;
        const containerData = this.getContainerDbJson();
        if (containerData !== null) {
            output.containerData = containerData;
        }
        return output;
    }
    
    getNestedDbJson(): ComplexSpiritNestedDbJson<this> {
        if (this.shouldHaveDbRow()) {
            return {
                id: this.id,
            };
        } else {
            return this.getDbJsonHelper() as ComplexSpiritNestedDbJson<this>;
        }
    }
    
    getDbJson(): ComplexSpiritDbJson<this> {
        const output = this.getDbJsonHelper() as ComplexSpiritDbJson<this>;
        output.parentId = (this.parentSpirit === null) ? null : this.parentSpirit.id;
        return output;
    }
    
    getReference(): ComplexSpiritReference {
        return this.reference;
    }
    
    populateParentSpirit(spirit: ComplexSpirit): void {
        this.parentSpirit = spirit;
    }
    
    changeParentSpirit(spirit: ComplexSpirit): void {
        if (spirit === this.parentSpirit) {
            return;
        }
        this.parentSpirit = spirit;
        this.markAsDirty();
    }
    
    // Parent may be any number of steps removed.
    hasParentSpirit(spirit: Spirit): boolean {
        if (!(spirit instanceof ComplexSpirit)) {
            return false;
        }
        let tempSpirit = this.parentSpirit;
        while (tempSpirit !== null) {
            if (spirit === tempSpirit) {
                return true;
            }
            tempSpirit = (tempSpirit as ComplexSpirit).parentSpirit;
        }
        return false;
    }
    
    // Parent may be any number of steps removed.
    getParentWorldTile(): ComplexWorldTile {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let spirit: ComplexSpirit = this;
        while (spirit !== null) {
            const tile = spirit.parentTile;
            if (tile instanceof ComplexWorldTile) {
                return tile;
            }
            spirit = spirit.parentSpirit;
        }
        return null;
    }
    
    setParentTile(tile: Tile<ComplexSpirit>): void {
        this.parentTile = tile;
    }
    
    // Spirit must be removed from parent before invoking destroy method.
    destroy(): void {
        delete complexSpiritMap[this.id];
        this.isDestroyed = true;
        this.markAsDirty();
    }
    
    shouldHaveDbRow(): boolean {
        if (this.isDestroyed) {
            return false;
        }
        // TODO: Optimize nesting logic.
        return (this.isDbRoot() || (this.parentSpirit !== null
            && this.parentSpirit.isDbRoot()));
    }
    
    async persist(): Promise<void> {
        const tempShouldHaveDbRow = this.shouldHaveDbRow();
        const attributeData = JSON.stringify(this.getAttributeDbJson());
        const containerData = JSON.stringify(this.getContainerDbJson());
        if (this.hasDbRow) {
            if (tempShouldHaveDbRow) {
                await niceUtils.performDbQuery(
                    "UPDATE ComplexSpirits SET attributeData = ?, containerData = ? WHERE id = ?",
                    [attributeData, containerData, this.id]
                );
            } else {
                await niceUtils.performDbQuery(
                    "DELETE FROM ComplexSpirits WHERE id = ?",
                    [this.id]
                );
            }
        } else {
            if (tempShouldHaveDbRow) {
                this.hasDbRow = true;
                await niceUtils.performDbQuery(
                    "INSERT INTO ComplexSpirits (id, parentId, classId, attributeData, containerData) VALUES (?, NULL, ?, ?, ?)",
                    [this.id, this.classId, attributeData, containerData]
                );
            }
        }
    }
}

export class InventorySpirit extends ComplexSpirit implements InventoryObserver {
    
    spiritType: ComplexSpiritType<InventorySpirit>;
    inventory: Inventory;
    
    constructor(
        spiritType: ComplexSpiritType<InventorySpirit>,
        id: number,
        inventory: Inventory,
    ) {
        super(spiritType, id);
        if (inventory === null) {
            this.inventory = new Inventory();
        } else {
            this.inventory = inventory;
        }
        this.inventory.populateParentSpirit(this);
        this.inventory.addObserver(this);
    }
    
    inventoryChangeEvent(inventory: Inventory, item: InventoryItem): void {
        this.markAsDirty();
    }
    
    getContainerDbJson(): InventorySpiritContainerJson {
        return this.inventory.getDbJson();
    }
    
    destroy(): void {
        for (const item of this.inventory.items) {
            item.spirit.destroy();
        }
        super.destroy();
    }
    
    getRecycleProducts(): RecipeComponent[] {
        const output = super.getRecycleProducts();
        for (const item of this.inventory.items) {
            const tempProductList = item.spirit.getRecycleProducts();
            for (const recipeComponent of tempProductList) {
                recipeComponent.scale(item.count);
                pushRecipeComponent(output, recipeComponent);
            }
        }
        return output;
    }
}

export class MachineSpirit extends InventorySpirit {
    
    spiritType: MachineSpiritType;
    colorIndex: number;
    
    constructor(spiritType: MachineSpiritType, id: number, inventory: Inventory = null) {
        super(spiritType, id, inventory);
        this.colorIndex = this.spiritType.colorIndex;
    }
    
    convertDbJsonToWorldTile(data: TileDbJson): MachineWorldTile {
        return new MachineWorldTile(this);
    }
    
    getWorldTile(): MachineWorldTile {
        return new MachineWorldTile(this);
    }
    
    getClientJson(): MachineSpiritClientJson {
        const output = super.getClientJson() as MachineSpiritClientJson;
        output.colorIndex = this.colorIndex;
        return output;
    }
    
    getAttributeDbJson(): MachineSpiritAttributeJson {
        return {
            colorIndex: this.colorIndex,
        };
    }
}

export abstract class TileGridSpirit<T extends Tile> extends ComplexSpirit {
    
    spiritType: ComplexSpiritType<TileGridSpirit<T>>;
    tileGrid: TileGrid<T>;
    
    constructor(
        spiritType: ComplexSpiritType<TileGridSpirit<T>>,
        id: number,
        tileGrid: TileGrid<T> = null,
    ) {
        super(spiritType, id);
        if (tileGrid === null) {
            this.generateTileGrid();
        } else {
            this.tileGrid = tileGrid;
        }
        this.tileGrid.populateParentSpirit(this);
    }
    
    getContainerDbJson(): TileGridSpiritContainerJson {
        return this.tileGrid.getDbJson();
    }
    
    destroy(): void {
        for (const tile of this.tileGrid.tileList) {
            tile.spirit.destroy();
        }
        super.destroy();
    }
    
    getRecycleProducts(): RecipeComponent[] {
        const output = super.getRecycleProducts();
        for (const tile of this.tileGrid.tileList) {
            const tempProductList = tile.spirit.getRecycleProducts();
            for (const recipeComponent of tempProductList) {
                pushRecipeComponent(output, recipeComponent);
            }
        }
        return output;
    }
    
    getTile(pos: Pos): T {
        return this.tileGrid.getTile(pos);
    }
    
    setTile(pos: Pos, tile: T): void {
        this.tileGrid.setTile(pos, tile);
    }
    
    swapTiles(pos1: Pos, pos2: Pos): void {
        this.tileGrid.swapTiles(pos1, pos2);
    }
    
    abstract generateTileGrid(): void;
}

export const loadNextComplexSpiritId = async (): Promise<void> => {
    const results = await niceUtils.performDbQuery(
        "SELECT * FROM Configuration WHERE name = ?",
        ["nextComplexSpiritId"]
    ) as ConfigDbJson[];
    if (results.length > 0) {
        nextComplexSpiritId = parseInt(results[0].value, 10);
    } else {
        nextComplexSpiritId = 0;
        await niceUtils.performDbQuery(
            "INSERT INTO Configuration (name, value) VALUES (?, ?)",
            ["nextComplexSpiritId", nextComplexSpiritId]
        );
    }
};

export const persistNextComplexSpiritId = async (): Promise<void> => {
    await niceUtils.performDbQuery(
        "UPDATE Configuration SET value = ? WHERE name = ?",
        [nextComplexSpiritId, "nextComplexSpiritId"]
    );
};

export const persistAllComplexSpirits = async (): Promise<void> => {
    for (const id in dirtyComplexSpiritMap) {
        const tempSpirit = dirtyComplexSpiritMap[id];
        await tempSpirit.persist();
        delete dirtyComplexSpiritMap[id];
    }
};


