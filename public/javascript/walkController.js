
class WalkController {
    
    constructor(offset, delay, repeatDelay) {
        this.offset = offset;
        this.delay = delay;
        this.repeatDelay = repeatDelay;
        this.playerTile = null;
    }
    
    toJson() {
        return {
            offset: this.offset.toJson(),
            delay: this.delay,
            repeatDelay: this.repeatDelay,
        };
    }
    
    walk() {
        if (this.delay > 0) {
            return;
        }
        let tempResult = this.playerTile.move(this.offset);
        if (this.playerTile === localPlayerWorldTile && tempResult) {
            addWalkCommand(this.offset);
        }
        this.delay = 2;
    }
    
    startWalk(offset) {
        if (this.offset.equals(offset)) {
            return;
        }
        this.offset = offset.copy();
        this.walk();
        this.repeatDelay = 10;
    }
    
    stopWalk(offset) {
        if (!this.offset.equals(offset)) {
            return;
        }
        this.offset.x = 0;
        this.offset.y = 0;
    }
    
    tick() {
        if (this.delay > 0) {
            this.delay -= 1;
        }
        if (this.offset.x !== 0 || this.offset.y !== 0) {
            if (this.repeatDelay > 0) {
                this.repeatDelay -= 1;
            } else {
                this.walk();
            }
        }
    }
}

const createDefaultWalkController = () => (
    new WalkController(new Pos(0, 0), 0, 0)
);

const convertJsonToWalkController = (data) => {
    if (data === null) {
        return createDefaultWalkController();
    }
    return new WalkController(
        createPosFromJson(data.offset),
        data.delay,
        data.repeatDelay
    );
};


