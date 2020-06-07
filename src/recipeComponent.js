
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
}


