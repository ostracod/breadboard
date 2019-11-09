
var recipeList;

function RecipeComponent(spiritType, count) {
    this.spiritType = spiritType;
    this.count = count;
}

function Recipe(ingredients, product) {
    this.ingredients = ingredients;
    this.product = product;
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


