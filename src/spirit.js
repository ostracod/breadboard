
import {simpleSpiritSerialIntegerSet, wireArrangementAmount, simpleSpiritSet, simpleCircuitTileSet, simpleSpiritMap, complexSpiritMap, dirtyComplexSpiritMap, simpleCircuitTileMap} from "./globalData.js";
import {Pos} from "./pos.js";
import {SimpleSpiritReference, ComplexSpiritReference} from "./spiritReference.js";
import {Inventory, pushInventoryUpdate} from "./inventory.js";
import {pushRecipeComponent} from "./recipe.js";
import {WorldTile} from "./worldTile.js";
import {TileGrid} from "./tileGrid.js";

import ostracodMultiplayer from "ostracod-multiplayer";
let dbUtils = ostracodMultiplayer.dbUtils;

let nextComplexSpiritId = 0;

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
    
    setTile(tile) {
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
        this.tile = null;
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
    
    setTile(tile) {
        this.tile = tile;
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
        return (this.parentSpirit === null);
    }
    
    persist() {
        let tempShouldHaveDbRow = this.shouldHaveDbRow();
        return new Promise((resolve, reject) => {
            
            function queryCallback(error, results, fields) {
                if (error) {
                    reject(dbUtils.convertSqlErrorToText(error));
                    return;
                }
                resolve();
            }
            
            let attributeData = JSON.stringify(this.getAttributeDbJson());
            let containerData = JSON.stringify(this.getContainerDbJson());
            if (this.hasDbRow) {
                if (tempShouldHaveDbRow) {
                    dbUtils.performQuery(
                        "UPDATE ComplexSpirits SET attributeData = ?, containerData = ? WHERE id = ?",
                        [attributeData, containerData, this.id],
                        queryCallback
                    );
                } else {
                    dbUtils.performQuery(
                        "DELETE FROM ComplexSpirits WHERE id = ?",
                        [this.id],
                        queryCallback
                    );
                }
            } else {
                if (tempShouldHaveDbRow) {
                    this.hasDbRow = true;
                    dbUtils.performQuery(
                        "INSERT INTO ComplexSpirits (id, parentId, classId, attributeData, containerData) VALUES (?, NULL, ?, ?, ?)",
                        [this.id, this.classId, attributeData, containerData],
                        queryCallback
                    );
                } else {
                    resolve();
                }
            }
        });
    }
}

export class InventorySpirit extends ComplexSpirit {
    
    constructor(spiritType, id, inventory) {
        super(spiritType, id);
        if (inventory === null) {
            inventory = new Inventory();
        }
        this.inventory = inventory;
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
        if (!(spirit.tile instanceof WorldTile)) {
            return false;
        }
        let tempPos1 = this.tile.pos;
        let tempPos2 = spirit.tile.pos;
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

export class CircuitSpirit extends ComplexSpirit {
    
    constructor(spiritType, id, tileGrid = null) {
        super(spiritType, id);
        if (tileGrid === null) {
            tileGrid = new TileGrid(
                17,
                17,
                simpleCircuitTileSet.empty,
                simpleCircuitTileSet.barrier
            );
            // Generate some garbage tiles for testing purposes.
            let tempPos = new Pos(0, 0);
            while (tempPos.y < tileGrid.height) {
                if (Math.random() < 0.3) {
                    let tempTile = simpleCircuitTileMap[simpleSpiritSerialIntegerSet.wire + Math.floor(Math.random() * wireArrangementAmount)];
                    tileGrid.setTile(tempPos, tempTile);
                }
                tileGrid.advancePos(tempPos);
            }
        }
        this.tileGrid = tileGrid;
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
}

export function getNextComplexSpiritId() {
    return nextComplexSpiritId;
}

export function setNextComplexSpiritId(id) {
    nextComplexSpiritId = id;
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
    return new Promise((resolve, reject) => {
        dbUtils.performTransaction(callback => {
            operationList.reduce((accumulator, operation) => {
                return accumulator.then(operation);
            }, Promise.resolve()).then(callback);
        }, resolve);
    });
}


