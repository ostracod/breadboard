
import {simpleSpiritSerialIntegerSet, spiritColorAmount} from "./spirit.js";
import {simpleSpiritTypeMap} from "./spiritType.js";

export let recipeList = [];
export let recipeDataList = [];
let nextRecipeId = 0;

class RecipeComponent {
    
    constructor(spiritType, count) {
        this.spiritType = spiritType;
        this.count = count;
    }
    
    getClientJson() {
        return {
            spiritType: this.spiritType.getClientJson(),
            count: this.count
        };
    }
}

class Recipe {
    
    constructor(ingredients, product) {
        this.ingredients = ingredients;
        this.product = product;
        this.id = nextRecipeId;
        nextRecipeId += 1;
        recipeList.push(this);
        recipeDataList.push(this.getClientJson());
    }
    
    getClientJson() {
        let tempDataList = [];
        for (let ingredient of this.ingredients) {
            tempDataList.push(ingredient.getClientJson());
        }
        return {
            id: this.id,
            ingredients: tempDataList,
            product: this.product.getClientJson()
        };
    }
}

function createSimpleRecipeComponent(spiritKey, count, offset) {
    let tempInteger = simpleSpiritSerialIntegerSet[spiritKey];
    if (typeof offset !== "undefined") {
        tempInteger += offset;
    }
    let tempType = simpleSpiritTypeMap[tempInteger];
    return new RecipeComponent(tempType, count);
}

for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new Recipe(
        [createSimpleRecipeComponent("matterite", 2)],
        createSimpleRecipeComponent("block", 1, colorIndex)
    );
}

export function getRecipeById(id) {
    for (let recipe of recipeList) {
        if (recipe.id == id) {
            return recipe;
        }
    }
    return null;
}


