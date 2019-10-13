
var worldSpriteGrid;
// Map from entity type number to Sprite.
var entitySpriteMap = {
    0: null,
    1: new Sprite(resourceSpriteSet, 0, 0),
    2: new Sprite(resourceSpriteSet, 0, 1)
};

function SpriteGrid() {
    this.width = 0;
    this.height = 0;
    this.size = 0;
    this.spriteList = [];
}

SpriteGrid.prototype.setSprites = function(spriteList, width, height) {
    this.width = width;
    this.height = height;
    this.length = this.width * this.height;
    this.spriteList = spriteList;
}

SpriteGrid.prototype.draw = function(context) {
    var index = 0;
    var tempPos = new Pos(0, 0);
    var tempPos2 = new Pos(0, 0);
    while (tempPos.y < this.height) {
        var tempSprite = this.spriteList[index]
        if (tempSprite !== null) {
            tempPos2.set(tempPos);
            tempPos2.scale(spriteSize);
            tempSprite.draw(context, tempPos2, 6);
        }
        index += 1;
        tempPos.x += 1;
        if (tempPos.x >= this.height) {
            tempPos.x = 0;
            tempPos.y += 1;
        }
    }
}

function drawEverything() {
    clearCanvas();
    if (!spritesHaveLoaded) {
        return;
    }
    worldSpriteGrid.draw(context);
}

function convertEntityJsonToSprite(data) {
    return entitySpriteMap[data];
}

function addGetStateCommand() {
    gameUpdateCommandList.push({
        commandName: "getState"
    });
}

addCommandListener("setEntityGrid", function(command) {
    tempSpriteList = [];
    var index = 0;
    while (index < command.entities.length) {
        var tempData = command.entities[index];
        var tempSprite = convertEntityJsonToSprite(tempData);
        tempSpriteList.push(tempSprite);
        index += 1;
    }
    worldSpriteGrid.setSprites(tempSpriteList, command.width, command.height);
});

function ClientDelegate() {
    
}

clientDelegate = new ClientDelegate();

ClientDelegate.prototype.initialize = function() {
    worldSpriteGrid = new SpriteGrid();
    initializeSpriteSheet(function() {});
}

ClientDelegate.prototype.setLocalPlayerInfo = function(command) {
    
}

ClientDelegate.prototype.addCommandsBeforeUpdateRequest = function() {
    addGetStateCommand();
}

ClientDelegate.prototype.timerEvent = function() {
    drawEverything();
}

ClientDelegate.prototype.keyDownEvent = function(keyCode) {
    
    return true;
}

ClientDelegate.prototype.keyUpEvent = function(keyCode) {
    
    return true;
}


