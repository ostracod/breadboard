
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

export function pushRecipeComponent(destination, recipeComponent) {
    for (let tempComponent of destination) {
        if (tempComponent.spiritType === recipeComponent.spiritType) {
            tempComponent.count += recipeComponent.count;
            return;
        }
    }
    destination.push(recipeComponent);
}


