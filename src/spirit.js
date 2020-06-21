
import {simpleSpiritSerialIntegerSet, wireArrangementAmount, worldSize, circuitSize, simpleSpiritSet, simpleSpiritTypeSet, complexSpiritTypeSet, simpleWorldTileSet, simpleCircuitTileSet, simpleSpiritMap, complexSpiritMap, dirtyComplexSpiritMap, simpleCircuitTileMap, circuitTileFactory} from "./globalData.js";
import {Pos} from "./pos.js";
import {loadComplexSpirit} from "./spiritType.js";
import {SimpleSpiritReference, ComplexSpiritReference} from "./spiritReference.js";
import {Inventory, pushInventoryUpdate} from "./inventory.js";
import {pushRecipeComponent} from "./recipe.js";
import {WorldTile, PlayerWorldTile} from "./worldTile.js";
import {createWorldTileGrid, createCircuitTileGrid} from "./tileGrid.js";
import {niceUtils} from "./niceUtils.js";

let nextComplexSpiritId;

// The idea is that a Spirit is something which may
// exist as a Tile or Item.
// A SimpleSpirit holds no state, and may be
// serialized as a single integer.
// A ComplexSpirit holds custom state, and must
// be serialized as a JSON dictionary.

class Spirit {
    
    // Concrete subclasses of Spirit must implement these methods:
    // getClientJson, getNestedDbJson, getReference
    
    constructor(spiritType) {
        this.spiritType = spiritType;
    }
    
    canBeMined() {
        return this.spiritType.canBeMined();
    }
    
    canBeInspected() {
        return this.spiritType.canBeInspected();
    }
    
    populateParentSpirit(spirit) {
        // Do nothing.
    }
    
    changeParentSpirit(spirit) {
        // Do nothing.
    }
    
    setParentTile(tile) {
        // Do nothing.
    }
    
    destroy() {
        // Do nothing.
    }
    
    getRecycleProducts() {
        return this.spiritType.getBaseRecycleProducts();
    }
}

export class SimpleSpirit extends Spirit {
    
    constructor(spiritType) {
        super(spiritType);
        this.serialInteger = this.spiritType.serialInteger;
        this.reference = new SimpleSpiritReference(this.serialInteger);
        simpleSpiritSet[this.spiritType.baseName] = this;
        simpleSpiritMap[this.serialInteger] = this;
    }
    
    getClientJson() {
        return this.serialInteger;
    }
    
    getNestedDbJson() {
        return this.serialInteger;
    }
    
    getReference() {
        return this.reference;
    }
}

export class ComplexSpirit extends Spirit {
    
