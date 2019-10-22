
function Spirit() {
    
}

// Concrete subclasses of Spirit must implement these methods:
// getSprite

function LoadingSpirit() {
    Spirit.call(this);
}

LoadingSpirit.prototype = Object.create(Spirit.prototype);
LoadingSpirit.prototype.constructor = LoadingSpirit;

var loadingSpirit = new LoadingSpirit();

LoadingSpirit.prototype.getSprite = function() {
    return loadingSprite;
}

function SimpleSpirit() {
    Spirit.call(this);
}

SimpleSpirit.prototype = Object.create(Spirit.prototype);
SimpleSpirit.prototype.constructor = SimpleSpirit;

// Concrete subclasses of SimpleSpirit must implement these methods:
// getSerialInteger

function EmptySpirit() {
    SimpleSpirit.call(this);
}

EmptySpirit.prototype = Object.create(SimpleSpirit.prototype);
EmptySpirit.prototype.constructor = EmptySpirit;

var emptySpirit = new EmptySpirit();

EmptySpirit.prototype.getSprite = function() {
    return null;
}

EmptySpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.empty;
}

function BarrierSpirit() {
    SimpleSpirit.call(this);
}

BarrierSpirit.prototype = Object.create(SimpleSpirit.prototype);
BarrierSpirit.prototype.constructor = BarrierSpirit;

var barrierSpirit = new BarrierSpirit();

BarrierSpirit.prototype.getSprite = function() {
    return barrierSprite;
}

BarrierSpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.barrier;
}

function ResourceSpirit(paletteIndex) {
    SimpleSpirit.call(this);
    this.sprite = new Sprite(resourceSpriteSet, 0, paletteIndex);
}

ResourceSpirit.prototype = Object.create(SimpleSpirit.prototype);
ResourceSpirit.prototype.constructor = ResourceSpirit;

ResourceSpirit.prototype.getSprite = function() {
    return this.sprite;
}

function MatteriteSpirit() {
    ResourceSpirit.call(this, 0);
}

MatteriteSpirit.prototype = Object.create(ResourceSpirit.prototype);
MatteriteSpirit.prototype.constructor = MatteriteSpirit;

var matteriteSpirit = new MatteriteSpirit();

MatteriteSpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.matterite;
}

function EnergiteSpirit() {
    ResourceSpirit.call(this, 1);
}

EnergiteSpirit.prototype = Object.create(ResourceSpirit.prototype);
EnergiteSpirit.prototype.constructor = EnergiteSpirit;

var energiteSpirit = new EnergiteSpirit();

EnergiteSpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.energite;
}

function ComplexSpirit() {
    Spirit.call(this);
}

ComplexSpirit.prototype = Object.create(Spirit.prototype);
ComplexSpirit.prototype.constructor = ComplexSpirit;

function PlayerSpirit(username) {
    ComplexSpirit.call(this);
    this.username = username;
}

PlayerSpirit.prototype = Object.create(ComplexSpirit.prototype);
PlayerSpirit.prototype.constructor = PlayerSpirit;

PlayerSpirit.prototype.getSprite = function() {
    return playerSprite;
}


