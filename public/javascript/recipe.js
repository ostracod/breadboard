
var recipeList;

function RecipeComponent(spiritType, count) {
    this.spiritType = spiritType;
    this.count = count;
    this.spirit = this.spiritType.craft();
}

function Recipe(ingredients, product) {
    this.ingredients = ingredients;
    this.product = product;
    this.row = null;
}

Recipe.prototype.draw = function() {
    var tempSpirit = this.product.spirit;
    this.row = new CountOptionRow(
        document.getElementById("recipes"),
        tempSpirit.getDisplayName(),
        this.product.count,
        tempSpirit.getSprite()
    );
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


