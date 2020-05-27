
import {simpleSpiritSerialIntegerSet, complexSpiritClassIdSet, spiritColorAmount, simpleSpiritTypeMap, complexSpiritTypeMap} from "./spiritType.js";

export let recipeList = [];
export let recipeDataList = [];
let nextRecipeId = 0;

class RecipeComponent {
    
    constructor(spiritType, count) {
        this.spiritType = spiritType;
        this.count = count;
    }
    
    getJson() {
        return {
            spiritType: this.spiritType.getJson(),
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
        recipeDataList.push(this.getJson());
    }
    
    getJson() {
        let tempDataList = [];
        for (let ingredient of this.ingredients) {
            tempDataList.push(ingredient.getJson());
        }
        return {
            id: this.id,
            ingredients: tempDataList,
            product: this.product.getJson()
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

function createMachineRecipeComponent(colorIndex) {
    let tempTypeList = complexSpiritTypeMap[complexSpiritClassIdSet.machine];
    for (let spiritType of tempTypeList) {
        if (spiritType.colorIndex === colorIndex) {
            return new RecipeComponent(spiritType, 1);
        }
    }
    return null;
}

for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new Recipe(
        [createSimpleRecipeComponent("matterite", 2)],
        createSimpleRecipeComponent("block", 1, colorIndex)
    );
    new Recipe(
        [
            createSimpleRecipeComponent("block", 1, colorIndex),
            createSimpleRecipeComponent("matterite", 1),
            createSimpleRecipeComponent("energite", 1)
        ],
        createMachineRecipeComponent(colorIndex)
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


