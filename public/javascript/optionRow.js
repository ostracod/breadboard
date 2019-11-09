
function OptionRow(parentTag, text, sprite) {
    var self = this;
    self.parentTag = parentTag;
    self.tag = document.createElement("div");
    self.tag.style.padding = "3px";
    self.tag.style.border = "2px #FFFFFF solid";
    self.tag.style.cursor = "pointer";
    self.tag.onclick = function() {
        self.clickEvent();
    }
    
    if (typeof sprite !== "undefined") {
        var tempCanvas = sprite.createCanvas(self.tag, 4);
        tempCanvas.style.marginRight = "8px";
    }
    
    var tempTag = document.createElement("strong");
    tempTag.innerHTML = text;
    tempTag.style.verticalAlign = "4px";
    self.tag.appendChild(tempTag);
    
    self.parentTag.appendChild(self.tag);
}

OptionRow.prototype.clickEvent = function() {
    // Do nothing.
}

OptionRow.prototype.unselect = function() {
    this.tag.style.border = "2px #FFFFFF solid";
}

OptionRow.prototype.select = function() {
    this.tag.style.border = "2px #000000 solid";
    // TODO: Scroll container to display row.
    
}

OptionRow.prototype.remove = function() {
    this.parentTag.removeChild(this.tag);
}

function CountOptionRow(parentTag, text, count, sprite) {
    OptionRow.call(this, parentTag, text, sprite);
    this.countTag = document.createElement("span");
    this.countTag.style.marginLeft = "5px";
    this.countTag.style.verticalAlign = "4px";
    this.tag.appendChild(this.countTag);
    this.displayCount(count);
}

CountOptionRow.prototype = Object.create(OptionRow.prototype);
CountOptionRow.prototype.constructor = CountOptionRow;

CountOptionRow.prototype.displayCount = function(count) {
    this.countTag.innerHTML = "(x" + count + ")";
}

function InventoryOptionRow(inventoryItem) {
    this.inventoryItem = inventoryItem;
    var tempSpirit = this.inventoryItem.spirit;
    CountOptionRow.call(
        this,
        this.inventoryItem.inventory.tag,
        tempSpirit.getDisplayName(),
        this.inventoryItem.count,
        tempSpirit.getSprite()
    );
}

InventoryOptionRow.prototype = Object.create(CountOptionRow.prototype);
InventoryOptionRow.prototype.constructor = InventoryOptionRow;

InventoryOptionRow.prototype.clickEvent = function() {
    this.inventoryItem.select();
}

InventoryOptionRow.prototype.draw = function() {
    this.displayCount(this.inventoryItem.count);
}


