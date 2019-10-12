
var spriteSize = 11;
var spriteSheetTileSize = 20;
var spriteSheetSize = spriteSize * spriteSheetTileSize;
var spritesHaveLoaded = false;
var spriteSetList = [];
// Contains all sprites without color.
var spriteSheetImage;
var spriteSheetCanvas;
var spriteSheetContext;
var spriteSheetImageData;
var spriteSheetImageDataList;
// Contains a single sprite with color.
var spriteCanvas;
var spriteContext;
var spriteImageData;
var spriteImageDataList;

function ColorPalette(colorList) {
    this.colorList = colorList;
}

// startIndex and endIndex are inclusive.
function SpriteSet(startIndex, endIndex, paletteList) {
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    this.paletteList = paletteList;
    // Map from "(spriteOffset),(paletteIndex)" to image.
    this.spriteImageMap = {};
    spriteSetList.push(this);
}

SpriteSet.prototype.initializeSprite = function(spriteIndex, paletteIndex) {
    var tempPalette = this.paletteList[paletteIndex];
    var tempColorList = tempPalette.colorList;
    var tempPosX = (spriteIndex % spriteSheetTileSize) * spriteSize;
    var tempPosY = Math.floor(spriteIndex / spriteSheetTileSize) * spriteSize;
    var tempOffsetX = 0;
    var tempOffsetY = 0;
    while (tempOffsetY < spriteSize) {
        var index = ((tempPosX + tempOffsetX) + (tempPosY + tempOffsetY) * spriteSheetSize) * 4;
        var tempColorR = spriteSheetImageDataList[index];
        var tempColor;
        if (tempColorR > 192) {
            tempColor = null;
        } else if (tempColorR < 64) {
            tempColor = tempColorList[0];
        } else {
            tempColor = tempColorList[1];
        }
        var index = (tempOffsetX + tempOffsetY * spriteSize) * 4;
        if (tempColor === null) {
            spriteImageDataList[index + 3] = 0;
        } else {
            spriteImageDataList[index] = tempColor.r;
            spriteImageDataList[index + 1] = tempColor.g;
            spriteImageDataList[index + 2] = tempColor.b;
            spriteImageDataList[index + 3] = 255;
        }
        tempOffsetX += 1;
        if (tempOffsetX >= spriteSize) {
            tempOffsetX = 0;
            tempOffsetY += 1;
        }
    }
    spriteContext.putImageData(spriteImageData, 0, 0);
    var tempImage = new Image();
    tempImage.src = spriteCanvas.toDataURL();
    var spriteOffset = spriteIndex - this.startIndex;
    var tempKey = spriteOffset + "," + paletteIndex;
    this.spriteImageMap[tempKey] = tempImage;
}

SpriteSet.prototype.initialize = function() {
    var index = this.startIndex;
    while (index <= this.endIndex) {
        var tempIndex = 0;
        while (tempIndex < this.paletteList.length) {
            this.initializeSprite(index, tempIndex);
            tempIndex += 1;
        }
        index += 1;
    }
}

SpriteSet.prototype.draw = function(context, pos, spriteOffset, paletteIndex, scale) {
    var tempKey = spriteOffset + "," + paletteIndex;
    var tempImage = this.spriteImageMap[tempKey];
    context.imageSmoothingEnabled = false;
    context.drawImage(
        tempImage,
        pos.x * scale,
        pos.y * scale,
        spriteSize * scale,
        spriteSize * scale
    );
}

// Example palettes and sprites.
var colorPalette1 = new ColorPalette([new Color(0, 0, 0), new Color(0, 192, 192)]);
var colorPalette2 = new ColorPalette([new Color(0, 128, 0), new Color(0, 192, 0)]);
var spriteSet1 = new SpriteSet(1, 2, [colorPalette1, colorPalette2]);

function initializeSpriteSheet(done) {
    
    spriteSheetCanvas = document.createElement("canvas");
    spriteSheetCanvas.width = spriteSheetSize;
    spriteSheetCanvas.height = spriteSheetSize;
    spriteSheetContext = spriteSheetCanvas.getContext("2d");
    
    spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = spriteSize;
    spriteCanvas.height = spriteSize;
    spriteContext = spriteCanvas.getContext("2d");
    
    spriteSheetImage = new Image();
    spriteSheetImage.onload = function() {
        
        spriteSheetContext.drawImage(spriteSheetImage, 0, 0);
        spriteSheetImageData = spriteSheetContext.getImageData(
            0,
            0,
            spriteSheetSize,
            spriteSheetSize
        );
        spriteSheetImageDataList = spriteSheetImageData.data;
        
        spriteImageData = spriteContext.createImageData(spriteSize, spriteSize);
        spriteImageDataList = spriteImageData.data;
        
        var index = 0;
        while (index < spriteSetList.length) {
            var tempSpriteSet = spriteSetList[index];
            tempSpriteSet.initialize();
            index += 1;
        }
        
        spritesHaveLoaded = true;
        done();
    }
    spriteSheetImage.src = "/images/sprites.png";
}


