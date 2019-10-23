
var simpleSpiritSerialIntegerSet = {
    empty: 0,
    barrier: 1,
    matterite: 2,
    energite: 3
};

var complexSpiritClassIdSet = {
    player: 0
};

// The idea is that a Spirit is something which may
// exist as a Tile or Item.
// A SimpleSpirit holds no state, and may be
// serialized as a single integer.
// A ComplexSpirit holds custom state, and must
// be serialized as a JSON dictionary.

function Spirit() {
    
}

// Concrete subclasses of Spirit must implement these methods:
// getClientJson

Spirit.prototype.canBeMined = function() {
    return false;
}

function SimpleSpirit() {
    Spirit.call(this);
}

SimpleSpirit.prototype = Object.create(Spirit.prototype);
SimpleSpirit.prototype.constructor = SimpleSpirit;

// Concrete subclasses of SimpleSpirit must implement these methods:
// getSerialInteger

SimpleSpirit.prototype.getClientJson = function() {
    return this.getSerialInteger();
}

function EmptySpirit() {
    SimpleSpirit.call(this);
}

EmptySpirit.prototype = Object.create(SimpleSpirit.prototype);
EmptySpirit.prototype.constructor = EmptySpirit;

var emptySpirit = new EmptySpirit();

EmptySpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.empty;
}

function BarrierSpirit() {
    SimpleSpirit.call(this);
}

BarrierSpirit.prototype = Object.create(SimpleSpirit.prototype);
BarrierSpirit.prototype.constructor = BarrierSpirit;

var barrierSpirit = new BarrierSpirit();

BarrierSpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.barrier;
}

function ResourceSpirit() {
    SimpleSpirit.call(this);
}

ResourceSpirit.prototype = Object.create(SimpleSpirit.prototype);
ResourceSpirit.prototype.constructor = ResourceSpirit;

ResourceSpirit.prototype.canBeMined = function() {
    return true;
}

function MatteriteSpirit() {
    ResourceSpirit.call(this);
}

MatteriteSpirit.prototype = Object.create(ResourceSpirit.prototype);
MatteriteSpirit.prototype.constructor = MatteriteSpirit;

var matteriteSpirit = new MatteriteSpirit();

MatteriteSpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.matterite;
}

function EnergiteSpirit() {
    ResourceSpirit.call(this);
}

EnergiteSpirit.prototype = Object.create(ResourceSpirit.prototype);
EnergiteSpirit.prototype.constructor = EnergiteSpirit;

var energiteSpirit = new EnergiteSpirit();

EnergiteSpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.energite;
}

function ComplexSpirit(classId) {
    Spirit.call(this);
    this.classId = classId;
}

ComplexSpirit.prototype = Object.create(Spirit.prototype);
ComplexSpirit.prototype.constructor = ComplexSpirit;

ComplexSpirit.prototype.getClientJson = function() {
    return {
        classId: this.classId
    };
}

function PlayerSpirit(player) {
    ComplexSpirit.call(this, complexSpiritClassIdSet.player);
    this.player = player;
}

PlayerSpirit.prototype = Object.create(ComplexSpirit.prototype);
PlayerSpirit.prototype.constructor = PlayerSpirit;

PlayerSpirit.prototype.getClientJson = function() {
    var output = ComplexSpirit.prototype.getClientJson.call(this);
    output.username = this.player.username;
    return output;
}

module.exports = {
    simpleSpiritSerialIntegerSet: simpleSpiritSerialIntegerSet,
    complexSpiritClassIdSet: complexSpiritClassIdSet,
    
    EmptySpirit: EmptySpirit,
    BarrierSpirit: BarrierSpirit,
    MatteriteSpirit: MatteriteSpirit,
    EnergiteSpirit: EnergiteSpirit,
    PlayerSpirit: PlayerSpirit,
    
    emptySpirit: emptySpirit,
    barrierSpirit: barrierSpirit,
    matteriteSpirit: matteriteSpirit,
    energiteSpirit: energiteSpirit
};


