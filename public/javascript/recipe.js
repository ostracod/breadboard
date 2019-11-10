
var recipeList;
var selectedRecipe = null;

function RecipeComponent(spiritType, count) {
    this.spiritType = spiritType;
    this.count = count;
    this.spirit = this.spiritType.craft();
    this.tag = null;
}

function Recipe(id, ingredients, product) {
    this.id = id;
    this.ingredients = ingredients;
    this.product = product;
    this.row = null;
}

Recipe.prototype.draw = function() {
    this.row = new RecipeOptionRow(this);
}

Recipe.prototype.select = function() {
    if (selectedRecipe !== null) {
        selectedRecipe.unselect();
    }
    this.row.select();
    selectedRecipe = this;
    this.displayIngredients();
}

Recipe.prototype.unselect = function() {
    this.row.unselect();
    selectedRecipe = null;
}

Recipe.prototype.displayIngredients = function() {
    document.getElementById("recipeSubtitle").innerHTML = "Ingredients:";
    document.getElementById("craftButtonContainer").style.display = "block";
    var tempContainer = document.getElementById("recipeIngredients");
    tempContainer.innerHTML = "";
    var index = 0;
    while (index < this.ingredients.length) {
        var tempComponent = this.ingredients[index];
        var tempTag = document.createElement("div");
        tempTag.innerHTML = tempComponent.spirit.getDisplayName() + " (x" + tempComponent.count + ")";
        tempContainer.appendChild(tempTag);
        tempComponent.tag = tempTag;
        index += 1;
    }
    this.updateTagColors();
}

Recipe.prototype.updateTagColors = function() {
    var index = 0;
    while (index < this.ingredients.length) {
        var tempComponent = this.ingredients[index];
        var tempColor;
        if (localPlayerInventory.hasRecipeComponent(tempComponent)) {
            tempColor = "#000000";
        } else {
            tempColor = "#CC0000";
        }
        tempComponent.tag.style.color = tempColor;
        index += 1;
    }
    var tempTag = document.getElementById("craftButton");
    if (localPlayerInventory.canCraftRecipe(this)) {
        tempTag.className = "";
    } else {
        tempTag.className = "redButton";
    }
}

function convertJsonToRecipeComponent(data) {
    return new RecipeComponent(
        convertJsonToSpiritType(data.spiritType),
        data.count
    );
}

function convertJsonToRecipe(data) {
    var tempComponentList = [];
    var index = 0;
    while (index < data.ingredients.length) {
        var tempData = data.ingredients[index];
        tempComponentList.push(convertJsonToRecipeComponent(tempData));
        index += 1;
    }
    return new Recipe(
        data.id,
        tempComponentList,
        convertJsonToRecipeComponent(data.product)
    );
}

recipeList = [];
var index = 0;
while (index < recipeDataList.length) {
    var tempRecipe = convertJsonToRecipe(recipeDataList[index]);
    recipeList.push(tempRecipe);
    index += 1;
}

function drawAllRecipes() {
    var index = 0;
    while (index < recipeList.length) {
        var tempRecipe = recipeList[index];
        tempRecipe.draw();
        index += 1;
    }
}

function craftSelectedRecipe() {
    localPlayerInventory.craftRecipe(selectedRecipe);
}


