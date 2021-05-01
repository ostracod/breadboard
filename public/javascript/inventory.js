
const inventoryButtonTagIdPrefixSet = ["inspect", "transfer", "recycle", "install"];

class InventoryItem {
    
    constructor(inventory, spirit, count) {
        this.inventory = inventory;
        this.spirit = spirit;
        this.count = count;
        this.row = new InventoryOptionRow(this);
        this.inventory.items.push(this);
        if (this.inventory.selectedItem === null) {
            this.select();
        }
        this.notifyInventoryObservers();
    }
    
    notifyInventoryObservers() {
        this.inventory.notifyObservers(this);
    }
    
    unselect() {
        if (this.inventory.selectedItem !== this) {
            return;
        }
        this.row.unselect();
        this.inventory.setSelectedItem(null);
    }
    
    select() {
        if (this.inventory.selectedItem !== null) {
            this.inventory.selectedItem.unselect();
        }
        this.row.select();
        this.inventory.setSelectedItem(this);
    }
    
    setCount(count) {
        if (count === this.count) {
            return;
        }
        this.count = count;
        this.notifyInventoryObservers();
        if (this.count > 0) {
            this.row.draw();
        } else {
            this.unselect();
            this.row.remove();
            this.inventory.removeItem(this);
        }
    }
    
    decreaseCount(offset) {
        if (this.count >= offset) {
            this.setCount(this.count - offset);
            return offset;
        } else {
            const output = this.count;
            this.setCount(0);
            return output;
        }
    }
    
    decrementCount() {
        this.decreaseCount(1);
    }
    
    getInventoryUpdate() {
        return new InventoryUpdate(this.inventory, this.spirit, this.count);
    }
    
    recycle() {
        if (this.count < 1) {
            return;
        }
        const inventoryUpdateList = [];
        this.decrementCount();
        inventoryUpdateList.push(this.getInventoryUpdate());
        const tempProductList = this.spirit.getRecycleProducts();
        for (const product of tempProductList) {
            const tempUpdateList = localPlayerInventory.addRecipeComponent(product);
            pushInventoryUpdates(inventoryUpdateList, tempUpdateList);
        }
        addRecycleCommand(this, inventoryUpdateList);
    }
}

class Inventory {
    
    constructor(tagIdPrefix, parentSpiritId) {
        this.tag = document.getElementById(tagIdPrefix + "InventoryItems");
        this.tag.innerHTML = "";
        this.buttonTagMap = {};
        for (const buttonTagIdPrefix of inventoryButtonTagIdPrefixSet) {
            const tempTag = document.getElementById(buttonTagIdPrefix + capitalize(tagIdPrefix) + "ItemButton");
            if (tempTag !== null) {
                this.buttonTagMap[buttonTagIdPrefix] = tempTag;
            }
        }
        this.parentSpiritId = parentSpiritId;
        this.items = [];
        this.selectedItem = null;
        this.observers = [];
        parentSpiritInventoryMap[this.parentSpiritId] = this;
        this.updateButtonColors();
    }
    
