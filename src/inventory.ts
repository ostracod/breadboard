
import {complexSpiritMap} from "./globalData.js";
import {InventoryItemClientJson, InventoryItemDbJson, InventoryUpdateClientJson, InventoryDbJson} from "./interfaces.js";
import {Spirit, ComplexSpirit, InventorySpirit} from "./spirit.js";
import {SimpleSpiritType, convertDbJsonToSpirit} from "./spiritType.js";
import {SpiritReference, convertJsonToSpiritReference} from "./spiritReference.js";
import {Recipe, RecipeComponent} from "./recipe.js";
import {niceUtils} from "./niceUtils.js";

export class InventoryItem {
    
    inventory: Inventory;
    spirit: Spirit;
    count: number;
    
    constructor(inventory: Inventory, spirit: Spirit, count: number) {
        this.inventory = inventory;
        this.spirit = spirit;
        this.count = count;
        this.inventory.items.push(this);
        this.notifyInventoryObservers();
    }
    
    notifyInventoryObservers(): void {
        this.inventory.notifyObservers(this);
    }
    
    getClientJson(): InventoryItemClientJson {
        return {
            spirit: this.spirit.getClientJson(),
            count: this.count
        };
    }
    
    getDbJson(): InventoryItemDbJson {
        return {
            spirit: this.spirit.getNestedDbJson(),
            count: this.count
        };
    }
    
    setCount(count: number): void {
        this.count = count;
        this.notifyInventoryObservers();
        if (this.count <= 0) {
            this.inventory.removeItem(this);
        }
    }
    
    decreaseCount(offset: number): number {
        if (this.count >= offset) {
            this.setCount(this.count - offset);
            return offset;
        } else {
            let output = this.count;
            this.setCount(0);
            return output;
        }
    }
    
    decrementCount(): void {
        this.decreaseCount(1);
    }
    
    getInventoryUpdate(): InventoryUpdate {
        return new InventoryUpdate(this.inventory, this.spirit, this.count);
    }
}

export interface InventoryObserver {
    inventoryChangeEvent(inventory: Inventory, item: InventoryItem);
}

export class Inventory {
    
    items: InventoryItem[];
    observers: InventoryObserver[];
    parentSpirit: InventorySpirit;
    
    constructor() {
        this.items = [];
        this.observers = [];
        this.parentSpirit = null;
    }
    
    addObserver(observer: InventoryObserver) {
        this.observers.push(observer);
    }
    
    removeObserver(observer: InventoryObserver) {
        let index = this.observers.indexOf(observer);
        if (index < 0) {
            return;
        }
        this.observers.splice(index, 1);
    }
    
    notifyObservers(item: InventoryItem): void {
        for (let observer of this.observers) {
            observer.inventoryChangeEvent(this, item);
        }
    }
    
    populateParentSpirit(spirit: InventorySpirit): void {
        this.parentSpirit = spirit;
        for (let item of this.items) {
            item.spirit.populateParentSpirit(this.parentSpirit);
        }
    }
    
    getDbJson(): InventoryDbJson {
        return this.items.map(item => item.getDbJson());
    }
    
    findItemBySpirit(spirit: Spirit): number {
        for (let index = 0; index < this.items.length; index++) {
            let tempItem = this.items[index];
            if (tempItem.spirit === spirit) {
                return index;
            }
        }
        return -1;
    }
    
    findItem(item: InventoryItem): number {
        return this.findItemBySpirit(item.spirit);
    }
    
    getItemBySpirit(spirit: Spirit): InventoryItem {
        let index = this.findItemBySpirit(spirit);
        if (index >= 0) {
            return this.items[index];
        } else {
            return null;
        }
    }
    
    findItemBySpiritReference(spiritReference: SpiritReference): number {
        for (let index = 0; index < this.items.length; index++) {
            let tempItem = this.items[index];
            let tempReference = tempItem.spirit.getReference();
            if (tempReference.equals(spiritReference)) {
                return index;
            }
        }
        return -1;
    }
    
    getItemBySpiritReference(spiritReference: SpiritReference): InventoryItem {
        let index = this.findItemBySpiritReference(spiritReference);
        if (index >= 0) {
            return this.items[index];
        } else {
            return null;
        }
    }
    
    getInventoryUpdate(spirit: Spirit): InventoryUpdate {
        let tempItem = this.getItemBySpirit(spirit);
        if (tempItem === null) {
            return new InventoryUpdate(this, spirit, 0);
        } else {
            return tempItem.getInventoryUpdate();
        }
    }
    
    getItemCountBySpirit(spirit: Spirit): number {
        let tempItem = this.getItemBySpirit(spirit);
        if (tempItem === null) {
            return 0;
        } else {
            return tempItem.count;
        }
    }
    
    setItemCountBySpirit(spirit: Spirit, count: number): void {
        let tempItem = this.getItemBySpirit(spirit);
        if (tempItem === null) {
            if (count > 0) {
                new InventoryItem(this, spirit, count);
                spirit.changeParentSpirit(this.parentSpirit);
            }
        } else {
            tempItem.setCount(count);
        }
    }
    
    getItemCountBySpiritReference(spiritReference: SpiritReference): number {
        let tempItem = this.getItemBySpiritReference(spiritReference);
        if (tempItem === null) {
            return 0;
        } else {
            return tempItem.count;
        }
    }
    
