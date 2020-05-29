
class OptionRow {
    
    constructor(parentTag, text, sprite) {
        this.parentTag = parentTag;
        this.tag = document.createElement("div");
        this.tag.style.padding = "3px";
        this.tag.style.border = "2px #FFFFFF solid";
        this.tag.style.cursor = "pointer";
        this.tag.onclick = () => {
            this.clickEvent();
        }
        
        if (typeof sprite !== "undefined") {
            let tempCanvas = sprite.createCanvas(this.tag, 4);
            tempCanvas.style.marginRight = "8px";
        }
        
        this.textTag = document.createElement("strong");
        this.textTag.innerHTML = text;
        this.textTag.style.verticalAlign = "4px";
        this.tag.appendChild(this.textTag);
        
        this.parentTag.appendChild(this.tag);
    }
    
    displayText(text) {
        this.textTag.innerHTML = text;
    }
    
    clickEvent() {
        // Do nothing.
    }
    
    unselect() {
        this.tag.style.border = "2px #FFFFFF solid";
    }
    
    select() {
        this.tag.style.border = "2px #000000 solid";
        // TODO: Scroll container to display row.
        
    }
    
    remove() {
        this.parentTag.removeChild(this.tag);
    }
}

class CountOptionRow extends OptionRow {
    
    constructor(parentTag, text, count, sprite) {
        super(parentTag, text, sprite);
        this.countTag = document.createElement("span");
        this.countTag.style.marginLeft = "5px";
        this.countTag.style.verticalAlign = "4px";
        this.tag.appendChild(this.countTag);
        this.displayCount(count);
    }
    
    displayCount(count) {
        this.countTag.innerHTML = "(x" + count + ")";
    }
}

class InventoryOptionRow extends CountOptionRow {
    
    constructor(inventoryItem) {
        let tempSpirit = inventoryItem.spirit;
        super(inventoryItem.inventory.tag, "", 0, tempSpirit.getSprite());
        this.inventoryItem = inventoryItem;
        this.spirit = tempSpirit;
        this.draw();
    }
    
    clickEvent() {
        this.inventoryItem.select();
    }
    
    draw() {
        this.displayText(this.spirit.getDisplayName());
        this.displayCount(this.inventoryItem.count);
    }
}

class RecipeOptionRow extends OptionRow {
    
    constructor(recipe) {
        let tempSpiritType = recipe.product.spiritType;
        super(
            document.getElementById("recipes"),
            tempSpiritType.getDisplayName(),
            tempSpiritType.getSprite()
        );
        this.recipe = recipe;
    }
    
    clickEvent() {
        this.recipe.select();
    }
}