    addObserver(observer) {
        this.observers.push(observer);
    }
    
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index < 0) {
            return;
        }
        this.observers.splice(index, 1);
    }
    
    notifyObservers(item) {
        for (const observer of this.observers) {
            observer.inventoryChangeEvent(this, item);
        }
    }
    
    cleanUp() {
        delete parentSpiritInventoryMap[this.parentSpiritId];
    }
    
    findItemBySpirit(spirit) {
        for (let index = 0; index < this.items.length; index++) {
            const tempItem = this.items[index];
            if (tempItem.spirit.hasSameIdentity(spirit)) {
                return index;
            }
        }
        return -1;
    }
    
    findItem(item) {
        return this.findItemBySpirit(item.spirit);
    }
    
    getItemBySpirit(spirit) {
        const index = this.findItemBySpirit(spirit);
        if (index >= 0) {
            return this.items[index];
        } else {
            return null;
        }
    }
    
    getInventoryUpdate(spirit) {
        const tempItem = this.getItemBySpirit(spirit);
        if (tempItem === null) {
            return new InventoryUpdate(this, spirit, 0);
        } else {
            return tempItem.getInventoryUpdate();
        }
    }
    
    
    getItemCountBySpirit(spirit) {
        const tempItem = this.getItemBySpirit(spirit);
        if (tempItem === null) {
            return 0;
        } else {
            return tempItem.count;
        }
    }
    
    setItemCountBySpirit(spirit, count) {
        const tempItem = this.getItemBySpirit(spirit);
        if (tempItem === null) {
            if (count > 0) {
                new InventoryItem(this, spirit, count);
            }
        } else {
            tempItem.setCount(count);
        }
    }
    
    increaseItemCountBySpirit(spirit, count) {
        const tempCount = this.getItemCountBySpirit(spirit);
        this.setItemCountBySpirit(spirit, tempCount + count);
    }
    
    incrementItemCountBySpirit(spirit) {
        this.increaseItemCountBySpirit(spirit, 1);
    }
    
    removeItem(item) {
        const index = this.findItem(item);
        this.items.splice(index, 1);
        if (this.selectedItem === null && this.items.length > 0) {
            this.items[0].select();
        }
    }
    
    setSelectedItem(item) {
        this.selectedItem = item;
        this.updateButtonColors();
    }
    
    selectPreviousItem() {
        if (this.items.length <= 0) {
            return;
        }
        let index = this.findItem(this.selectedItem);
        index -= 1;
        if (index < 0) {
            index = this.items.length - 1;
        }
        const tempItem = this.items[index];
        tempItem.select();
    }
    
    selectNextItem() {
        if (this.items.length <= 0) {
            return;
        }
        let index = this.findItem(this.selectedItem);
        index += 1;
        if (index >= this.items.length) {
            index = 0;
        }
        const tempItem = this.items[index];
        tempItem.select();
    }
    
    hasRecipeComponent(recipeComponent) {
        let tempCount = 0;
        for (const item of this.items) {
            if (recipeComponent.spiritType.matchesSpirit(item.spirit)) {
                tempCount += item.count;
            }
        }
        return (tempCount >= recipeComponent.count);
    }
    
    canCraftRecipe(recipe) {
        for (const component of recipe.ingredients) {
            if (!this.hasRecipeComponent(component)) {
                return false;
            }
        }
        return true;
    }
    
    removeRecipeComponent(recipeComponent) {
        const output = [];
        let tempCount = recipeComponent.count;
        for (const item of this.items) {
            if (recipeComponent.spiritType.matchesSpirit(item.spirit)) {
                const tempResult = item.decreaseCount(tempCount);
                output.push(item.getInventoryUpdate());
                tempCount -= tempResult;
                if (tempCount <= 0) {
                    break;
                }
            }
        }
        return output;
    }
    
    addRecipeComponent(recipeComponent) {
        if (recipeComponent.spiritType instanceof SimpleSpiritType) {
            const tempSpirit = recipeComponent.spiritType.craft();
            this.increaseItemCountBySpirit(tempSpirit, recipeComponent.count);
            return [this.getInventoryUpdate(tempSpirit)];
        } else {
            const output = [];
            for (let count = 0; count < recipeComponent.count; count++) {
                const tempSpirit = recipeComponent.spiritType.craft();
                this.incrementItemCountBySpirit(tempSpirit);
                const tempUpdate = this.getInventoryUpdate(tempSpirit);
                output.push(tempUpdate);
            }
            return output;
        }
    }
    
    craftRecipe(recipe) {
        if (!this.canCraftRecipe(recipe)) {
            return;
        }
        const inventoryUpdateList = [];
        for (const component of recipe.ingredients) {
            const tempUpdateList = this.removeRecipeComponent(component);
            pushInventoryUpdates(inventoryUpdateList, tempUpdateList);
        }
        const tempUpdateList = this.addRecipeComponent(recipe.product);
        pushInventoryUpdates(inventoryUpdateList, tempUpdateList);
        addCraftCommand(recipe, inventoryUpdateList);
    }
    
    inspectSelectedItem() {
        if (this.selectedItem === null) {
            return;
        }
        const tempSpirit = this.selectedItem.spirit;
        inspectSpirit(tempSpirit);
    }
    
    transferSelectedItem(destinationInventory) {
        if (destinationInventory === null) {
            return;
        }
        if (this.selectedItem === null) {
            return;
        }
        const tempItem = this.selectedItem;
        const tempSpirit = tempItem.spirit;
        if (tempSpirit.id < 0) {
            return;
        }
        const tempCount = tempItem.decreaseCount(1);
        destinationInventory.increaseItemCountBySpirit(tempSpirit, tempCount);
        addTransferCommand(this, destinationInventory, tempSpirit);
    }
    
    recycleSelectedItem() {
        if (this.selectedItem === null) {
            return;
        }
        this.selectedItem.recycle();
    }
    
    updateButtonColor(buttonTagIdPrefix, isAvailable) {
        if (!(buttonTagIdPrefix in this.buttonTagMap)) {
            return;
        }
        const tempTag = this.buttonTagMap[buttonTagIdPrefix];
        if (isAvailable) {
            tempTag.className = "";
        } else {
            tempTag.className = "redButton";
        }
    }
    
    updateButtonColors() {
        if (this.selectedItem === null) {
            for (const key in this.buttonTagMap) {
                this.updateButtonColor(key, false);
            }
            return;
        }
        const tempSpirit = this.selectedItem.spirit;
        this.updateButtonColor("inspect", tempSpirit.canBeInspected());
        this.updateButtonColor("transfer", (inspectedMachineInventory !== null));
        this.updateButtonColor(
            "recycle",
            !(tempSpirit.spiritType instanceof ResourceSpiritType)
        );
        this.updateButtonColor("install", false);
    }
}

