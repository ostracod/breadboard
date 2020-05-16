
class NiceUtils {
    
    constructor() {
        
    }
    
    extendList(destination, valueList) {
        for (let value of valueList) {
            destination.push(value);
        }
    }
}

export let niceUtils = new NiceUtils();


