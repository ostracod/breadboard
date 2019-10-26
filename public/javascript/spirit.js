
// Map from spirit serial integer to Spirit.
var simpleSpiritMap = {};

function Spirit() {
    
}

// Concrete subclasses of Spirit must implement these methods:
// getSprite, getDisplayName, hasSameIdentity

Spirit.prototype.canBeMined = function() {
    return false;
}

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
    simpleSpiritMap[this.getSerialInteger()] = this;
}

SimpleSpirit.prototype = Object.create(Spirit.prototype);
SimpleSpirit.prototype.constructor = SimpleSpirit;

// Concrete subclasses of SimpleSpirit must implement these methods:
// getSerialInteger

SimpleSpirit.prototype.hasSameIdentity = function(spirit) {
    if (!(spirit instanceof SimpleSpirit)) {
        return false;
    }
    return (this.getSerialInteger() == spirit.getSerialInteger());
}

function EmptySpirit() {
    SimpleSpirit.call(this);
}

EmptySpirit.prototype = Object.create(SimpleSpirit.prototype);
EmptySpirit.prototype.constructor = EmptySpirit;

EmptySpirit.prototype.getSprite = function() {
    return null;
}

EmptySpirit.prototype.getDisplayName = function() {
    return "Empty";
}

EmptySpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.empty;
}

function BarrierSpirit() {
    SimpleSpirit.call(this);
}

BarrierSpirit.prototype = Object.create(SimpleSpirit.prototype);
BarrierSpirit.prototype.constructor = BarrierSpirit;

BarrierSpirit.prototype.getSprite = function() {
    return barrierSprite;
}

BarrierSpirit.prototype.getDisplayName = function() {
    return "Barrier";
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

ResourceSpirit.prototype.canBeMined = function() {
    return true;
}

function MatteriteSpirit() {
    ResourceSpirit.call(this, 0);
}

MatteriteSpirit.prototype = Object.create(ResourceSpirit.prototype);
MatteriteSpirit.prototype.constructor = MatteriteSpirit;

MatteriteSpirit.prototype.getDisplayName = function() {
    return "Matterite";
}

MatteriteSpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.matterite;
}

function EnergiteSpirit() {
    ResourceSpirit.call(this, 1);
}

EnergiteSpirit.prototype = Object.create(ResourceSpirit.prototype);
EnergiteSpirit.prototype.constructor = EnergiteSpirit;

EnergiteSpirit.prototype.getDisplayName = function() {
    return "Energite";
}

EnergiteSpirit.prototype.getSerialInteger = function() {
    return simpleSpiritSerialIntegerSet.energite;
}

var emptySpirit = new EmptySpirit();
var barrierSpirit = new BarrierSpirit();
var matteriteSpirit = new MatteriteSpirit();
var energiteSpirit = new EnergiteSpirit();

function ComplexSpirit(id) {
    Spirit.call(this);
    this.id = id;
}

ComplexSpirit.prototype = Object.create(Spirit.prototype);
ComplexSpirit.prototype.constructor = ComplexSpirit;

ComplexSpirit.prototype.hasSameIdentity = function(spirit) {
    if (!(spirit instanceof ComplexSpirit)) {
        return false;
    }
    return (this.id === spirit.id);
}

function PlayerSpirit(id, username) {
    ComplexSpirit.call(this, id);
    this.username = username;
}

PlayerSpirit.prototype = Object.create(ComplexSpirit.prototype);
PlayerSpirit.prototype.constructor = PlayerSpirit;

PlayerSpirit.prototype.getSprite = function() {
    return playerSprite;
}

PlayerSpirit.prototype.getDisplayName = function() {
    return this.username;
}


