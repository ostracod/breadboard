
import ostracodMultiplayer from "ostracod-multiplayer";
import {complexSpiritClassIdSet, complexSpiritTypeSet, complexSpiritMap} from "./globalData.js";
import {Player, ComplexSpiritDbJson, InventoryUpdateClientJson, CommandHandler, SynchronousCommandHandler, AsynchronousCommandHandler, ClientCommand, SetWorldTileGridClientCommand, SetCircuitTileGridClientCommand, UpdateInventoryItemClientCommand, StopInspectingClientCommand, InventoryUpdatesClientCommand} from "./interfaces.js";
import {Pos, createPosFromJson} from "./pos.js";
import {PlayerSpirit, MachineSpirit, CircuitSpirit, persistAllComplexSpirits, persistNextComplexSpiritId} from "./spirit.js";
import {convertJsonToSpiritType, loadComplexSpirit} from "./spiritType.js";
import {SpiritReference, ComplexSpiritReference, convertJsonToSpiritReference} from "./spiritReference.js";
import {PlayerWorldTile} from "./worldTile.js";
import {Inventory, InventoryUpdate} from "./inventory.js";
import {getRecipeById} from "./recipe.js";
import {niceUtils} from "./niceUtils.js";

let gameUtils = ostracodMultiplayer.gameUtils;

let worldSpirit;

function addSetWorldTileGridCommand(
    playerTile: PlayerWorldTile,
    commandList: ClientCommand[]
): void {
    let tempWindowSize = 21;
    let tempPos = playerTile.pos.copy();
    let tempCenterOffset = Math.floor(tempWindowSize / 2);
    tempPos.x -= tempCenterOffset;
    tempPos.y -= tempCenterOffset;
    let tempTileJsonList = worldSpirit.getWindowClientJson(
        tempPos,
        tempWindowSize,
        tempWindowSize
    );
    commandList.push({
        commandName: "setWorldTileGrid",
        pos: tempPos.toJson(),
        tiles: tempTileJsonList,
        width: tempWindowSize,
        height: tempWindowSize
    } as SetWorldTileGridClientCommand);
}

function addSetCircuitTileGridCommand(
    circuitSpirit: CircuitSpirit,
    commandList: ClientCommand[],
): void {
    let tempTileList = circuitSpirit.tileGrid.tileList;
    commandList.push({
        commandName: "setCircuitTileGrid",
        tiles: tempTileList.map(tile => tile.getClientJson())
    } as SetCircuitTileGridClientCommand);
}

function addUpdateInventoryItemCommandHelper(
    inventoryUpdateData: InventoryUpdateClientJson,
    commandList: ClientCommand[],
): void {
    commandList.push({
        commandName: "updateInventoryItem",
        inventoryUpdate: inventoryUpdateData
    } as UpdateInventoryItemClientCommand);
}

function addUpdateInventoryItemCommand(
    inventoryUpdate: InventoryUpdate,
    commandList: ClientCommand[],
): void {
    addUpdateInventoryItemCommandHelper(
        inventoryUpdate.getClientJson(false),
        commandList
    );
}

function addUpdateInventoryItemCommands(
    inventory: Inventory,
    commandList: ClientCommand[],
): void {
    for (let item of inventory.items) {
        let tempUpdate = item.getInventoryUpdate();
        addUpdateInventoryItemCommand(tempUpdate, commandList);
    }
}

function addStopInspectingCommand(
    spiritId: number,
    commandList: ClientCommand[],
): void {
    commandList.push({
        commandName: "stopInspecting",
        spiritId: spiritId
    } as StopInspectingClientCommand);
}

function processInventoryUpdates(
    command: InventoryUpdatesClientCommand,
    playerSpirit: PlayerSpirit,
    commandList: ClientCommand[],
): void {
    for (let updateData of command.inventoryUpdates) {
        let tempReference = convertJsonToSpiritReference(updateData.spiritReference);
        if (tempReference instanceof ComplexSpiritReference && tempReference.id < 0) {
            updateData.count = 0;
            addUpdateInventoryItemCommandHelper(updateData, commandList);
            continue;
        }
        let tempInventory = playerSpirit.getInventoryByParentSpiritId(
            updateData.parentSpiritId
        );
        if (tempInventory === null) {
            continue;
        }
        let tempCount = tempInventory.getItemCountBySpiritReference(tempReference);
        if (updateData.count !== tempCount) {
            updateData.count = tempCount;
            addUpdateInventoryItemCommandHelper(updateData, commandList);
        }
    }
}

// TODO: Verify value ranges for all command parameters.

gameUtils.addCommandListener(
    "enterWorld",
    false,
    (
        command: ClientCommand,
        player: Player,
        commandList: ClientCommand[],
        done: () => void,
        errorHandler: (message: string) => void,
    ): void => {
        worldSpirit.addPlayerTile(player).then(playerSpirit => {
            let tempInventory = playerSpirit.inventory;
            addUpdateInventoryItemCommands(tempInventory, commandList);
            done();
        });
    }
);

function addCommandListener<T extends ClientCommand>(
    commandName: string,
    handler: CommandHandler<T>,
): void {
    if (handler.length === 3) {
        gameUtils.addCommandListener(
            commandName,
            true,
            (command: T, player: Player, commandList: ClientCommand[]): void => {
                (handler as SynchronousCommandHandler<T>)(
                    command,
                    worldSpirit.getPlayerTile(player),
                    commandList,
                );
            }
        );
    } else {
        gameUtils.addCommandListener(
            commandName,
            false,
            (
                command: T,
                player: Player,
                commandList: ClientCommand[],
                done: () => void,
                errorHandler: (message: string) => void,
            ): void => {
                (handler as AsynchronousCommandHandler<T>)(
                    command,
                    worldSpirit.getPlayerTile(player),
                    commandList,
                    done,
                    errorHandler
                );
            }
        );
    }
}

