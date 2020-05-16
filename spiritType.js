
// Map from serial integer to SimpleSpiritType.
export let simpleSpiritTypeMap = {};

// A SpiritType serves the following purposes:
// > Identify whether a spirit instance matches particular criteria
// > Create new instances of spirits

class SpiritType {
    
    // Concrete subclasses of SpiritType must implement these methods:
    // matchesSpirit, getClientJson
    
    constructor() {
    
    }
    
    craft() {
        return null;
    }
}

export class SimpleSpiritType extends SpiritType {
    
    constructor(spirit) {
        super();
        this.spirit = spirit;
        simpleSpiritTypeMap[this.spirit.serialInteger] = this;
    }
    
    matchesSpirit(spirit) {
        return (this.spirit.serialInteger == spirit.serialInteger);
    }
    
    getClientJson() {
        return {
            type: "simple",
            serialInteger: this.spirit.serialInteger
        };
    }
    
    craft() {
        return this.spirit;
    }
}