    constructor(spiritType, id) {
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
    
    markAsDirty() {
        dirtyComplexSpiritMap[this.id] = this;
        if (!this.hasDbRow && this.parentSpirit !== null) {
            this.parentSpirit.markAsDirty();
        }
    }
    
    getClientJson() {
        return {
            classId: this.classId,
            id: this.id
        };
    }
    
    getAttributeDbJson() {
        return null;
    }
    
    getContainerDbJson() {
        return null;
    }
    
    getNestedDbJson() {
        if (this.shouldHaveDbRow()) {
            return {
                id: this.id
            };
        } else {
            return {
                id: this.id,
                classId: this.classId,
                attributeData: this.getAttributeDbJson(),
                containerData: this.getContainerDbJson()
            };
        }
    }
    
    getReference() {
        return this.reference;
    }
    
    populateParentSpirit(spirit) {
        this.parentSpirit = spirit;
    }
    
    changeParentSpirit(spirit) {
        if (spirit === this.parentSpirit) {
            return;
        }
        this.parentSpirit = spirit;
        this.markAsDirty();
    }
    
    // Parent may be any number of steps removed.
    hasParentSpirit(spirit) {
        let tempSpirit = this.parentSpirit;
        while (tempSpirit !== null) {
            if (spirit === tempSpirit) {
                return true;
            }
            tempSpirit = tempSpirit.parentSpirit;
        }
        return false;
    }
    
    setParentTile(tile) {
        this.parentTile = tile;
    }
    
    // Spirit must be removed from parent before invoking destroy method.
    destroy() {
        delete complexSpiritMap[this.id];
        this.isDestroyed = true;
        this.markAsDirty();
    }
    
    shouldHaveDbRow() {
        if (this.isDestroyed) {
            return false;
        }
        // TODO: Optimize nesting logic.
        return (this.parentSpirit === null || this.parentSpirit instanceof WorldSpirit);
    }
    
    persist() {
        let tempShouldHaveDbRow = this.shouldHaveDbRow();
        let attributeData = JSON.stringify(this.getAttributeDbJson());
        let containerData = JSON.stringify(this.getContainerDbJson());
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

export class InventorySpirit extends ComplexSpirit {
    
    constructor(spiritType, id, inventory) {
        super(spiritType, id);
        if (inventory === null) {
            this.inventory = new Inventory();
        } else {
            this.inventory = inventory;
        }
        this.inventory.populateParentSpirit(this);
        this.inventory.addObserver(this);
    }
    
    inventoryChangeEvent(inventory, item) {
        this.markAsDirty();
    }
    
    getContainerDbJson() {
        return this.inventory.getDbJson();
    }
    
    destroy() {
        for (let item of this.inventory.items) {
            item.spirit.destroy();
        }
        super.destroy();
    }
    
    getRecycleProducts() {
        let output = super.getRecycleProducts();
        for (let item of this.inventory.items) {
            let tempProductList = item.spirit.getRecycleProducts();
            for (let recipeComponent of tempProductList) {
                recipeComponent.scale(item.count);
                pushRecipeComponent(output, recipeComponent);
            }
        }
        return output;
    }
}

export class PlayerSpirit extends InventorySpirit {
    
    constructor(spiritType, player, inventory = null) {
        let lastId = player.extraFields.complexSpiritId;
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
    
    inventoryChangeEvent(inventory, item) {
        super.inventoryChangeEvent(inventory, item);
        let tempUpdate = item.getInventoryUpdate();
        pushInventoryUpdate(this.inventoryUpdates, tempUpdate);
    }
    
    getClientJson() {
        let output = super.getClientJson();
        output.username = this.player.username;
        return output;
    }
    
    getAttributeDbJson() {
        return {
            username: this.player.username
        };
    }
    
    getNestedDbJson() {
        // Player spirit should never be persisted in a container.
        return null;
    }
    
    canInspect(spirit) {
        if (!spirit.canBeInspected()) {
            return false;
        }
        if (spirit.hasParentSpirit(this)) {
            return true;
        }
        if (!(spirit.parentTile instanceof WorldTile)) {
            return false;
        }
        let tempPos1 = this.parentTile.pos;
        let tempPos2 = spirit.parentTile.pos;
        return tempPos1.isAdjacentTo(tempPos2);
    }
    
    registerStartInspectingSpirit(spirit) {
        let index = this.stopInspectionSpiritIds.indexOf(spirit.id);
        if (index >= 0) {
            this.stopInspectionSpiritIds.splice(index);
        }
    }
    
    registerStopInspectingSpirit(spirit) {
        let index = this.stopInspectionSpiritIds.indexOf(spirit.id);
        if (index < 0) {
            this.stopInspectionSpiritIds.push(spirit.id);
        }
    }
    
    inspect(spirit) {
        if (!this.canInspect(spirit)) {
            return false;
        }
        if (spirit instanceof MachineSpirit) {
            this.stopInspectingMachine();
            this.inspectedMachine = spirit;
            this.inspectedMachine.inventory.addObserver(this);
        }
        if (spirit instanceof CircuitSpirit) {
            this.stopInspectingCircuit();
            this.inspectedCircuit = spirit;
        }
        this.registerStartInspectingSpirit(spirit);
        return true;
    }
    
    stopInspectingMachine() {
        if (this.inspectedMachine === null) {
            return;
        }
        this.inspectedMachine.inventory.removeObserver(this);
        this.registerStopInspectingSpirit(this.inspectedMachine);
        this.inspectedMachine = null;
    }
    
    stopInspectingCircuit() {
        if (this.inspectedCircuit === null) {
            return;
        }
        this.registerStopInspectingSpirit(this.inspectedCircuit);
        this.inspectedCircuit = null;
    }
    
    stopInspecting(spirit) {
        if (spirit === this.inspectedMachine) {
            this.stopInspectingMachine();
        }
        if (spirit === this.inspectedCircuit) {
            this.stopInspectingCircuit();
        }
    }
    
    verifyInspectionState() {
        if (this.inspectedMachine !== null && !this.canInspect(this.inspectedMachine)) {
            this.stopInspectingMachine();
        }
        if (this.inspectedCircuit !== null && !this.canInspect(this.inspectedCircuit)) {
            this.stopInspectingCircuit();
        }
    }
    
    getInventoryByParentSpiritId(parentSpiritId) {
        let tempSpirit = complexSpiritMap[parentSpiritId];
        if (typeof tempSpirit === "undefined") {
            return null;
        }
        this.verifyInspectionState();
        if (tempSpirit !== this && tempSpirit !== this.inspectedMachine) {
            return null;
        }
        return tempSpirit.inventory;
    }
    
    transferInventoryItem(sourceParentSpiritId, destinationParentSpiritId, spiritReference) {
        let sourceInventory = this.getInventoryByParentSpiritId(sourceParentSpiritId);
        let destinationInventory = this.getInventoryByParentSpiritId(destinationParentSpiritId);
        if (sourceInventory === null || destinationInventory === null) {
            return;
        }
        let tempItem = sourceInventory.getItemBySpiritReference(spiritReference);
        if (tempItem === null) {
            return;
        }
        let tempSpirit = tempItem.spirit;
        if (destinationInventory.hasParentSpirit(tempSpirit)) {
            return;
        }
        let tempCount = tempItem.decreaseCount(1);
        destinationInventory.increaseItemCountBySpirit(tempSpirit, tempCount);
    }
    
    recycleInventoryItem(parentSpiritId, spiritReference) {
        let tempInventory = this.getInventoryByParentSpiritId(parentSpiritId);
        if (tempInventory === null) {
            return;
        }
        let tempItem = tempInventory.getItemBySpiritReference(spiritReference);
        if (tempItem === null || tempItem.count < 1) {
            return;
        }
        tempItem.decrementCount();
        if (tempItem.count <= 0) {
            tempItem.spirit.destroy();
        }
        let tempProductList = tempItem.spirit.getRecycleProducts();
        for (let product of tempProductList) {
            this.inventory.addRecipeComponent(product);
        }
    }
    
    placeCircuitTile(pos, spiritReference) {
        // TODO: Implement.
        
    }
    
    craftCircuitTile(pos, spiritType) {
        if (this.inspectedCircuit === null) {
            return;
        }
        if (!spiritType.isFreeToCraft()) {
            return;
        }
        let tempSpirit = spiritType.craft();
        let tempCircuitTile = circuitTileFactory.getTileWithSpirit(tempSpirit);
        this.inspectedCircuit.tileGrid.setTile(pos, tempCircuitTile);
    }
}

export class MachineSpirit extends InventorySpirit {
    
    constructor(spiritType, id, inventory = null) {
        super(spiritType, id, inventory);
        this.colorIndex = this.spiritType.colorIndex;
    }
    
    getClientJson() {
        let output = super.getClientJson();
        output.colorIndex = this.colorIndex;
        return output;
    }
    
    getAttributeDbJson() {
        return {
            colorIndex: this.colorIndex
        };
    }
}

export class TileGridSpirit extends ComplexSpirit {
    
    // Concrete subclasses of TileGridSpirit must implement these methods:
    // generateTileGrid
    
    constructor(spiritType, id, tileGrid = null) {
        super(spiritType, id);
        if (tileGrid === null) {
            this.generateTileGrid();
        } else {
            this.tileGrid = tileGrid;
        }
        this.tileGrid.populateParentSpirit(this);
    }
    
    getContainerDbJson() {
        return this.tileGrid.getDbJson();
    }
    
    destroy() {
        for (let tile of this.tileGrid.tileList) {
            tile.spirit.destroy();
        }
        super.destroy();
    }
    
    getRecycleProducts() {
        let output = super.getRecycleProducts();
        for (let tile of this.tileGrid.tileList) {
            let tempProductList = tile.spirit.getRecycleProducts();
            for (let recipeComponent of tempProductList) {
                pushRecipeComponent(output, recipeComponent);
            }
        }
        return output;
    }
    
    getTile(pos) {
        return this.tileGrid.getTile(pos);
    }
    
    setTile(pos, tile) {
        this.tileGrid.setTile(pos, tile);
    }
    
    swapTiles(pos1, pos2) {
        this.tileGrid.swapTiles(pos1, pos2);
    }
}

export class WorldSpirit extends TileGridSpirit {
    
    constructor(spiritType, id, tileGrid) {
        super(spiritType, id, tileGrid);
        this.playerTileList = [];
    }
    
    generateTileGrid() {
        this.tileGrid = createWorldTileGrid(worldSize, worldSize);
        for (let count = 0; count < 1000; count++) {
            let tempTile;
            if (Math.random() < 0.5) {
                tempTile = simpleWorldTileSet.matterite;
            } else {
                tempTile = simpleWorldTileSet.energite;
            }
            let tempPos = new Pos(
                Math.floor(Math.random() * this.tileGrid.width),
                Math.floor(Math.random() * this.tileGrid.height)
            );
            this.setTile(tempPos, tempTile);
        }
    }
    
    setTile(pos, tile) {
        let tempOldTile = this.tileGrid.getTile(pos);
        super.setTile(pos, tile);
        tempOldTile.removeFromWorldEvent();
        tile.addToWorldEvent(this);
    }
    
    getWindowClientJson(pos, width, height) {
        return this.tileGrid.getWindowClientJson(pos, width, height);
    }
    
    findPlayerTile(player) {
        for (let index = 0; index < this.playerTileList.length; index++) {
            let tempTile = this.playerTileList[index];
            let tempPlayer = tempTile.spirit.player;
            if (tempPlayer.username == player.username) {
                return index;
            }
        }
        return -1;
    }
    
    getPlayerTile(player) {
        let index = this.findPlayerTile(player);
        if (index < 0) {
            return null;
        }
        return this.playerTileList[index];
    }
    
    getPlayerSpirit(player) {
        let tempTile = this.getPlayerTile(player);
        if (tempTile === null) {
            return null;
        }
        return tempTile.spirit;
    }
    
    addPlayerTile(player) {
        let tempTile = this.getPlayerTile(player);
        if (tempTile !== null) {
            return Promise.resolve(tempTile.spirit);
        }
        let tempPromise;
        let tempId = player.extraFields.complexSpiritId;
        if (tempId === null) {
            let tempSpirit = complexSpiritTypeSet.player.createPlayerSpirit(player);
            tempPromise = Promise.resolve(tempSpirit);
        } else {
            tempPromise = loadComplexSpirit(tempId);
        }
        return tempPromise.then(spirit => {
            let tempTile = new PlayerWorldTile(spirit);
            // TODO: Make player tile placement more robust.
            let tempPos = new Pos(3, 3);
            while (true) {
                let tempOldTile = this.getTile(tempPos);
                if (tempOldTile.spirit.spiritType === simpleSpiritTypeSet.empty) {
                    break;
                }
                tempPos.x += 1;
            }
            tempTile.addToWorld(this, tempPos);
            return spirit;
        });
    }
    
    tick() {
        // TODO: Put something here.
        
        return Promise.resolve();
    }
}

export class CircuitSpirit extends TileGridSpirit {
    
    generateTileGrid() {
        this.tileGrid = createCircuitTileGrid(circuitSize, circuitSize);
        // Generate some garbage tiles for testing purposes.
        let tempPos = new Pos(0, 0);
        while (tempPos.y < this.tileGrid.height) {
            if (Math.random() < 0.3) {
                let tempTile = simpleCircuitTileMap[simpleSpiritSerialIntegerSet.wire + Math.floor(Math.random() * wireArrangementAmount)];
                this.setTile(tempPos, tempTile);
            }
            this.tileGrid.advancePos(tempPos);
        }
    }
}

export function loadNextComplexSpiritId() {
    return niceUtils.performDbQuery(
        "SELECT * FROM Configuration WHERE name = ?",
        ["nextComplexSpiritId"]
    ).then(results => {
        if (results.length > 0) {
            nextComplexSpiritId = parseInt(results[0].value);
        } else {
            nextComplexSpiritId = 0;
            return niceUtils.performDbQuery(
                "INSERT INTO Configuration (name, value) VALUES (?, ?)",
                ["nextComplexSpiritId", nextComplexSpiritId]
            );
        }
    });
}

export function persistNextComplexSpiritId() {
    return niceUtils.performDbQuery(
        "UPDATE Configuration SET value = ? WHERE name = ?",
        [nextComplexSpiritId, "nextComplexSpiritId"]
    );
}

export function persistAllComplexSpirits() {
    let operationList = [];
    for (let id in dirtyComplexSpiritMap) {
        let tempSpirit = dirtyComplexSpiritMap[id];
        operationList.push(() => tempSpirit.persist());
        delete dirtyComplexSpiritMap[id];
    }
    if (operationList.length <= 0) {
        return Promise.resolve();
    }
    return operationList.reduce((accumulator, operation) => {
        return accumulator.then(operation);
    }, Promise.resolve());
}


