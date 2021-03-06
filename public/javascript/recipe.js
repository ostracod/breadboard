
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
        const tempContainer = document.getElementById("recipeIngredients");
        tempContainer.innerHTML = "";
        for (const component of this.ingredients) {
            const tempTag = document.createElement("div");
            tempTag.innerHTML = component.spiritType.getDisplayName() + " (x" + component.count + ")";
            tempContainer.appendChild(tempTag);
            component.tag = tempTag;
        }
        this.updateTagColors();
    }
    
    updateTagColors() {
        for (const component of this.ingredients) {
            let tempColor;
            if (localPlayerInventory.hasRecipeComponent(component)) {
                tempColor = "#000000";
            } else {
                tempColor = "#CC0000";
            }
            component.tag.style.color = tempColor;
        }
        const tempTag = document.getElementById("craftButton");
        if (localPlayerInventory.canCraftRecipe(this)) {
            tempTag.className = "";
        } else {
            tempTag.className = "redButton";
        }
    }
}

const convertJsonToRecipeComponent = (data) => (
    new RecipeComponent(
        convertJsonToSpiritType(data.spiritType),
        data.count
    )
);

const convertJsonToRecipe = (data) => {
    const tempComponentList = [];
    for (const tempData of data.ingredients) {
        tempComponentList.push(convertJsonToRecipeComponent(tempData));
    }
    return new Recipe(
        data.id,
        tempComponentList,
        convertJsonToRecipeComponent(data.product)
    );
};

const drawAllRecipes = () => {
    for (const recipe of recipeList) {
        recipe.draw();
    }
};

const craftSelectedRecipe = () => {
    localPlayerInventory.craftRecipe(selectedRecipe);
};


