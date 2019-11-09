
var tempResource = require("./spirit");
var simpleSpiritSerialIntegerSet = tempResource.simpleSpiritSerialIntegerSet;
var spiritColorAmount = tempResource.spiritColorAmount;
var simpleSpiritTypeMap = require("./spiritType").simpleSpiritTypeMap;

var recipeList = [];
var recipeDataList = [];

function RecipeComponent(spiritType, count) {
    this.spiritType = spiritType;
    this.count = count;
}

RecipeComponent.prototype.getClientJson = function() {
    return {
        spiritType: this.spiritType.getClientJson(),
        count: this.count
    };
}

function Recipe(ingredients, product) {
    this.ingredients = ingredients;
    this.product = product;
    recipeList.push(this);
    recipeDataList.push(this.getClientJson());
}

Recipe.prototype.getClientJson = function() {
    var tempDataList = [];
    var index = 0;
    while (index < this.ingredients.length) {
        var tempIngredient = this.ingredients[index];
        tempDataList.push(tempIngredient.getClientJson());
        index += 1;
    }
    return {
        ingredients: tempDataList,
        product: this.product.getClientJson()
    };
}

function createSimpleRecipeComponent(spiritKey, count, offset) {
    var tempInteger = simpleSpiritSerialIntegerSet[spiritKey];
    if (typeof offset !== "undefined") {
        tempInteger += offset;
    }
    var tempType = simpleSpiritTypeMap[tempInteger];
    return new RecipeComponent(tempType, count);
}

var tempColorIndex = 0;
while (tempColorIndex < spiritColorAmount) {
    new Recipe(
        [createSimpleRecipeComponent("matterite", 2)],
        createSimpleRecipeComponent("block", 1, tempColorIndex)
    );
    tempColorIndex += 1;
}

module.exports = {
    recipeList: recipeList,
    recipeDataList: recipeDataList
};


