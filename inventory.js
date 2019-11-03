
function InventoryItem(inventory, spirit, count) {
    this.inventory = inventory;
    this.spirit = spirit;
    this.count = count;
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
        this.items.push(tempItem);
    } else {
        tempItem.setCount(tempItem.count + 1);
    }
    return tempItem;
}

Inventory.prototype.removeItem = function(item) {
    var index = this.findItem(item);
    this.items.splice(index, 1);
}

module.exports = {
    InventoryItem: InventoryItem,
    Inventory: Inventory
};


