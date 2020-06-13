
let selectedRecipe = null;

class RecipeComponent {
    
    constructor(spiritType, count) {
        this.spiritType = spiritType;
        this.count = count;
        this.tag = null;
    }
}

class Recipe {
    
    constructor(id, ingredients, product) {
        this.id = id;
        this.ingredients = ingredients;
        this.product = product;
        this.row = null;
    }
    
    draw() {
        this.row = new RecipeOptionRow(this);
    }
    
    select() {
        if (selectedRecipe !== null) {
            selectedRecipe.unselect();
        }
        this.row.select();
        selectedRecipe = this;
        this.displayIngredients();
        localPlayerInventory.addObserver(this);
    }
    
    unselect() {
        this.row.unselect();
        selectedRecipe = null;
        localPlayerInventory.removeObserver(this);
    }
    
    inventoryChangeEvent(inventory, item) {
        if (this === selectedRecipe) {
            this.updateTagColors();
        }
    }
    
    displayIngredients() {
        document.getElementById("recipeSubtitle").innerHTML = "Ingredients:";
        document.getElementById("craftButtonContainer").style.display = "block";
        let tempContainer = document.getElementById("recipeIngredients");
        tempContainer.innerHTML = "";
        for (let component of this.ingredients) {
            let tempTag = document.createElement("div");
            tempTag.innerHTML = component.spiritType.getDisplayName() + " (x" + component.count + ")";
            tempContainer.appendChild(tempTag);
            component.tag = tempTag;
        }
        this.updateTagColors();
    }
    
    updateTagColors() {
        for (let component of this.ingredients) {
            let tempColor;
            if (localPlayerInventory.hasRecipeComponent(component)) {
                tempColor = "#000000";
            } else {
                tempColor = "#CC0000";
            }
            component.tag.style.color = tempColor;
        }
        let tempTag = document.getElementById("craftButton");
        if (localPlayerInventory.canCraftRecipe(this)) {
            tempTag.className = "";
        } else {
            tempTag.className = "redButton";
        }
    }
}

function convertJsonToRecipeComponent(data) {
    return new RecipeComponent(
        convertJsonToSpiritType(data.spiritType),
        data.count
    );
}

function convertJsonToRecipe(data) {
    let tempComponentList = [];
    for (let tempData of data.ingredients) {
        tempComponentList.push(convertJsonToRecipeComponent(tempData));
    }
    return new Recipe(
        data.id,
        tempComponentList,
        convertJsonToRecipeComponent(data.product)
    );
}

function drawAllRecipes() {
    for (let recipe of recipeList) {
        recipe.draw();
    }
}

function craftSelectedRecipe() {
    localPlayerInventory.craftRecipe(selectedRecipe);
}


