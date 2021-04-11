
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

export interface SimpleSpiritTypeJson extends SpiritTypeJson {
    serialInteger: number;
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

export type SimpleSpiritNestedDbJson = SimpleSpiritDbJson;

export type ComplexSpiritAttributeJson = any;

export interface PlayerSpiritAttributeJson {
    username: string;
}

export interface MachineSpiritAttributeJson {
    colorIndex: number;
}

export type ComplexSpiritContainerJson = any;

export type InventorySpiritContainerJson = InventoryDbJson;

export type TileGridSpiritContainerJson = TileGridDbJson;

interface ComplexSpiritNestedDbJsonHelper<T1 extends ComplexSpiritAttributeJson, T2 extends ComplexSpiritContainerJson> {
    id: number;
    classId?: number;
    attributeData?: T1;
    containerData?: T2;
}

export type ComplexSpiritNestedDbJson = ComplexSpiritNestedDbJsonHelper<any, any>;

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

export type TileDbJson = any;

export interface InventoryItemClientJson {
    spirit: SpiritClientJson;
    count: number;
}

export interface InventoryItemDbJson {
    spirit: SpiritNestedDbJson;
    count: number;
}

export interface InventoryUpdateClientJson {
    parentSpiritId: number;
    count: number;
    spiritReference?: SpiritReferenceJson;
    spirit?: SpiritClientJson;
}

export type InventoryDbJson = InventoryItemDbJson[];

export interface RecipeComponentJson {
    spiritType: SpiritTypeJson;
    count: number;
}

export interface RecipeJson {
    id: number;
    ingredients: RecipeComponentJson[];
    product: RecipeComponentJson;
}

export interface TileGridDbJson {
    width: number;
    height: number;
    tiles: TileDbJson[];
}

export type SpiritDbJson = any;

export type SimpleSpiritDbJson = number;

interface ComplexSpiritDbJsonHelper<T1 extends ComplexSpiritAttributeJson, T2 extends ComplexSpiritContainerJson> {
    id: number;
    parentId: number;
    classId: number;
    attributeData: T1;
    containerData: T2;
}

export type ComplexSpiritDbJson = ComplexSpiritDbJsonHelper<any, any>;

// TODO: Think about how to clean up these type definitions.

export type PlayerSpiritDbJson = ComplexSpiritDbJsonHelper<PlayerSpiritAttributeJson, InventorySpiritContainerJson>;

export type MachineSpiritDbJson = ComplexSpiritDbJsonHelper<MachineSpiritAttributeJson, InventorySpiritContainerJson>;

export type WorldSpiritDbJson = ComplexSpiritDbJsonHelper<ComplexSpiritAttributeJson, TileGridSpiritContainerJson>;

export type CircuitSpiritDbJson = ComplexSpiritDbJsonHelper<ComplexSpiritAttributeJson, TileGridSpiritContainerJson>;

export interface ConfigDbJson {
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


