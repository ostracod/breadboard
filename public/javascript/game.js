
var worldEntityGrid;
// Map from entity type number to EntityFactory.
var entityFactoryMap = {};

function Entity() {
    
}

// Concrete subclasses of Entity must implement these methods:
// getSprite

function SimpleEntity(sprite) {
    Entity.call(this);
    this.sprite = sprite;
}

SimpleEntity.prototype = Object.create(Entity.prototype);
SimpleEntity.prototype.constructor = SimpleEntity;

SimpleEntity.prototype.getSprite = function() {
    return this.sprite;
}

// entityType is a number.
function EntityFactory(entityType) {
    this.entityType = entityType;
    entityFactoryMap[this.entityType] = this;
}

// Concrete subclasses of EntityFactory must implement these methods:
// convertJsonToEntity

function SimpleEntityFactory(entityType, sprite) {
    EntityFactory.call(this, entityType);
    this.simpleEntity = new SimpleEntity(sprite);
}

SimpleEntityFactory.prototype = Object.create(EntityFactory.prototype);
SimpleEntityFactory.prototype.constructor = SimpleEntityFactory;

SimpleEntityFactory.prototype.convertJsonToEntity = function() {
    return this.simpleEntity;
}

new SimpleEntityFactory(1, new Sprite(resourceSpriteSet, 0, 0));
new SimpleEntityFactory(2, new Sprite(resourceSpriteSet, 0, 1));

function Grid() {
    this.width = 0;
    this.height = 0;
    this.size = 0;
    this.valueList = [];
}

// Each value must have a getSprite method.
Grid.prototype.setValues = function(valueList, width, height) {
    this.width = width;
    this.height = height;
    this.length = this.width * this.height;
    this.valueList = valueList;
}

Grid.prototype.drawSprites = function() {
    var index = 0;
    var tempPos = new Pos(0, 0);
    var tempPos2 = new Pos(0, 0);
    while (tempPos.y < this.height) {
        var tempValue = this.valueList[index]
        tempPos2.set(tempPos);
        tempPos2.scale(spriteSize);
        index += 1;
        tempPos.x += 1;
        if (tempPos.x >= this.height) {
            tempPos.x = 0;
            tempPos.y += 1;
        }
        if (tempValue === null) {
            continue;
        }
        var tempSprite = tempValue.getSprite();
        if (tempSprite === null) {
            continue;
        }
        tempSprite.draw(context, tempPos2, 6);
    }
}

worldEntityGrid = new Grid();

function drawEverything() {
    clearCanvas();
    if (!spritesHaveLoaded) {
        return;
    }
    worldEntityGrid.drawSprites();
}

function convertJsonToEntity(data) {
    var tempType;
    if (typeof data === "number") {
        tempType = data;
    } else {
        tempType = data.type
    }
    if (!(tempType in entityFactoryMap)) {
        return null;
    }
    var tempFactory = entityFactoryMap[tempType];
    return tempFactory.convertJsonToEntity(data);
}

function addGetStateCommand() {
    gameUpdateCommandList.push({
        commandName: "getState"
    });
}

addCommandListener("setEntityGrid", function(command) {
    tempEntityList = [];
    var index = 0;
    while (index < command.entities.length) {
        var tempData = command.entities[index];
        var tempEntity = convertJsonToEntity(tempData);
        tempEntityList.push(tempEntity);
        index += 1;
    }
    worldEntityGrid.setValues(tempEntityList, command.width, command.height);
});

function ClientDelegate() {
    
}

clientDelegate = new ClientDelegate();

ClientDelegate.prototype.initialize = function() {
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


