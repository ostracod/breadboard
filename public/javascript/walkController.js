
function createDefaultWalkController() {
    return new WalkController(new Pos(0, 0), 0, 0);
}

function convertJsonToWalkController(data) {
    if (data === null) {
        return createDefaultWalkController();
    }
    return new WalkController(
        createPosFromJson(data.offset),
        data.delay,
        data.repeatDelay
    );
}

function WalkController(offset, delay, repeatDelay) {
    this.offset = offset;
    this.delay = delay;
    this.repeatDelay = repeatDelay;
    this.playerTile = null;
}

WalkController.prototype.toJson = function() {
    return {
        offset: this.offset.toJson(),
        delay: this.delay,
        repeatDelay: this.repeatDelay
    };
}

WalkController.prototype.walk = function() {
    if (this.delay > 0) {
        return;
    }
    var tempResult = this.playerTile.move(this.offset);
    if (this.playerTile === localPlayerWorldTile && tempResult) {
        addWalkCommand(this.offset);
    }
    this.delay = 2;
}

WalkController.prototype.startWalk = function(offset) {
    if (this.offset.equals(offset)) {
        return;
    }
    this.offset = offset.copy();
    this.walk();
    this.repeatDelay = 10;
}

WalkController.prototype.stopWalk = function(offset) {
    if (!this.offset.equals(offset)) {
        return;
    }
    this.offset.x = 0;
    this.offset.y = 0;
}

WalkController.prototype.tick = function() {
    if (this.delay > 0) {
        this.delay -= 1;
    }
    if (this.offset.x != 0 || this.offset.y != 0) {
        if (this.repeatDelay > 0) {
            this.repeatDelay -= 1;
        } else {
            this.walk();
        }
    }
}


