
import { simpleSpiritSerialIntegerSet, wireArrangementAmount, worldSize, circuitSize, simpleSpiritSet, simpleSpiritTypeSet, complexSpiritTypeSet, simpleWorldTileSet, simpleSpiritMap, complexSpiritMap, dirtyComplexSpiritMap, simpleCircuitTileMap, circuitTileFactory } from "./globalData.js";
import { Player, ConfigDbJson, SpiritClientJson, SimpleSpiritClientJson, ComplexSpiritClientJson, PlayerSpiritClientJson, MachineSpiritClientJson, SpiritNestedDbJson, SimpleSpiritNestedDbJson, ComplexSpiritNestedDbJson, SpiritDbJson, SimpleSpiritDbJson, ComplexSpiritDbJson, ComplexSpiritContainerJson, InventorySpiritContainerJson, TileGridSpiritContainerJson, ComplexSpiritAttributeJson, PlayerSpiritAttributeJson, MachineSpiritAttributeJson, TileClientJson } from "./interfaces.js";
import { Pos } from "./pos.js";
import { SpiritType, SimpleSpiritType, ComplexSpiritType, PlayerSpiritType, MachineSpiritType, WorldSpiritType, loadComplexSpirit } from "./spiritType.js";
import { SpiritReference } from "./spiritReference.js";
import { SimpleSpiritReference, ComplexSpiritReference } from "./spiritReference.js";
import { Inventory, InventoryItem, InventoryObserver, InventoryUpdate, pushInventoryUpdate } from "./inventory.js";
import { RecipeComponent, pushRecipeComponent } from "./recipe.js";
import { Tile } from "./tile.js";
import { WorldTile, ComplexWorldTile, PlayerWorldTile } from "./worldTile.js";
import { CircuitTile } from "./circuitTile.js";
import { TileGrid, createWorldTileGrid, createCircuitTileGrid } from "./tileGrid.js";
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
    
    populateParentSpirit(spirit: ComplexSpirit): void {
        // Do nothing.
    }
    
    changeParentSpirit(spirit: ComplexSpirit): void {
        // Do nothing.
    }
    
    setParentTile(tile: Tile<Spirit>): void {
        // Do nothing.
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
    
    constructor(spiritType: SimpleSpiritType) {
        super(spiritType);
        this.serialInteger = this.spiritType.serialInteger;
        this.reference = new SimpleSpiritReference(this.serialInteger);
        simpleSpiritSet[this.spiritType.baseName] = this;
        simpleSpiritMap[this.serialInteger] = this;
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
    
    getNestedDbJson(): ComplexSpiritNestedDbJson<this> {
        if (this.shouldHaveDbRow()) {
            return {
                id: this.id,
            };
        } else {
            return {
                id: this.id,
                classId: this.classId,
                attributeData: this.getAttributeDbJson(),
                containerData: this.getContainerDbJson(),
            };
        }
    }
    
    getDbJson(): ComplexSpiritDbJson<this> {
        return {
            id: this.id,
            parentId: (this.parentSpirit === null) ? null : this.parentSpirit.id,
            classId: this.classId,
            attributeData: this.getAttributeDbJson(),
            containerData: this.getContainerDbJson(),
        };
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
        return (this.parentSpirit === null || this.parentSpirit instanceof WorldSpirit);
    }
    
    persist(): Promise<void> {
        const tempShouldHaveDbRow = this.shouldHaveDbRow();
        const attributeData = JSON.stringify(this.getAttributeDbJson());
        const containerData = JSON.stringify(this.getContainerDbJson());
        if (this.hasDbRow) {
            if (tempShouldHaveDbRow) {
                return niceUtils.performDbQuery(
                    "UPDATE ComplexSpirits SET attributeData = ?, containerData = ? WHERE id = ?",
                    [attributeData, containerData, this.id]
                );
            } else {
                return niceUtils.performDbQuery(
                    "DELETE FROM ComplexSpirits WHERE id = ?",
                    [this.id]
                );
            }
        } else {
            if (tempShouldHaveDbRow) {
                this.hasDbRow = true;
                return niceUtils.performDbQuery(
                    "INSERT INTO ComplexSpirits (id, parentId, classId, attributeData, containerData) VALUES (?, NULL, ?, ?, ?)",
                    [this.id, this.classId, attributeData, containerData]
                );
            } else {
                return Promise.resolve();
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

export class PlayerSpirit extends InventorySpirit {
    
    spiritType: PlayerSpiritType;
    player: Player;
    inspectedMachine: MachineSpirit;
    inspectedCircuit: CircuitSpirit;
    inventoryUpdates: InventoryUpdate[];
    stopInspectionSpiritIds: number[];
    
    constructor(spiritType: PlayerSpiritType, player: Player, inventory: Inventory = null) {
        const lastId = player.extraFields.complexSpiritId;
        super(spiritType, lastId, inventory);
        if (lastId === null) {
            player.extraFields.complexSpiritId = this.id;
        }
        this.player = player;
        this.inspectedMachine = null;
        this.inspectedCircuit = null;
        this.inventoryUpdates = [];
        this.stopInspectionSpiritIds = [];
    }
    
    inventoryChangeEvent(inventory: Inventory, item: InventoryItem): void {
        super.inventoryChangeEvent(inventory, item);
        const tempUpdate = item.getInventoryUpdate();
        pushInventoryUpdate(this.inventoryUpdates, tempUpdate);
    }
    
    getClientJson(): PlayerSpiritClientJson {
        const output = super.getClientJson() as PlayerSpiritClientJson;
        output.username = this.player.username;
        return output;
    }
    
    getAttributeDbJson(): PlayerSpiritAttributeJson {
        return {
            username: this.player.username,
        };
    }
    
    getNestedDbJson(): ComplexSpiritNestedDbJson<PlayerSpirit> {
        // Player spirit should never be persisted in a container.
        return null;
    }
    
    canInspect(spirit: Spirit): boolean {
        if (!(spirit instanceof ComplexSpirit && spirit.canBeInspected())) {
            return false;
        }
        const complexSpirit = spirit as ComplexSpirit;
        if (complexSpirit.hasParentSpirit(this)) {
            return true;
        }
        const worldTile1 = this.getParentWorldTile();
        const worldTile2 = complexSpirit.getParentWorldTile();
        if (worldTile1 === null || worldTile2 === null) {
            return false;
        }
        const pos1 = worldTile1.pos;
        const pos2 = worldTile2.pos;
        return pos1.isAdjacentTo(pos2);
    }
    
    registerStartInspectingSpirit(spirit: ComplexSpirit): void {
        const index = this.stopInspectionSpiritIds.indexOf(spirit.id);
        if (index >= 0) {
            this.stopInspectionSpiritIds.splice(index);
        }
    }
    
    registerStopInspectingSpirit(spirit: ComplexSpirit): void {
        const index = this.stopInspectionSpiritIds.indexOf(spirit.id);
        if (index < 0) {
            this.stopInspectionSpiritIds.push(spirit.id);
        }
    }
    
    inspect(spirit: Spirit): boolean {
        if (!(spirit instanceof ComplexSpirit && this.canInspect(spirit))) {
            return false;
        }
        const complexSpirit = spirit as ComplexSpirit;
        if (complexSpirit instanceof MachineSpirit) {
            this.stopInspectingMachine();
            this.inspectedMachine = complexSpirit;
            this.inspectedMachine.inventory.addObserver(this);
        }
        if (complexSpirit instanceof CircuitSpirit) {
            this.stopInspectingCircuit();
            this.inspectedCircuit = complexSpirit;
        }
        this.registerStartInspectingSpirit(complexSpirit);
        return true;
    }
    
    stopInspectingMachine(): void {
        if (this.inspectedMachine === null) {
            return;
        }
        this.inspectedMachine.inventory.removeObserver(this);
        this.registerStopInspectingSpirit(this.inspectedMachine);
        this.inspectedMachine = null;
    }
    
    stopInspectingCircuit(): void {
        if (this.inspectedCircuit === null) {
            return;
        }
        this.registerStopInspectingSpirit(this.inspectedCircuit);
        this.inspectedCircuit = null;
    }
    
    stopInspecting(spirit: ComplexSpirit): void {
        if (spirit === this.inspectedMachine) {
            this.stopInspectingMachine();
        }
        if (spirit === this.inspectedCircuit) {
            this.stopInspectingCircuit();
        }
    }
    
    verifyInspectionState(): void {
        if (this.inspectedMachine !== null && !this.canInspect(this.inspectedMachine)) {
            this.stopInspectingMachine();
        }
        if (this.inspectedCircuit !== null && !this.canInspect(this.inspectedCircuit)) {
            this.stopInspectingCircuit();
        }
    }
    
    getInventoryByParentSpiritId(parentSpiritId: number): Inventory {
        const tempSpirit = complexSpiritMap[parentSpiritId] as InventorySpirit;
        if (typeof tempSpirit === "undefined") {
            return null;
        }
        this.verifyInspectionState();
        if (tempSpirit !== this && tempSpirit !== this.inspectedMachine) {
            return null;
        }
        return tempSpirit.inventory;
    }
    
    transferInventoryItem(
        sourceParentSpiritId: number,
        destinationParentSpiritId: number,
        spiritReference: SpiritReference
    ): void {
        const sourceInventory = this.getInventoryByParentSpiritId(sourceParentSpiritId);
        const destinationInventory = this.getInventoryByParentSpiritId(destinationParentSpiritId);
        if (sourceInventory === null || destinationInventory === null) {
            return;
        }
        const tempItem = sourceInventory.getItemBySpiritReference(spiritReference);
        if (tempItem === null) {
            return;
        }
        const tempSpirit = tempItem.spirit;
        if (destinationInventory.hasParentSpirit(tempSpirit)) {
            return;
        }
        const tempCount = tempItem.decreaseCount(1);
        destinationInventory.increaseItemCountBySpirit(tempSpirit, tempCount);
    }
    
    recycleInventoryItem(
        parentSpiritId: number,
        spiritReference: SpiritReference
    ): void {
        const tempInventory = this.getInventoryByParentSpiritId(parentSpiritId);
        if (tempInventory === null) {
            return;
        }
        const tempItem = tempInventory.getItemBySpiritReference(spiritReference);
        if (tempItem === null || tempItem.count < 1) {
            return;
        }
        tempItem.decrementCount();
        if (tempItem.count <= 0) {
            tempItem.spirit.destroy();
        }
        const tempProductList = tempItem.spirit.getRecycleProducts();
        for (const product of tempProductList) {
            this.inventory.addRecipeComponent(product);
        }
    }
    
    placeCircuitTile(pos: Pos, spiritReference: SpiritReference): void {
        // TODO: Implement.
        
    }
    
    craftCircuitTile(pos: Pos, spiritType: SpiritType): void {
        if (this.inspectedCircuit === null) {
            return;
        }
        if (!spiritType.isFreeToCraft()) {
            return;
        }
        const tempSpirit = spiritType.craft();
        const tempCircuitTile = circuitTileFactory.getTileWithSpirit(tempSpirit);
        this.inspectedCircuit.tileGrid.setTile(pos, tempCircuitTile);
    }
}

export class MachineSpirit extends InventorySpirit {
    
    spiritType: MachineSpiritType;
    colorIndex: number;
    
    constructor(spiritType: MachineSpiritType, id: number, inventory: Inventory = null) {
        super(spiritType, id, inventory);
        this.colorIndex = this.spiritType.colorIndex;
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

export class WorldSpirit extends TileGridSpirit<WorldTile> {
    
    spiritType: WorldSpiritType;
    playerTileList: PlayerWorldTile[];
    
    constructor(
        spiritType: WorldSpiritType,
        id: number,
        tileGrid: TileGrid<WorldTile> = null,
    ) {
        super(spiritType, id, tileGrid);
        this.playerTileList = [];
    }
    
    generateTileGrid(): void {
        this.tileGrid = createWorldTileGrid(worldSize, worldSize);
        for (let count = 0; count < 1000; count++) {
            let tempTile;
            if (Math.random() < 0.5) {
                tempTile = simpleWorldTileSet.matterite;
            } else {
                tempTile = simpleWorldTileSet.energite;
            }
            const tempPos = new Pos(
                Math.floor(Math.random() * this.tileGrid.width),
                Math.floor(Math.random() * this.tileGrid.height)
            );
            this.setTile(tempPos, tempTile);
        }
    }
    
    setTile(pos: Pos, tile: WorldTile): void {
        const tempOldTile = this.tileGrid.getTile(pos);
        super.setTile(pos, tile);
        tempOldTile.removeFromWorldEvent();
        tile.addToWorldEvent(this);
    }
    
    getWindowClientJson(pos: Pos, width: number, height: number): TileClientJson[] {
        return this.tileGrid.getWindowClientJson(pos, width, height);
    }
    
    findPlayerTile(player: Player): number {
        for (let index = 0; index < this.playerTileList.length; index++) {
            const tempTile = this.playerTileList[index];
            const tempPlayer = tempTile.spirit.player;
            if (tempPlayer.username === player.username) {
                return index;
            }
        }
        return -1;
    }
    
    getPlayerTile(player: Player): PlayerWorldTile {
        const index = this.findPlayerTile(player);
        if (index < 0) {
            return null;
        }
        return this.playerTileList[index];
    }
    
    getPlayerSpirit(player: Player): PlayerSpirit {
        const tempTile = this.getPlayerTile(player);
        if (tempTile === null) {
            return null;
        }
        return tempTile.spirit;
    }
    
    addPlayerTile(player: Player): Promise<PlayerSpirit> {
        const tempTile = this.getPlayerTile(player);
        if (tempTile !== null) {
            return Promise.resolve(tempTile.spirit);
        }
        let tempPromise;
        const tempId = player.extraFields.complexSpiritId;
        if (tempId === null) {
            const tempSpirit = (complexSpiritTypeSet.player as PlayerSpiritType).createPlayerSpirit(player);
            tempPromise = Promise.resolve(tempSpirit);
        } else {
            tempPromise = loadComplexSpirit(tempId);
        }
        return tempPromise.then((spirit) => {
            const tempTile = new PlayerWorldTile(spirit);
            // TODO: Make player tile placement more robust.
            const tempPos = new Pos(3, 3);
            while (true) {
                const tempOldTile = this.getTile(tempPos);
                if (tempOldTile.spirit.spiritType === simpleSpiritTypeSet.empty) {
                    break;
                }
                tempPos.x += 1;
            }
            tempTile.addToWorld(this, tempPos);
            return spirit;
        });
    }
    
    tick(): Promise<void> {
        // TODO: Put something here.
        
        return Promise.resolve();
    }
}

export class CircuitSpirit extends TileGridSpirit<CircuitTile> {
    
    generateTileGrid(): void {
        this.tileGrid = createCircuitTileGrid(circuitSize, circuitSize);
        // Generate some garbage tiles for testing purposes.
        const tempPos = new Pos(0, 0);
        while (tempPos.y < this.tileGrid.height) {
            if (Math.random() < 0.3) {
                const tempTile = simpleCircuitTileMap[simpleSpiritSerialIntegerSet.wire + Math.floor(Math.random() * wireArrangementAmount)];
                this.setTile(tempPos, tempTile);
            }
            this.tileGrid.advancePos(tempPos);
        }
    }
}

export const loadNextComplexSpiritId = (): Promise<void> => (
    niceUtils.performDbQuery(
        "SELECT * FROM Configuration WHERE name = ?",
        ["nextComplexSpiritId"]
    ).then((results: ConfigDbJson[]) => {
        if (results.length > 0) {
            nextComplexSpiritId = parseInt(results[0].value, 10);
        } else {
            nextComplexSpiritId = 0;
            return niceUtils.performDbQuery(
                "INSERT INTO Configuration (name, value) VALUES (?, ?)",
                ["nextComplexSpiritId", nextComplexSpiritId]
            );
        }
    })
);

export const persistNextComplexSpiritId = (): Promise<void> => (
    niceUtils.performDbQuery(
        "UPDATE Configuration SET value = ? WHERE name = ?",
        [nextComplexSpiritId, "nextComplexSpiritId"]
    )
);

export const persistAllComplexSpirits = (): Promise<void> => {
    const operationList = [];
    for (const id in dirtyComplexSpiritMap) {
        const tempSpirit = dirtyComplexSpiritMap[id];
        operationList.push(() => tempSpirit.persist());
        delete dirtyComplexSpiritMap[id];
    }
    if (operationList.length <= 0) {
        return Promise.resolve();
    }
    return operationList.reduce((accumulator, operation) => (
        accumulator.then(operation)
    ), Promise.resolve());
};


