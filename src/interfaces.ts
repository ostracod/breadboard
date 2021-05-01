
import { ComplexSpirit } from "./spirit.js";
import { PlayerWorldTile } from "./worldTile.js";

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

export type SpiritClientJson = SimpleSpiritClientJson | ComplexSpiritClientJson;

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

export interface ConstantLogicSpiritClientJson extends ComplexSpiritClientJson {
    constantValue: number;
}

export type SpiritNestedDbJson = SimpleSpiritNestedDbJson | ComplexSpiritNestedDbJson;

export type SimpleSpiritNestedDbJson = SimpleSpiritDbJson;

export type ComplexSpiritAttributeJson = any;

export interface PlayerSpiritAttributeJson {
    username: string;
}

export interface MachineSpiritAttributeJson {
    colorIndex: number;
}

export interface ConstantLogicSpiritAttributeJson {
    constantValue: number;
}

export type ComplexSpiritContainerJson = any;

export type InventorySpiritContainerJson = InventoryDbJson;

export type TileGridSpiritContainerJson = TileGridDbJson;

export interface ComplexSpiritBaseDbJson<T extends ComplexSpirit = ComplexSpirit> {
    id: number;
    classId: number;
    attributeData: ReturnType<T["getAttributeDbJson"]>;
    containerData?: ReturnType<T["getContainerDbJson"]>;
}

export type ComplexSpiritNestedDbJson<T extends ComplexSpirit = ComplexSpirit> = { id: number } | ComplexSpiritBaseDbJson<T>;

export type SpiritDbJson = SimpleSpiritDbJson | ComplexSpiritDbJson;

export type SimpleSpiritDbJson = number;

export interface ComplexSpiritDbJson<T extends ComplexSpirit = ComplexSpirit> extends ComplexSpiritBaseDbJson<T> {
    parentId: number;
}

export interface SpiritReferenceJson {
    type: string;
}

export interface SimpleSpiritReferenceJson extends SpiritReferenceJson {
    serialInteger: number;
}

export interface ComplexSpiritReferenceJson extends SpiritReferenceJson {
    id: number;
}

export type TileClientJson = SimpleTileClientJson | ComplexTileClientJson;

export type SimpleTileClientJson = number;

export interface ComplexTileClientJson {
    spirit: ComplexSpiritClientJson;
}

export interface PlayerWorldTileClientJson extends ComplexTileClientJson {
    walkController: WalkControllerJson;
}

export type TileDbJson = SimpleTileDbJson | ComplexTileDbJson;

export type SimpleTileDbJson = number;

export interface ComplexTileDbJson<T extends ComplexSpirit = ComplexSpirit> {
    spirit: ComplexSpiritNestedDbJson<T>
}

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

export interface TileGridJson<T> {
    width: number;
    height: number;
    tiles: T[];
}

export type TileGridDbJson = TileGridJson<TileDbJson>;

export type TileGridClientJson = TileGridJson<TileClientJson>;

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


