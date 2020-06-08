
export class Pos {
    
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    copy() {
        return new Pos(this.x, this.y);
    }
    
    set(pos) {
        this.x = pos.x;
        this.y = pos.y;
    }
    
    add(pos) {
        this.x += pos.x;
        this.y += pos.y;
    }
    
    subtract(pos) {
        this.x -= pos.x;
        this.y -= pos.y;
    }
    
    equals(pos) {
        return (this.x == pos.x && this.y == pos.y);
    }
    
    isAdjacentTo(pos) {
        return (Math.abs(this.x - pos.x) + Math.abs(this.y - pos.y) <= 1);
    }
    
    toString() {
        return "(" + this.x + ", " + this.y + ")";
    }
    
    toJson() {
        return {
            x: this.x,
            y: this.y
        };
    }
}

export function createPosFromJson(data) {
    return new Pos(data.x, data.y);
}


