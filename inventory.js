
function InventoryItem(spirit) {
    this.spirit = spirit;
    this.count = 1;
}

InventoryItem.prototype.getClientJson = function() {
    return {
        spirit: this.spirit.getClientJson(),
        count: this.count
    };
}

function Inventory() {
    this.items = [];
}

Inventory.prototype.addItemBySpirit = function(spirit) {
    var index = 0;
    while (index < this.items.length) {
        var tempItem = this.items[index];
        if (tempItem.spirit.hasSameIdentity(spirit)) {
            tempItem.count += 1;
            return tempItem;
        }
        index += 1;
    }
    var tempItem = new InventoryItem(spirit);
    this.items.push(tempItem);
    return tempItem;
}

module.exports = {
    InventoryItem: InventoryItem,
    Inventory: Inventory
};