    increaseItemCountBySpirit(spirit: Spirit, count: number): void {
        let tempCount = this.getItemCountBySpirit(spirit);
        this.setItemCountBySpirit(spirit, tempCount + count);
    }
    
    incrementItemCountBySpirit(spirit: Spirit): void {
        this.increaseItemCountBySpirit(spirit, 1);
    }
    
    removeItem(item: InventoryItem): void {
        let index = this.findItem(item);
        this.items.splice(index, 1);
        item.spirit.changeParentSpirit(null);
    }
    
    hasRecipeComponent(recipeComponent: RecipeComponent): boolean {
        let tempCount = 0;
        for (let item of this.items) {
            if (recipeComponent.spiritType.matchesSpirit(item.spirit)) {
                tempCount += item.count;
            }
        }
        return (tempCount >= recipeComponent.count);
    }
    
    canCraftRecipe(recipe: Recipe): boolean {
        for (let component of recipe.ingredients) {
            if (!this.hasRecipeComponent(component)) {
                return false;
            }
        }
        return true;
    }
    
    removeRecipeComponent(recipeComponent: RecipeComponent): void {
        let tempCount = recipeComponent.count;
        for (let item of this.items) {
            if (recipeComponent.spiritType.matchesSpirit(item.spirit)) {
                let tempResult = item.decreaseCount(tempCount);
                tempCount -= tempResult;
                if (tempCount <= 0) {
                    break;
                }
            }
        }
    }
    
    addRecipeComponent(recipeComponent: RecipeComponent): void {
        if (recipeComponent.spiritType instanceof SimpleSpiritType) {
            let tempSpirit = recipeComponent.spiritType.craft();
            this.increaseItemCountBySpirit(tempSpirit, recipeComponent.count);
        } else {
            for (let count = 0; count < recipeComponent.count; count++) {
                let tempSpirit = recipeComponent.spiritType.craft();
                this.incrementItemCountBySpirit(tempSpirit);
            }
        }
    }
    
    craftRecipe(recipe: Recipe): void {
        if (!this.canCraftRecipe(recipe)) {
            return;
        }
        for (let component of recipe.ingredients) {
            this.removeRecipeComponent(component);
        }
        this.addRecipeComponent(recipe.product);
    }
    
    // Parent may be any number of steps removed.
    hasParentSpirit(spirit: Spirit): boolean {
        if (this.parentSpirit === spirit) {
            return true;
        }
        return this.parentSpirit.hasParentSpirit(spirit);
    }
}

export class InventoryUpdate {
    
    inventory: Inventory;
    spirit: Spirit;
    count: number;
    
    constructor(inventory: Inventory, spirit: Spirit, count: number) {
        this.inventory = inventory;
        this.spirit = spirit;
        this.count = count;
    }
    
    getClientJson(shouldUseReference = true): InventoryUpdateClientJson {
        let output = {
            parentSpiritId: this.inventory.parentSpirit.id,
            count: this.count
        } as InventoryUpdateClientJson;
        if (shouldUseReference) {
            let tempReference = this.spirit.getReference();
            output.spiritReference = tempReference.getJson();
        } else {
            output.spirit = this.spirit.getClientJson();
        }
        return output;
    }
    
    applyToInventory(): void {
        this.inventory.setItemCountBySpirit(this.spirit, this.count);
    }
}

export function convertDbJsonToInventory(
    data: InventoryDbJson,
    shouldPerformTransaction = true
): Promise<Inventory> {
    let output = new Inventory();
    return niceUtils.performConditionalDbTransaction(shouldPerformTransaction, () => {
        return data.reduce((accumulator, itemData) => {
            return accumulator.then(() => {
                return convertDbJsonToSpirit(itemData.spirit, false);
            }).then(spirit => {
                new InventoryItem(output, spirit, itemData.count);
            });
        }, Promise.resolve());
    }).then(() => output);
}

function convertClientJsonToInventoryUpdate(
    data: InventoryUpdateClientJson
): InventoryUpdate {
    let parentSpirit = complexSpiritMap[data.parentSpiritId] as InventorySpirit;
    if (typeof parentSpirit === "undefined") {
        return null;
    }
    let tempSpirit;
    if ("spirit" in data) {
        throw new Error("Operation not supported.");
    } else {
        let tempReference = convertJsonToSpiritReference(data.spiritReference);
        tempSpirit = tempReference.getSpirit();
        if (tempSpirit === null) {
            return null;
        }
    }
    return new InventoryUpdate(parentSpirit.inventory, tempSpirit, data.count);
}

export function pushInventoryUpdate(
    destination: InventoryUpdate[],
    update: InventoryUpdate,
): void {
    for (let index = destination.length - 1; index >= 0; index--) {
        let tempUpdate = destination[index];
        if (tempUpdate.inventory === update.inventory
                && tempUpdate.spirit === update.spirit) {
            destination.splice(index, 1);
        }
    }
    destination.push(update);
}

export function pushInventoryUpdates(
    destination: InventoryUpdate[],
    updateList: InventoryUpdate[],
): void {
    for (let update of updateList) {
        pushInventoryUpdate(destination, update);
    }
}


