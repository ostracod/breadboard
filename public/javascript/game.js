
function ClientDelegate() {
    
}

clientDelegate = new ClientDelegate();

ClientDelegate.prototype.initialize = function() {
    initializeSpriteSheet(function() {});
}

ClientDelegate.prototype.setLocalPlayerInfo = function(command) {
    
}

ClientDelegate.prototype.addCommandsBeforeUpdateRequest = function() {
    
}

ClientDelegate.prototype.timerEvent = function() {
    clearCanvas();
    // Example sprite drawing.
    if (spritesHaveLoaded) {
        context.fillStyle = "#FF8888";
        context.fillRect(0, 0, 130, 130);
        spriteSet1.draw(context, new Pos(5, 2), 0, 0, 5);
        spriteSet1.draw(context, new Pos(5, 17), 1, 0, 5);
        spriteSet1.draw(context, new Pos(20, 2), 0, 1, 5);
        spriteSet1.draw(context, new Pos(20, 17), 1, 1, 5);
    }
}

ClientDelegate.prototype.keyDownEvent = function(keyCode) {
    
    return true;
}

ClientDelegate.prototype.keyUpEvent = function(keyCode) {
    
    return true;
}


