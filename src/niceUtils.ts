
import ostracodMultiplayer from "ostracod-multiplayer";
let dbUtils = ostracodMultiplayer.dbUtils;

class NiceUtils {
    
    constructor() {
        
    }
    
    extendList(destination: any[], valueList: any[]): void {
        for (let value of valueList) {
            destination.push(value);
        }
    }
    
    reverseMap(valueMap: {[key: string]: any}): {[key: string]: any} {
        let output = {};
        for (let key in valueMap) {
            let tempValue = valueMap[key];
            output[tempValue] = key;
        }
        return output;
    }
    
    performDbTransaction(operation: () => Promise<void>): Promise<void> {
        return new Promise((resolve, reject) => {
            dbUtils.performTransaction(callback => {
                operation().then(callback);
            }, () => {
                resolve();
            });
        });
    }
    
    performConditionalDbTransaction(
        shouldPerformTransaction: boolean,
        operation: () => Promise<void>
    ): Promise<void> {
        if (shouldPerformTransaction) {
            return niceUtils.performDbTransaction(operation);
        } else {
            return operation();
        }
    }
    
    performDbQuery(query: string, parameterList: (string | number)[]): Promise<any> {
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


