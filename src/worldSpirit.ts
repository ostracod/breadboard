
import { worldSize, simpleSpiritTypeSet, complexSpiritTypeSet, simpleWorldTileSet } from "./globalData.js";
import { Player, TileClientJson } from "./interfaces.js";
import { Pos } from "./pos.js";
import { TileGridSpirit } from "./spirit.js";
import { PlayerSpirit } from "./playerSpirit.js";
import { PlayerSpiritType, WorldSpiritType, loadComplexSpirit } from "./spiritType.js";
import { WorldTile, PlayerWorldTile } from "./worldTile.js";
import { TileGrid, createWorldTileGrid } from "./tileGrid.js";

export class WorldSpirit extends TileGridSpirit<WorldTile> {
    
    spiritType: WorldSpiritType;
    playerTileList: PlayerWorldTile[];
    
    constructor(
        spiritType: WorldSpiritType,
        id: number,
        tileGrid: TileGrid<WorldTile> = null,
    ) {
        super(spiritType, id, tileGrid);
        this.playerTileList = [];
    }
    
    isDbRoot(): boolean {
        return true;
    }
    
    generateTileGrid(): void {
        this.tileGrid = createWorldTileGrid(worldSize, worldSize);
        for (let count = 0; count < 1000; count++) {
            let tempTile;
            if (Math.random() < 0.5) {
                tempTile = simpleWorldTileSet.matterite;
            } else {
                tempTile = simpleWorldTileSet.energite;
            }
            const tempPos = new Pos(
                Math.floor(Math.random() * this.tileGrid.width),
                Math.floor(Math.random() * this.tileGrid.height)
            );
            this.setTile(tempPos, tempTile);
        }
    }
    
    setTile(pos: Pos, tile: WorldTile): void {
        const tempOldTile = this.tileGrid.getTile(pos);
        super.setTile(pos, tile);
        tempOldTile.removeFromWorldEvent();
        tile.addToWorldEvent(this);
    }
    
    getWindowClientJson(pos: Pos, width: number, height: number): TileClientJson[] {
        return this.tileGrid.getWindowClientJson(pos, width, height);
    }
    
    findPlayerTile(player: Player): number {
        for (let index = 0; index < this.playerTileList.length; index++) {
            const tempTile = this.playerTileList[index];
            const tempPlayer = tempTile.spirit.player;
            if (tempPlayer.username === player.username) {
                return index;
            }
        }
        return -1;
    }
    
    getPlayerTile(player: Player): PlayerWorldTile {
        const index = this.findPlayerTile(player);
        if (index < 0) {
            return null;
        }
        return this.playerTileList[index];
    }
    
    getPlayerSpirit(player: Player): PlayerSpirit {
        const tempTile = this.getPlayerTile(player);
        if (tempTile === null) {
            return null;
        }
        return tempTile.spirit;
    }
    
    addPlayerTile(player: Player): Promise<PlayerSpirit> {
        const tempTile = this.getPlayerTile(player);
        if (tempTile !== null) {
            return Promise.resolve(tempTile.spirit);
        }
        let tempPromise;
        const tempId = player.extraFields.complexSpiritId;
        if (tempId === null) {
            const tempSpirit = (complexSpiritTypeSet.player as PlayerSpiritType).createPlayerSpirit(player);
            tempPromise = Promise.resolve(tempSpirit);
        } else {
            tempPromise = loadComplexSpirit(tempId);
        }
        return tempPromise.then((spirit) => {
            const tempTile = new PlayerWorldTile(spirit);
            // TODO: Make player tile placement more robust.
            const tempPos = new Pos(3, 3);
            while (true) {
                const tempOldTile = this.getTile(tempPos);
                if (tempOldTile.spirit.spiritType === simpleSpiritTypeSet.empty) {
                    break;
                }
                tempPos.x += 1;
            }
            tempTile.addToWorld(this, tempPos);
            return spirit;
        });
    }
    
    tick(): Promise<void> {
        // TODO: Put something here.
        
        return Promise.resolve();
    }
}


