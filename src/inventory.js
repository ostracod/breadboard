
import {niceUtils} from "./niceUtils.js";

export class InventoryItem {
    
    constructor(inventory, spirit, count) {
        this.inventory = inventory;
        this.spirit = spirit;
        this.count = count;
        this.inventory.items.push(this);
    }
    
    getClientJson() {
        return {
            spirit: this.spirit.getClientJson(),
            count: this.count
        };
    }
    
    setCount(count) {
        this.count = count;
        if (this.count <= 0) {
            this.inventory.removeItem(this);
        }
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

export class Inventory {
    
    constructor() {
        this.items = [];
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
    
    findItemBySpiritReference(spiritReference) {
        for (let index = 0; index < this.items.length; index++) {
            let tempItem = this.items[index];
            let tempReference = tempItem.spirit.getReference();
            if (tempReference.equals(spiritReference)) {
                return index;
            }
        }
        return -1;
    }
    
    getItemBySpiritReference(spiritReference) {
        let index = this.findItemBySpiritReference(spiritReference);
        if (index >= 0) {
            return this.items[index];
        } else {
            return null;
        }
    }
    
    incrementItemCountBySpirit(spirit) {
        let tempItem = this.getItemBySpirit(spirit);
        if (tempItem === null) {
            tempItem = new InventoryItem(this, spirit, 1);
        } else {
            tempItem.setCount(tempItem.count + 1);
        }
        return tempItem;
    }
    
    removeItem(item) {
        let index = this.findItem(item);
        this.items.splice(index, 1);
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
        let output = [];
        let tempCount = recipeComponent.count;
        for (let item of this.items) {
            if (recipeComponent.spiritType.matchesSpirit(item.spirit)) {
                let tempResult = item.decreaseCount(tempCount);
                output.push(item);
                tempCount -= tempResult;
                if (tempCount <= 0) {
                    break;
                }
            }
        }
        return output;
    }
    
    addRecipeComponent(recipeComponent) {
        let output = [];
        for (let count = 0; count < recipeComponent.count; count++) {
            let tempSpirit = recipeComponent.spiritType.craft();
            let tempItem = this.incrementItemCountBySpirit(tempSpirit);
            if (output.indexOf(tempItem) < 0) {
                output.push(tempItem);
            }
        }
        return output;
    }
    
    craftRecipe(recipe) {
        if (!this.canCraftRecipe(recipe)) {
            return [];
        }
        let output = [];
        for (let component of recipe.ingredients) {
            let tempItemList = this.removeRecipeComponent(component);
            niceUtils.extendList(output, tempItemList);
        }
        let tempItemList = this.addRecipeComponent(recipe.product);
        niceUtils.extendList(output, tempItemList);
        return output;
    }
}


