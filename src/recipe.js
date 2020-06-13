
import {recipeList, recipeDataList} from "./globalData.js";

let nextRecipeId = 0;

export class RecipeComponent {
    
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
    
    scale(value) {
        this.count *= value;
    }
}

export class Recipe {
    
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

export function pushRecipeComponent(destination, recipeComponent) {
    for (let tempComponent of destination) {
        if (tempComponent.spiritType === recipeComponent.spiritType) {
            tempComponent.count += recipeComponent.count;
            return;
        }
    }
    destination.push(recipeComponent);
}

export function getRecipeById(id) {
    for (let recipe of recipeList) {
        if (recipe.id == id) {
            return recipe;
        }
    }
    return null;
}


