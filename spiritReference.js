
function SpiritReference() {
    
}

// Concrete subclasses of SpiritReference must implement these methods:
// equals

function SimpleSpiritReference(serialInteger) {
    SpiritReference.call(this);
    this.serialInteger = serialInteger;
}

SimpleSpiritReference.prototype = Object.create(SpiritReference.prototype);
SimpleSpiritReference.prototype.constructor = SimpleSpiritReference;

SimpleSpiritReference.prototype.equals = function(spiritReference) {
    if (!(spiritReference instanceof SimpleSpiritReference)) {
        return false;
    }
    return (this.serialInteger == spiritReference.serialInteger);
}

function ComplexSpiritReference(id) {
    SpiritReference.call(this);
    this.id = id;
}

ComplexSpiritReference.prototype = Object.create(SpiritReference.prototype);
ComplexSpiritReference.prototype.constructor = ComplexSpiritReference;

ComplexSpiritReference.prototype.equals = function(spiritReference) {
    if (!(spiritReference instanceof ComplexSpiritReference)) {
        return false;
    }
    return (this.id === spiritReference.id);
}

function convertJsonToSpiritReference(data) {
    if (typeof data === "number") {
        return new SimpleSpiritReference(data);
    } else {
        return new ComplexSpiritReference(data.id);
    }
}

module.exports = {
    SimpleSpiritReference: SimpleSpiritReference,
    ComplexSpiritReference: ComplexSpiritReference,
    convertJsonToSpiritReference: convertJsonToSpiritReference
};


