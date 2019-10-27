
var inventoryPixelSize = 4;

var localPlayerInventory;

function InventoryItem(spirit, count) {
    this.spirit = spirit;
    this.count = count;
    this.tag = document.createElement("div");
    this.tag.style.padding = "5px";
    
    var tempCanvas = document.createElement("canvas");
    var tempSize = spriteSize * inventoryPixelSize;
    tempCanvas.width = tempSize;
    tempCanvas.height = tempSize;
    tempCanvas.style.width = tempSize / 2;
    tempCanvas.style.height = tempSize / 2;
    tempCanvas.style.marginRight = "8px";
    this.tag.appendChild(tempCanvas);
    var tempContext = tempCanvas.getContext("2d");
    var tempSprite = this.spirit.getSprite();
    tempSprite.draw(tempContext, new Pos(0, 0), inventoryPixelSize);
    
    var tempTag = document.createElement("strong");
    tempTag.innerHTML = this.spirit.getDisplayName();
    tempTag.style.marginRight = "5px";
    tempTag.style.verticalAlign = "4px";
    this.tag.appendChild(tempTag);
    
    this.countTag = document.createElement("span");
    this.countTag.style.verticalAlign = "4px";
    this.tag.appendChild(this.countTag);
    
    var tempContainer = document.getElementById("playerInventoryItems");
    tempContainer.appendChild(this.tag);
    this.updateTag();
}

InventoryItem.prototype.updateTag = function() {
    this.countTag.innerHTML = "(x" + this.count + ")";
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


