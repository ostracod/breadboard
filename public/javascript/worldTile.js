
class WorldTile extends Tile {
    
    addEvent(pos) {
        // Do nothing.
    }
    
    canBeMined() {
        return this.spirit.canBeMined();
    }
}

class SimpleWorldTile extends WorldTile {
    
    constructor(spirit) {
        super(spirit);
        let tempSpiritType = this.spirit.spiritType;
        let tempSerialInteger = this.spirit.serialInteger;
        simpleWorldTileSet[tempSpiritType.baseName] = this;
        simpleWorldTileMap[tempSerialInteger] = this;
    }
}

class ComplexWorldTile extends WorldTile {
    
    constructor(spirit) {
        super(spirit);
        this.pos = null;
    }
    
    addEvent(pos) {
        this.pos = pos.copy();
    }
    
    move(offset) {
        let tempNextPos = this.pos.copy();
        tempNextPos.add(offset);
        let tempTile = worldTileGrid.getTile(tempNextPos);
        if (tempTile.spirit.spiritType !== simpleSpiritTypeSet.empty) {
            return false;
        }
        worldTileGrid.setTile(this.pos, simpleWorldTileSet.empty);
        this.pos.set(tempNextPos);
        worldTileGrid.setTile(this.pos, this);
        return true;
    }
}

class PlayerWorldTile extends ComplexWorldTile {
    
    constructor(spirit, walkController) {
        super(spirit);
        if (this.spirit.username === localPlayerUsername) {
            if (localPlayerWorldTile !== null) {
                walkController = localPlayerWorldTile.walkController;
            }
            localPlayerWorldTile = this;
        }
        this.walkController = walkController;
        this.walkController.playerTile = this;
        playerWorldTileList.push(this);
    }
    
    draw(pos, layer) {
        super.draw(pos, layer);
        if (layer === 1) {
            let tempPos = pos.copy();
            tempPos.scale(pixelSize);
            tempPos.x += spritePixelSize / 2;
            tempPos.y -= spritePixelSize * 1 / 5;
            context.font = "bold 30px Arial";
            context.textAlign = "center";
            context.textBaseline = "bottom";
            context.fillStyle = "#000000";
            context.fillText(
                this.spirit.username,
                Math.floor(tempPos.x),
                Math.floor(tempPos.y)
            );
        }
    }
    
    tick() {
        this.walkController.tick();
    }
}

class MachineWorldTile extends ComplexWorldTile {
    
}


