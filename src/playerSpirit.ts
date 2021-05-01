
import { complexSpiritMap, circuitTileFactory } from "./globalData.js";
import { Player, PlayerSpiritClientJson, ComplexSpiritNestedDbJson, PlayerSpiritAttributeJson } from "./interfaces.js";
import { Pos } from "./pos.js";
import { Spirit, ComplexSpirit, InventorySpirit, MachineSpirit } from "./spirit.js";
import { CircuitSpirit } from "./logicSpirit.js";
import { SpiritType, PlayerSpiritType } from "./spiritType.js";
import { SpiritReference } from "./spiritReference.js";
import { Inventory, InventoryItem, InventoryUpdate, pushInventoryUpdate } from "./inventory.js";

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


