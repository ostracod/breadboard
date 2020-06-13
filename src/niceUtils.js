
class NiceUtils {
    
    constructor() {
        
    }
    
    extendList(destination, valueList) {
        for (let value of valueList) {
            destination.push(value);
        }
    }
    
    reverseMap(valueMap) {
        let output = {};
        for (let key in valueMap) {
            let tempValue = valueMap[key];
            output[tempValue] = key;
        }
        return output;
    }
}

export let niceUtils = new NiceUtils();


