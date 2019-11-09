
var localPlayerInventory;

function InventoryItem(inventory, spirit, count) {
    this.inventory = inventory;
    this.spirit = spirit;
    this.count = count;
    this.row = new InventoryOptionRow(this);
    
    if (this.inventory.selectedItem === null) {
        this.select();
    }
}

InventoryItem.prototype.unselect = function() {
    this.row.unselect();
    this.inventory.selectedItem = null;
}

InventoryItem.prototype.select = function() {
    if (this.inventory.selectedItem !== null) {
        this.inventory.selectedItem.unselect();
    }
    this.row.select();
    this.inventory.selectedItem = this;
}

InventoryItem.prototype.setCount = function(count) {
    this.count = count;
    if (this.count > 0) {
        this.row.draw();
    } else {
        this.unselect();
        this.row.remove();
        this.inventory.removeItem(this);
    }
}

function Inventory(tag) {
    this.tag = tag;
    this.items = [];
    this.selectedItem = null;
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

Inventory.prototype.incrementItemCountBySpirit = function(spirit) {
    var tempItem = this.getItemBySpirit(spirit);
    if (tempItem === null) {
        tempItem = new InventoryItem(this, spirit, 1);
        this.items.push(tempItem);
    } else {
        tempItem.setCount(tempItem.count + 1);
    }
}

Inventory.prototype.setItemCountBySpirit = function(spirit, count) {
    var tempItem = this.getItemBySpirit(spirit);
    if (tempItem === null) {
        if (count > 0) {
            var tempItem = new InventoryItem(this, spirit, count);
            this.items.push(tempItem);
        }
    } else {
        tempItem.setCount(count);
    }
}

Inventory.prototype.removeItem = function(item) {
    var index = this.findItem(item);
    this.items.splice(index, 1);
    if (this.items.length > 0) {
        this.items[0].select();
    }
}

Inventory.prototype.selectPreviousItem = function() {
    if (this.items.length <= 0) {
        return;
    }
    var index = this.findItem(this.selectedItem);
    index -= 1;
    if (index < 0) {
        index = this.items.length - 1;
    }
    var tempItem = this.items[index];
    tempItem.select();
}

Inventory.prototype.selectNextItem = function() {
    if (this.items.length <= 0) {
        return;
    }
    var index = this.findItem(this.selectedItem);
    index += 1;
    if (index >= this.items.length) {
        index = 0;
    }
    var tempItem = this.items[index];
    tempItem.select();
}


