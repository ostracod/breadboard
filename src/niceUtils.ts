
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
    
    async performConditionalDbTransaction(
        shouldPerformTransaction: boolean,
        operation: () => Promise<void>
    ): Promise<void> {
        if (shouldPerformTransaction) {
            await dbUtils.performTransaction(operation);
        } else {
            await operation();
        }
    }
    
    async performDbQuery(query: string, parameterList: (string | number)[]): Promise<any> {
        const [error, results, fields] = await dbUtils.performQuery(query, parameterList);
        if (error) {
            throw dbUtils.convertSqlErrorToText(error);
        }
        return results;
    }
}

export const niceUtils = new NiceUtils();