addCommandListener("setWalkController", (command, playerTile, commandList) => {
    playerTile.walkControllerData = command.walkController;
});

addCommandListener("getState", (command, playerTile, commandList) => {
    let playerSpirit = playerTile.spirit;
    if (playerSpirit.inspectedCircuit === null) {
        addSetWorldTileGridCommand(playerTile, commandList);
    } else {
        addSetCircuitTileGridCommand(playerSpirit.inspectedCircuit, commandList);
    }
    for (let update of playerSpirit.inventoryUpdates) {
        addUpdateInventoryItemCommand(update, commandList);
    }
    playerSpirit.inventoryUpdates = [];
    playerSpirit.verifyInspectionState();
    for (let spiritId of playerSpirit.stopInspectionSpiritIds) {
        addStopInspectingCommand(spiritId, commandList);
    }
    playerSpirit.stopInspectionSpiritIds = [];
});

addCommandListener("walk", (command, playerTile, commandList) => {
    let tempOffset = createPosFromJson(command.offset);
    playerTile.walk(tempOffset);
});

addCommandListener("mine", (command, playerTile, commandList) => {
    let tempPos = createPosFromJson(command.pos);
    playerTile.mine(tempPos);
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

function addPlaceTileCommandListener(
    commandName: string,
    placeTile: (
        playerTile: PlayerWorldTile,
        pos: Pos,
        spiritReference: SpiritReference
    ) => void,
): void {
    addCommandListener(commandName, (command, playerTile, commandList) => {
        let tempPos = createPosFromJson(command.pos);
        let tempReference = convertJsonToSpiritReference(command.spiritReference);
        placeTile(playerTile, tempPos, tempReference);
        processInventoryUpdates(command, playerTile.spirit, commandList);
    });
}

addPlaceTileCommandListener("placeWorldTile", (playerTile, pos, spiritReference) => {
    playerTile.placeWorldTile(pos, spiritReference);
});

addPlaceTileCommandListener("placeCircuitTile", (playerTile, pos, spiritReference) => {
    playerTile.spirit.placeCircuitTile(pos, spiritReference);
});

addCommandListener("craftCircuitTile", (command, playerTile, commandList) => {
    let tempPos = createPosFromJson(command.pos);
    let tempSpiritType = convertJsonToSpiritType(command.spiritType);
    playerTile.spirit.craftCircuitTile(tempPos, tempSpiritType);
});

addCommandListener("craft", (command, playerTile, commandList) => {
    let tempInventory = playerTile.spirit.inventory;
    let tempRecipe = getRecipeById(command.recipeId);
    tempInventory.craftRecipe(tempRecipe);
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

addCommandListener("inspect", (command, playerTile, commandList) => {
    let tempReference = convertJsonToSpiritReference(command.spiritReference);
    let tempSpirit = tempReference.getSpirit();
    let tempResult = playerTile.spirit.inspect(tempSpirit);
    if (tempResult && tempSpirit instanceof MachineSpirit) {
        addUpdateInventoryItemCommands(tempSpirit.inventory, commandList);
    }
});

addCommandListener("stopInspecting", (command, playerTile, commandList) => {
    let tempReference = new ComplexSpiritReference(command.spiritId);
    let tempSpirit = tempReference.getSpirit();
    playerTile.spirit.stopInspecting(tempSpirit);
});

addCommandListener("transfer", (command, playerTile, commandList) => {
    playerTile.spirit.transferInventoryItem(
        command.sourceParentSpiritId,
        command.destinationParentSpiritId,
        convertJsonToSpiritReference(command.spiritReference)
    );
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

addCommandListener("recycle", (command, playerTile, commandList) => {
    playerTile.spirit.recycleInventoryItem(
        command.parentSpiritId,
        convertJsonToSpiritReference(command.spiritReference)
    );
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

class GameDelegate {
    
    constructor() {
        
    }
    
    playerEnterEvent(player: Player): void {
        // Player tile is created by enterWorld command.
    }
    
    playerLeaveEvent(player: Player): void {
        let tempTile = worldSpirit.getPlayerTile(player);
        if (tempTile !== null) {
            tempTile.removeFromWorld();
            delete complexSpiritMap[tempTile.spirit.id];
        }
    }
    
    persistEvent(done: () => void): void {
        niceUtils.performDbTransaction(() => {
            return persistNextComplexSpiritId().then(persistAllComplexSpirits);
        }).then(done);
    }
}

export let gameDelegate = new GameDelegate();

function timerEvent(): void {
    gameUtils.performAtomicOperation(callback => {
        worldSpirit.tick().then(callback);
    }, () => {
        setTimeout(timerEvent, 40);
    });
}

export function loadOrCreateWorldSpirit(): Promise<void> {
    return niceUtils.performDbQuery(
        "SELECT id FROM ComplexSpirits WHERE classId = ?",
        [complexSpiritClassIdSet.world]
    ).then((results: ComplexSpiritDbJson[]) => {
        if (results.length > 0) {
            return loadComplexSpirit(results[0].id, false);
        } else {
            return complexSpiritTypeSet.world.craft();
        }
    }).then(spirit => {
        worldSpirit = spirit;
        timerEvent();
    });
}


