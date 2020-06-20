
import ostracodMultiplayer from "ostracod-multiplayer";
let dbUtils = ostracodMultiplayer.dbUtils;

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
    
    performDbTransaction(operation) {
        return new Promise((resolve, reject) => {
            dbUtils.performTransaction(callback => {
                operation().then(callback);
            }, () => {
                resolve();
            });
        });
    }
    
    performConditionalDbTransaction(shouldPerformTransaction, operation) {
        if (shouldPerformTransaction) {
            return niceUtils.performDbTransaction(operation);
        } else {
            return operation();
        }
    }
    
    performDbQuery(query, parameterList) {
        return new Promise((resolve, reject) => {
            dbUtils.performQuery(query, parameterList, (error, results, fields) => {
                if (error) {
                    reject(dbUtils.convertSqlErrorToText(error));
                    return;
                }
                resolve(results);
            });
        });
    }
}

export let niceUtils = new NiceUtils();


