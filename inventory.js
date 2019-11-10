
var niceUtils = require("./niceUtils").niceUtils;

function InventoryItem(inventory, spirit, count) {
    this.inventory = inventory;
    this.spirit = spirit;
    this.count = count;
    this.inventory.items.push(this);
}

InventoryItem.prototype.getClientJson = function() {
    return {
        spirit: this.spirit.getClientJson(),
        count: this.count
    };
}

InventoryItem.prototype.setCount = function(count) {
    this.count = count;
    if (this.count <= 0) {
        this.inventory.removeItem(this);
    }
}

InventoryItem.prototype.decreaseCount = function(offset) {
    if (this.count >= offset) {
        this.setCount(this.count - offset);
        return offset;
    } else {
        var output = this.count;
        this.setCount(0);
        return output;
    }
}

function Inventory() {
    this.items = [];
}

Inventory.prototype.findItemBySpirit = function(spirit) {
    var index = 0;
    while (index < this.items.length) {
        var tempItem = this.items[index];
        if (tempItem.spirit.hasSameIdentity(spirit)) {
            return index;
        }
        index += 1;
    }
    return -1;
}

Inventory.prototype.findItem = function(item) {
    return this.findItemBySpirit(item.spirit);
}

Inventory.prototype.getItemBySpirit = function(spirit) {
    var index = this.findItemBySpirit(spirit);
    if (index >= 0) {
        return this.items[index];
    } else {
        return null;
    }
}

Inventory.prototype.findItemBySpiritReference = function(spiritReference) {
    var index = 0;
    while (index < this.items.length) {
        var tempItem = this.items[index];
        var tempReference = tempItem.spirit.getReference();
        if (tempReference.equals(spiritReference)) {
            return index;
        }
        index += 1;
    }
    return -1;
}

Inventory.prototype.getItemBySpiritReference = function(spiritReference) {
    var index = this.findItemBySpiritReference(spiritReference);
    if (index >= 0) {
        return this.items[index];
    } else {
        return null;
    }
}

Inventory.prototype.incrementItemCountBySpirit = function(spirit) {
    var tempItem = this.getItemBySpirit(spirit);
    if (tempItem === null) {
        tempItem = new InventoryItem(this, spirit, 1);
    } else {
        tempItem.setCount(tempItem.count + 1);
    }
    return tempItem;
}

Inventory.prototype.removeItem = function(item) {
    var index = this.findItem(item);
    this.items.splice(index, 1);
}

Inventory.prototype.hasRecipeComponent = function(recipeComponent) {
    var tempCount = 0;
    var index = 0;
    while (index < this.items.length) {
        var tempItem = this.items[index];
        if (recipeComponent.spiritType.matchesSpirit(tempItem.spirit)) {
            tempCount += tempItem.count;
        }
        index += 1;
    }
    return (tempCount >= recipeComponent.count);
}

Inventory.prototype.canCraftRecipe = function(recipe) {
    var index = 0;
    while (index < recipe.ingredients.length) {
        var tempComponent = recipe.ingredients[index];
        if (!this.hasRecipeComponent(tempComponent)) {
            return false;
        }
        index += 1;
    }
    return true;
}

Inventory.prototype.removeRecipeComponent = function(recipeComponent) {
    var output = [];
    var tempCount = recipeComponent.count;
    var index = 0;
    while (index < this.items.length) {
        var tempItem = this.items[index];
        if (recipeComponent.spiritType.matchesSpirit(tempItem.spirit)) {
            var tempResult = tempItem.decreaseCount(tempCount);
            output.push(tempItem);
            tempCount -= tempResult;
            if (tempCount <= 0) {
                break;
            }
        }
        index += 1;
    }
    return output;
}

Inventory.prototype.addRecipeComponent = function(recipeComponent) {
    var output = [];
    var tempCount = 0;
    while (tempCount < recipeComponent.count) {
        var tempSpirit = recipeComponent.spiritType.craft();
        var tempItem = this.incrementItemCountBySpirit(tempSpirit);
        if (output.indexOf(tempItem) < 0) {
            output.push(tempItem);
        }
        tempCount += 1;
    }
    return output;
}

Inventory.prototype.craftRecipe = function(recipe) {
    if (!this.canCraftRecipe(recipe)) {
        return [];
    }
    var output = [];
    var index = 0;
    while (index < recipe.ingredients.length) {
        var tempComponent = recipe.ingredients[index];
        var tempItemList = this.removeRecipeComponent(tempComponent);
        niceUtils.extendList(output, tempItemList);
        index += 1;
    }
    var tempItemList = this.addRecipeComponent(recipe.product);
    niceUtils.extendList(output, tempItemList);
    return output;
}

module.exports = {
    InventoryItem: InventoryItem,
    Inventory: Inventory
};


