
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
        var index = 0;
        while (index < blockPaletteList.length) {
            var tempPosX = 5 + index * 15;
            blockSpriteSet.draw(context, new Pos(tempPosX, 10), 0, index, 4);
            blockSpriteSet.draw(context, new Pos(tempPosX, 25), 1, index, 4);
            index += 1;
        }
        resourceSpriteSet.draw(context, new Pos(5, 40), 0, 0, 4);
        resourceSpriteSet.draw(context, new Pos(20, 40), 0, 1, 4);
        playerSpriteSet.draw(context, new Pos(35, 40), 0, 0, 4);
        circuitSpriteSet.draw(context, new Pos(50, 40), 0, 0, 4);
        var index = 0;
        while (index < 11) {
            var tempPosX = 5 + index * 15;
            wireSpriteSet.draw(context, new Pos(tempPosX, 55), index, 0, 4);
            wireSpriteSet.draw(context, new Pos(tempPosX, 70), index, 1, 4);
            wireSpriteSet.draw(context, new Pos(tempPosX, 85), index, 2, 4);
            index += 1;
        }
        var index = 0;
        while (index < 4) {
            var tempPosX = 5 + index * 15;
            chipSpriteSet.draw(context, new Pos(tempPosX, 100), 0, 0, 4);
            var tempIndex = 0;
            while (tempIndex < 4) {
                portSpriteSet.draw(
                    context,
                    new Pos(tempPosX, 100),
                    (tempIndex + index) % 4,
                    tempIndex, 4
                );
                tempIndex += 1;
            }
            index += 1;
        }
        var tempPos = new Pos(5, 115);
        var index = 0;
        while (index < 100) {
            characterSpriteSet.draw(context, tempPos, index, 0, 4);
            tempPos.x += 15;
            if (tempPos.x > 240) {
                tempPos.x = 5;
                tempPos.y += 15;
            }
            index += 1;
        }
    }
}

ClientDelegate.prototype.keyDownEvent = function(keyCode) {
    
    return true;
}

ClientDelegate.prototype.keyUpEvent = function(keyCode) {
    
    return true;
}


