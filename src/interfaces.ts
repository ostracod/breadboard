
import {PlayerWorldTile} from "./worldTile.js";

// TODO: Export this type from OstracodMultiplayer.
export interface Player {
    username: string;
    extraFields: {
        complexSpiritId: number,
    };
}

export interface PosJson {
    x: number;
    y: number;
}

export interface WalkControllerJson {
    offset: number;
    delay: number;
    repeatDelay: number;
}

export interface SpiritTypeJson {
    type: string;
}

export interface ComplexSpiritTypeJson extends SpiritTypeJson {
    classId: number;
}

export interface MachineSpiritTypeJson extends ComplexSpiritTypeJson {
    colorIndex: number;
}

export type SpiritClientJson = any;

export type SimpleSpiritClientJson = number;

export interface ComplexSpiritClientJson {
    classId: number;
    id: number;
}

export interface PlayerSpiritClientJson extends ComplexSpiritClientJson {
    username: string;
}

export interface MachineSpiritClientJson extends ComplexSpiritClientJson {
    colorIndex: number;
}

export type SpiritNestedDbJson = any;

export type SimpleSpiritNestedDbJson = number;

export interface SpiritReferenceJson {
    type: string;
}

export interface SimpleSpiritReferenceJson extends SpiritReferenceJson {
    serialInteger: number;
}

export interface ComplexSpiritReferenceJson extends SpiritReferenceJson {
    id: number;
}

export type TileClientJson = any;

export type SimpleTileClientJson = number;

export interface ComplexTileClientJson {
    spirit: ComplexSpiritClientJson;
}

export interface InventoryUpdateClientJson {
    parentSpiritId: number;
    count: number;
    spiritReference?: SpiritReferenceJson;
    spirit?: SpiritClientJson;
}

export interface ComplexSpiritDbRow {
    id: number;
    parentId: number;
    classId: number;
    attributeData: any;
    containerData: any;
}

export interface ConfigDbRow {
    name: string;
    value: string;
}

export interface ClientCommand {
    commandName: string;
}

export interface SetWorldTileGridClientCommand extends ClientCommand {
    pos: PosJson;
    tiles: TileClientJson[];
    width: number;
    height: number;
}

export interface SetCircuitTileGridClientCommand extends ClientCommand {
    tiles: TileClientJson[];
}

export interface UpdateInventoryItemClientCommand extends ClientCommand {
    inventoryUpdate: InventoryUpdateClientJson;
}

export interface StopInspectingClientCommand extends ClientCommand {
    spiritId: number;
}

export interface InventoryUpdatesClientCommand extends ClientCommand {
    inventoryUpdates: InventoryUpdateClientJson[];
}

export type SynchronousCommandHandler<T extends ClientCommand> = (
    command: T,
    playerTile: PlayerWorldTile,
    commandList: ClientCommand[],
) => void;

export type AsynchronousCommandHandler<T extends ClientCommand> = (
    command: T,
    playerTile: PlayerWorldTile,
    commandList: ClientCommand[],
    done: () => void,
    errorHandler: (message: string) => void,
) => void;

export type CommandHandler<T extends ClientCommand> = SynchronousCommandHandler<T> | AsynchronousCommandHandler<T>;


