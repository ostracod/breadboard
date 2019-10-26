
var localPlayerInventory;

function InventoryItem(spirit, count) {
    this.spirit = spirit;
    this.count = count;
    this.tag = document.createElement("div");
    var tempContainer = document.getElementById("playerInventoryItems");
    tempContainer.appendChild(this.tag);
    this.updateTag();
}

InventoryItem.prototype.updateTag = function() {
    this.tag.innerHTML = this.spirit.getDisplayName() + " x" + this.count;
}

function Inventory() {
    this.items = [];
}

Inventory.prototype.updateItemBySpirit = function(spirit, count) {
    var index = 0;
    while (index < this.items.length) {
        var tempItem = this.items[index];
        if (tempItem.spirit.hasSameIdentity(spirit)) {
            tempItem.count = count;
            tempItem.updateTag();
            return;
        }
        index += 1;
    }
    var tempItem = new InventoryItem(spirit, count);
    this.items.push(tempItem);
}

localPlayerInventory = new Inventory();


