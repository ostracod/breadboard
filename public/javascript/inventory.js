
var inventoryPixelSize = 4;
var localPlayerInventory;

function InventoryItem(inventory, spirit, count) {
    var self = this;
    self.inventory = inventory;
    self.spirit = spirit;
    self.count = count;
    self.tag = document.createElement("div");
    self.tag.style.padding = "3px";
    self.tag.style.border = "2px #FFFFFF solid";
    self.tag.style.cursor = "pointer";
    self.tag.onclick = function() {
        self.select();
    }
    
    var tempCanvas = document.createElement("canvas");
    var tempSize = spriteSize * inventoryPixelSize;
    tempCanvas.width = tempSize;
    tempCanvas.height = tempSize;
    tempCanvas.style.width = tempSize / 2;
    tempCanvas.style.height = tempSize / 2;
    tempCanvas.style.marginRight = "8px";
    self.tag.appendChild(tempCanvas);
    var tempContext = tempCanvas.getContext("2d");
    var tempSprite = self.spirit.getSprite();
    tempSprite.draw(tempContext, new Pos(0, 0), inventoryPixelSize);
    
    var tempTag = document.createElement("strong");
    tempTag.innerHTML = self.spirit.getDisplayName();
    tempTag.style.marginRight = "5px";
    tempTag.style.verticalAlign = "4px";
    self.tag.appendChild(tempTag);
    
    self.countTag = document.createElement("span");
    self.countTag.style.verticalAlign = "4px";
    self.tag.appendChild(self.countTag);
    
    self.inventory.tag.appendChild(self.tag);
    self.updateTag();
    if (self.inventory.selectedItem === null) {
        self.select();
    }
}

InventoryItem.prototype.updateTag = function() {
    this.countTag.innerHTML = "(x" + this.count + ")";
}

InventoryItem.prototype.removeTag = function() {
    this.tag.parentNode.removeChild(this.tag);
}

InventoryItem.prototype.unselect = function() {
    this.tag.style.border = "2px #FFFFFF solid";
    this.inventory.selectedItem = null;
}

InventoryItem.prototype.select = function() {
    if (this.inventory.selectedItem !== null) {
        this.inventory.selectedItem.unselect();
    }
    this.tag.style.border = "2px #000000 solid";
    // TODO: Scroll inventory container to display item tag.
    
    this.inventory.selectedItem = this;
}

InventoryItem.prototype.setCount = function(count) {
    this.count = count;
    if (this.count > 0) {
        this.updateTag();
    } else {
        this.unselect();
        this.removeTag();
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


