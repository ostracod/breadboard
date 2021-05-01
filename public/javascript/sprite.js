
const spriteSize = 11;
const spriteSheetTileSize = 20;
const spriteSheetSize = spriteSize * spriteSheetTileSize;
let spritesHaveLoaded = false;
const spriteSetList = [];
// Contains all sprites without color.
let spriteSheetImage;
let spriteSheetCanvas;
let spriteSheetContext;
let spriteSheetImageData;
let spriteSheetImageDataList;
// Contains a single sprite with color.
let spriteCanvas;
let spriteContext;
let spriteImageData;
let spriteImageDataList;

class ColorPalette {
    
    constructor(colorList) {
        this.colorList = colorList;
    }
}

// startIndex and endIndex are inclusive.
class SpriteSet {
    
    constructor(startIndex, endIndex, paletteList) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.paletteList = paletteList;
        // Map from "(spriteOffset),(paletteIndex)" to image.
        this.spriteImageMap = {};
        spriteSetList.push(this);
    }
    
    initializeSprite(spriteIndex, paletteIndex) {
        const tempPalette = this.paletteList[paletteIndex];
        const tempColorList = tempPalette.colorList;
        const tempPosX = (spriteIndex % spriteSheetTileSize) * spriteSize;
        const tempPosY = Math.floor(spriteIndex / spriteSheetTileSize) * spriteSize;
        let tempOffsetX = 0;
        let tempOffsetY = 0;
        while (tempOffsetY < spriteSize) {
            let index = ((tempPosX + tempOffsetX) + (tempPosY + tempOffsetY) * spriteSheetSize) * 4;
            const tempColorR = spriteSheetImageDataList[index];
            let tempColor;
            if (tempColorR > 192) {
                tempColor = null;
            } else if (tempColorR < 64) {
                tempColor = tempColorList[0];
            } else {
                tempColor = tempColorList[1];
            }
            index = (tempOffsetX + tempOffsetY * spriteSize) * 4;
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
        const tempImage = new Image();
        tempImage.src = spriteCanvas.toDataURL();
        const spriteOffset = spriteIndex - this.startIndex;
        const tempKey = spriteOffset + "," + paletteIndex;
        this.spriteImageMap[tempKey] = tempImage;
    }
    
    initialize() {
        for (let index = this.startIndex; index <= this.endIndex; index++) {
            for (let tempIndex = 0; tempIndex < this.paletteList.length; tempIndex++) {
                this.initializeSprite(index, tempIndex);
            }
        }
    }
    
    draw(context, pos, spriteOffset, paletteIndex, scale) {
        const tempKey = spriteOffset + "," + paletteIndex;
        const tempImage = this.spriteImageMap[tempKey];
        context.imageSmoothingEnabled = false;
        context.drawImage(
            tempImage,
            pos.x * scale,
            pos.y * scale,
            spriteSize * scale,
            spriteSize * scale
        );
    }
}

class NamedColor extends Color {
    
    constructor(r, g, b, name) {
        super(r, g, b);
        this.name = name;
    }
}

const spiritColorSet = [
    new NamedColor(96, 96, 96, "Dark gray"),
    new NamedColor(192, 192, 192, "Gray"),
    new NamedColor(128, 32, 32, "Dark Red"),
    new NamedColor(224, 32, 32, "Red"),
    new NamedColor(128, 80, 32, "Dark Orange"),
    new NamedColor(224, 128, 32, "Orange"),
    new NamedColor(128, 128, 32, "Dark Yellow"),
    new NamedColor(224, 224, 32, "Yellow"),
    new NamedColor(32, 128, 32, "Dark Green"),
    new NamedColor(32, 224, 32, "Green"),
    new NamedColor(32, 128, 160, "Dark Cyan"),
    new NamedColor(32, 224, 255, "Cyan"),
    new NamedColor(64, 64, 192, "Dark Blue"),
    new NamedColor(128, 128, 255, "Blue"),
    new NamedColor(128, 32, 160, "Dark Magenta"),
    new NamedColor(224, 32, 255, "Magenta"),
];
const spiritColorAmount = spiritColorSet.length;
const colorPaletteList = [];
for (const color of spiritColorSet) {
    const tempColor = color.copy();
    tempColor.scale(0.5);
    colorPaletteList.push(new ColorPalette([tempColor, color]));
}
const blockSpriteSet = new SpriteSet(0, 0, colorPaletteList);
const machineSpriteSet = new SpriteSet(1, 1, colorPaletteList);
const resourceSpriteSet = new SpriteSet(2, 2, [
    colorPaletteList[10],
    colorPaletteList[7],
]);
const playerSpriteSet = new SpriteSet(3, 3, [colorPaletteList[13]]);
const circuitSpriteSet = new SpriteSet(4, 4, [colorPaletteList[9]]);
const loadingSpriteSet = new SpriteSet(5, 5, [colorPaletteList[0]]);
const barrierSpriteSet = new SpriteSet(6, 6, [colorPaletteList[1]]);
const wireSpriteSet = new SpriteSet(20, 30, [
    colorPaletteList[5],
    colorPaletteList[7],
]);
const chipSpriteSet = new SpriteSet(40, 40, [
    colorPaletteList[2],
    colorPaletteList[4],
    colorPaletteList[6],
    colorPaletteList[8],
    colorPaletteList[10],
    colorPaletteList[12],
    colorPaletteList[14],
]);
const portSpriteSet = new SpriteSet(41, 45, [
    colorPaletteList[3],
    colorPaletteList[13],
]);
const characterSpriteSet = new SpriteSet(60, 159, [
    new ColorPalette([new Color(255, 255, 255), null]),
]);
const crackSpriteSet = new SpriteSet(160, 163, [
    new ColorPalette([new Color(0, 0, 0), null]),
]);

class Sprite {
    
    constructor(spriteSet, spriteOffset, paletteIndex) {
        this.spriteSet = spriteSet;
        this.spriteOffset = spriteOffset;
        this.paletteIndex = paletteIndex;
    }
    
    draw(context, pos, scale) {
        this.spriteSet.draw(context, pos, this.spriteOffset, this.paletteIndex, scale);
    }
}

const loadingSprite = new Sprite(loadingSpriteSet, 0, 0);
const barrierSprite = new Sprite(barrierSpriteSet, 0, 0);
const playerSprite = new Sprite(playerSpriteSet, 0, 0);

const createCanvasWithSprites = (parentTag, spriteList, inputPixelSize) => {
    const output = document.createElement("canvas");
    const tempSize = spriteSize * inputPixelSize;
    output.width = tempSize;
    output.height = tempSize;
    output.style.width = tempSize / 2;
    output.style.height = tempSize / 2;
    parentTag.appendChild(output);
    const tempContext = output.getContext("2d");
    for (const sprite of spriteList) {
        sprite.draw(tempContext, new Pos(0, 0), inputPixelSize);
    }
    return output;
};

const initializeSpriteSheet = (done) => {
    
    spriteSheetCanvas = document.createElement("canvas");
    spriteSheetCanvas.width = spriteSheetSize;
    spriteSheetCanvas.height = spriteSheetSize;
    spriteSheetContext = spriteSheetCanvas.getContext("2d");
    
    spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = spriteSize;
    spriteCanvas.height = spriteSize;
    spriteContext = spriteCanvas.getContext("2d");
    
    spriteSheetImage = new Image();
    spriteSheetImage.onload = () => {
        
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
        
        for (const spriteSet of spriteSetList) {
            spriteSet.initialize();
        }
        
        spritesHaveLoaded = true;
        done();
    };
    spriteSheetImage.src = "/images/sprites.png";
};


