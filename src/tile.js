
import {emptySpirit} from "./spirit.js";

export class Tile {
    
    // Concrete subclasses of Tile must implement these methods:
    // getClientJson
    
    constructor(spirit) {
        this.spirit = spirit;
    }
    
    getDbJson() {
        let output = this.spirit.getNestedDbJson();
        if (output === null) {
            return emptySpirit.getNestedDbJson();
        } else {
            return output;
        }
    }
}


