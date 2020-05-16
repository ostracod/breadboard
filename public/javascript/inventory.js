
let localPlayerInventory;

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
        if (this.count > 0) {
            this.inventory.changeEvent();
        }
    }
    
    unselect() {
        this.row.unselect();
        this.inventory.selectedItem = null;
    }
    
    select() {
        if (this.inventory.selectedItem !== null) {
            this.inventory.selectedItem.unselect();
        }
        this.row.select();
        this.inventory.selectedItem = this;
    }
    
    setCount(count) {
        if (count == this.count) {
            return;
        }
        this.count = count;
        if (this.count > 0) {
            this.row.draw();
        } else {
            this.unselect();
            this.row.remove();
            this.inventory.removeItem(this);
        }
        this.inventory.changeEvent();
    }
    
    decreaseCount(offset) {
        if (this.count >= offset) {
            this.setCount(this.count - offset);
            return offset;
        } else {
            let output = this.count;
            this.setCount(0);
            return output;
        }
    }
}

class Inventory {
    
    constructor(tag) {
        this.tag = tag;
        this.items = [];
        this.selectedItem = null;
    }
    
    findItemBySpirit(spirit) {
        for (let index = 0; index < this.items.length; index++) {
            let tempItem = this.items[index];
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
        let index = this.findItemBySpirit(spirit);
        if (index >= 0) {
            return this.items[index];
        } else {
            return null;
        }
    }
    
    incrementItemCountBySpirit(spirit) {
        let tempItem = this.getItemBySpirit(spirit);
        if (tempItem === null) {
            new InventoryItem(this, spirit, 1);
        } else {
            tempItem.setCount(tempItem.count + 1);
        }
    }
    
    setItemCountBySpirit(spirit, count) {
        let tempItem = this.getItemBySpirit(spirit);
        if (tempItem === null) {
            if (count > 0) {
                new InventoryItem(this, spirit, count);
            }
        } else {
            tempItem.setCount(count);
        }
    }
    
    removeItem(item) {
        let index = this.findItem(item);
        this.items.splice(index, 1);
        if (this.items.length > 0) {
            this.items[0].select();
        }
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
        let tempItem = this.items[index];
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
        let tempItem = this.items[index];
        tempItem.select();
    }
    
    changeEvent() {
        if (this === localPlayerInventory && selectedRecipe !== null) {
            selectedRecipe.updateTagColors();
        }
    }
    
    hasRecipeComponent(recipeComponent) {
        let tempCount = 0;
        for (let item of this.items) {
            if (recipeComponent.spiritType.matchesSpirit(item.spirit)) {
                tempCount += item.count;
            }
        }
        return (tempCount >= recipeComponent.count);
    }
    
    canCraftRecipe(recipe) {
        for (let component of recipe.ingredients) {
            if (!this.hasRecipeComponent(component)) {
                return false;
            }
        }
        return true;
    }
    
    removeRecipeComponent(recipeComponent) {
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
    
    addRecipeComponent(recipeComponent) {
        for (let count = 0; count < recipeComponent.count; count++) {
            let tempSpirit = recipeComponent.spiritType.craft();
            this.incrementItemCountBySpirit(tempSpirit);
        }
    }
    
    craftRecipe(recipe) {
        if (!this.canCraftRecipe(recipe)) {
            return;
        }
        for (let component of recipe.ingredients) {
            this.removeRecipeComponent(component);
        }
        this.addRecipeComponent(recipe.product);
        addCraftCommand(recipe);
    }
}


