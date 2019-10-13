
function Pos(x, y) {
    this.x = x;
    this.y = y;
}

Pos.prototype.copy = function() {
    return new Pos(this.x, this.y);
}

Pos.prototype.set = function(pos) {
    this.x = pos.x;
    this.y = pos.y;
}

Pos.prototype.add = function(pos) {
    this.x += pos.x;
    this.y += pos.y;
}

Pos.prototype.subtract = function(pos) {
    this.x -= pos.x;
    this.y -= pos.y;
}

Pos.prototype.equals = function(pos) {
    return (this.x == pos.x && this.y == pos.y);
}

Pos.prototype.toString = function() {
    return "(" + this.x + ", " + this.y + ")";
}

module.exports = {
    Pos: Pos
};