class InventoryUpdate {
    
    constructor(inventory, spirit, count) {
        this.inventory = inventory;
        this.spirit = spirit;
        this.count = count;
    }
    
    getClientJson(shouldUseReference = true) {
        const output = {
            parentSpiritId: this.inventory.parentSpiritId,
            count: this.count,
        };
        if (shouldUseReference) {
            const tempReference = this.spirit.getReference();
            output.spiritReference = tempReference.getJson();
        } else {
            throw new Error("Operation not supported.");
        }
        return output;
    }
    
    applyToInventory() {
        this.inventory.setItemCountBySpirit(this.spirit, this.count);
    }
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.substring(1, text.length);

const convertClientJsonToInventoryUpdate = (data) => {
    const tempInventory = parentSpiritInventoryMap[data.parentSpiritId];
    if (typeof tempInventory === "undefined") {
        return null;
    }
    let tempSpirit;
    if ("spirit" in data) {
        tempSpirit = convertClientJsonToSpirit(data.spirit);
    } else {
        const tempReference = convertJsonToSpiritReference(data.spiritReference);
        tempSpirit = tempReference.getCachedSpirit();
        if (tempSpirit === null) {
            return null;
        }
    }
    return new InventoryUpdate(tempInventory, tempSpirit, data.count);
};

const pushInventoryUpdate = (destination, update) => {
    for (let index = destination.length - 1; index >= 0; index--) {
        const tempUpdate = destination[index];
        if (tempUpdate.inventory === update.inventory
                && tempUpdate.spirit.hasSameIdentity(update.spirit)) {
            destination.splice(index, 1);
        }
    }
    destination.push(update);
};

const pushInventoryUpdates = (destination, updateList) => {
    for (const update of updateList) {
        pushInventoryUpdate(destination, update);
    }
};


