
import { recipeList, recipeDataList } from "./globalData.js";
import { RecipeComponentJson, RecipeJson } from "./interfaces.js";
import { SpiritType } from "./spiritType.js";

let nextRecipeId = 0;

export class RecipeComponent {
    
    spiritType: SpiritType;
    count: number;
    
    constructor(spiritType: SpiritType, count: number) {
        this.spiritType = spiritType;
        this.count = count;
    }
    
    getJson(): RecipeComponentJson {
        return {
            spiritType: this.spiritType.getJson(),
            count: this.count,
        };
    }
    
    scale(value: number): void {
        this.count *= value;
    }
}

export class Recipe {
    
    ingredients: RecipeComponent[];
    product: RecipeComponent;
    id: number;
    
    constructor(ingredients: RecipeComponent[], product: RecipeComponent) {
        this.ingredients = ingredients;
        this.product = product;
        this.id = nextRecipeId;
        nextRecipeId += 1;
        recipeList.push(this);
        recipeDataList.push(this.getJson());
    }
    
    getJson(): RecipeJson {
        const tempDataList = [];
        for (const ingredient of this.ingredients) {
            tempDataList.push(ingredient.getJson());
        }
        return {
            id: this.id,
            ingredients: tempDataList,
            product: this.product.getJson(),
        };
    }
}

export const pushRecipeComponent = (
    destination: RecipeComponent[],
    recipeComponent: RecipeComponent,
): void => {
    for (const tempComponent of destination) {
        if (tempComponent.spiritType === recipeComponent.spiritType) {
            tempComponent.count += recipeComponent.count;
            return;
        }
    }
    destination.push(recipeComponent);
};

export const getRecipeById = (id: number): Recipe => {
    for (const recipe of recipeList) {
        if (recipe.id === id) {
            return recipe;
        }
    }
    return null;
};


