
import ostracodMultiplayer from "ostracod-multiplayer";
const { dbUtils } = ostracodMultiplayer;

class NiceUtils {
    
    constructor() {
        
    }
    
    extendList(destination: any[], valueList: any[]): void {
        for (const value of valueList) {
            destination.push(value);
        }
    }
    
    reverseMap(valueMap: {[key: string]: any}): {[key: string]: any} {
        const output = {};
        for (const key in valueMap) {
            const tempValue = valueMap[key];
            output[tempValue] = key;
        }
        return output;
    }
    
    performDbTransaction(operation: () => Promise<void>): Promise<void> {
        return new Promise((resolve, reject) => {
            dbUtils.performTransaction((callback) => {
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

export const niceUtils = new NiceUtils();


