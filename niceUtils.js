
function NiceUtils() {
    
}

NiceUtils.prototype.extendList = function(destination, valueList) {
    var index = 0;
    while (index < valueList.length) {
        var tempValue = valueList[index];
        destination.push(tempValue);
        index += 1;
    }
}

var niceUtils = new NiceUtils();

module.exports = {
    niceUtils: niceUtils
};


