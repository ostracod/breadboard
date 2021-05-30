
import ostracodMultiplayer from "ostracod-multiplayer";
import { complexSpiritClassIdSet, complexSpiritTypeSet, complexSpiritMap } from "./globalData.js";
import { Player, ComplexSpiritDbJson, InventoryUpdateClientJson, SynchronousCommandHandler, ClientCommand, SetWalkControllerClientCommand, WalkClientCommand, MineClientCommand, PlaceTileClientCommand, CraftCircuitTileClientCommand, CraftClientCommand, InspectClientCommand, TransferClientCommand, RecycleClientCommand, SetCircuitTilePortsCommand, SetWorldTileGridClientCommand, SetCircuitTileGridClientCommand, UpdateInventoryItemClientCommand, StopInspectingClientCommand, InventoryUpdatesClientCommand } from "./interfaces.js";
import { Pos, createPosFromJson } from "./pos.js";
import { MachineSpirit, persistAllComplexSpirits, persistNextComplexSpiritId } from "./spirit.js";
import { PlayerSpirit } from "./playerSpirit.js";
import { CircuitSpirit } from "./logicSpirit.js";
import { convertJsonToSpiritType, loadComplexSpirit } from "./spiritType.js";
import { SpiritReference, ComplexSpiritReference, convertJsonToSpiritReference } from "./spiritReference.js";
import { PlayerWorldTile } from "./worldTile.js";
import { Inventory, InventoryUpdate } from "./inventory.js";
import { getRecipeById } from "./recipe.js";
import { niceUtils } from "./niceUtils.js";

const { dbUtils, gameUtils } = ostracodMultiplayer;

let worldSpirit;

const addSetWorldTileGridCommand = (
    playerTile: PlayerWorldTile,
    commandList: ClientCommand[]
): void => {
    const tempWindowSize = 21;
    const tempPos = playerTile.pos.copy();
    const tempCenterOffset = Math.floor(tempWindowSize / 2);
    tempPos.x -= tempCenterOffset;
    tempPos.y -= tempCenterOffset;
    const tempTileJsonList = worldSpirit.getWindowClientJson(
        tempPos,
        tempWindowSize,
        tempWindowSize
    );
    commandList.push({
        commandName: "setWorldTileGrid",
        pos: tempPos.toJson(),
        tiles: tempTileJsonList,
        width: tempWindowSize,
        height: tempWindowSize,
    } as SetWorldTileGridClientCommand);
};

const addSetCircuitTileGridCommand = (
    circuitSpirit: CircuitSpirit,
    commandList: ClientCommand[],
): void => {
    const tempTileList = circuitSpirit.tileGrid.tileList;
    commandList.push({
        commandName: "setCircuitTileGrid",
        tiles: tempTileList.map((tile) => tile.getClientJson()),
    } as SetCircuitTileGridClientCommand);
};

const addUpdateInventoryItemCommandHelper = (
    inventoryUpdateData: InventoryUpdateClientJson,
    commandList: ClientCommand[],
): void => {
    commandList.push({
        commandName: "updateInventoryItem",
        inventoryUpdate: inventoryUpdateData,
    } as UpdateInventoryItemClientCommand);
};

const addUpdateInventoryItemCommand = (
    inventoryUpdate: InventoryUpdate,
    commandList: ClientCommand[],
): void => {
    addUpdateInventoryItemCommandHelper(
        inventoryUpdate.getClientJson(false),
        commandList
    );
};

const addUpdateInventoryItemCommands = (
    inventory: Inventory,
    commandList: ClientCommand[],
): void => {
    for (const item of inventory.items) {
        const tempUpdate = item.getInventoryUpdate();
        addUpdateInventoryItemCommand(tempUpdate, commandList);
    }
};

const addStopInspectingCommand = (
    spiritId: number,
    commandList: ClientCommand[],
): void => {
    commandList.push({
        commandName: "stopInspecting",
        spiritId,
    } as StopInspectingClientCommand);
};

const processInventoryUpdates = (
    command: InventoryUpdatesClientCommand,
    playerSpirit: PlayerSpirit,
    commandList: ClientCommand[],
): void => {
    for (const updateData of command.inventoryUpdates) {
        const tempReference = convertJsonToSpiritReference(updateData.spiritReference);
        if (tempReference instanceof ComplexSpiritReference && tempReference.id < 0) {
            updateData.count = 0;
            addUpdateInventoryItemCommandHelper(updateData, commandList);
            continue;
        }
        const tempInventory = playerSpirit.getInventoryByParentSpiritId(
            updateData.parentSpiritId
        );
        if (tempInventory === null) {
            continue;
        }
        const tempCount = tempInventory.getItemCountBySpiritReference(tempReference);
        if (updateData.count !== tempCount) {
            updateData.count = tempCount;
            addUpdateInventoryItemCommandHelper(updateData, commandList);
        }
    }
};

// TODO: Verify value ranges for all command parameters.

gameUtils.addCommandListener(
    "enterWorld",
    false,
    async (
        command: ClientCommand,
        player: Player,
        commandList: ClientCommand[],
    ): Promise<void> => {
        const playerSpirit = await worldSpirit.addPlayerTile(player);
        const tempInventory = playerSpirit.inventory;
        addUpdateInventoryItemCommands(tempInventory, commandList);
    }
);

const addCommandListener = <T extends ClientCommand>(
    commandName: string,
    handler: SynchronousCommandHandler<T>,
): void => {
    gameUtils.addCommandListener(
        commandName,
        true,
        (command: T, player: Player, commandList: ClientCommand[]): void => {
            handler(command, worldSpirit.getPlayerTile(player), commandList);
        }
    );
};

addCommandListener(
    "setWalkController",
    (
        command: SetWalkControllerClientCommand,
        playerTile,
        commandList
    ) => {
        playerTile.walkControllerData = command.walkController;
    },
);

addCommandListener("getState", (command, playerTile, commandList) => {
    const playerSpirit = playerTile.spirit;
    if (playerSpirit.inspectedCircuit === null) {
        addSetWorldTileGridCommand(playerTile, commandList);
    } else {
        addSetCircuitTileGridCommand(playerSpirit.inspectedCircuit, commandList);
    }
    for (const update of playerSpirit.inventoryUpdates) {
        addUpdateInventoryItemCommand(update, commandList);
    }
    playerSpirit.inventoryUpdates = [];
    playerSpirit.verifyInspectionState();
    for (const spiritId of playerSpirit.stopInspectionSpiritIds) {
        addStopInspectingCommand(spiritId, commandList);
    }
    playerSpirit.stopInspectionSpiritIds = [];
});

addCommandListener("walk", (command: WalkClientCommand, playerTile, commandList) => {
    const tempOffset = createPosFromJson(command.offset);
    playerTile.walk(tempOffset);
});

addCommandListener("mine", (command: MineClientCommand, playerTile, commandList) => {
    const tempPos = createPosFromJson(command.pos);
    playerTile.mine(tempPos);
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

const addPlaceTileCommandListener = (
    commandName: string,
    placeTile: (
        playerTile: PlayerWorldTile,
        pos: Pos,
        spiritReference: SpiritReference
    ) => void,
): void => {
    addCommandListener(
        commandName,
        (
            command: PlaceTileClientCommand,
            playerTile,
            commandList,
        ) => {
            const tempPos = createPosFromJson(command.pos);
            const tempReference = convertJsonToSpiritReference(command.spiritReference);
            placeTile(playerTile, tempPos, tempReference);
            processInventoryUpdates(command, playerTile.spirit, commandList);
        },
    );
};

addPlaceTileCommandListener("placeWorldTile", (playerTile, pos, spiritReference) => {
    playerTile.placeWorldTile(pos, spiritReference);
});

addPlaceTileCommandListener("placeCircuitTile", (playerTile, pos, spiritReference) => {
    playerTile.spirit.placeCircuitTile(pos, spiritReference);
});

addCommandListener("craftCircuitTile", (
    command: CraftCircuitTileClientCommand,
    playerTile,
    commandList,
) => {
    const tempPos = createPosFromJson(command.pos);
    const tempSpiritType = convertJsonToSpiritType(command.spiritType);
    playerTile.spirit.craftCircuitTile(tempPos, tempSpiritType);
});

addCommandListener("craft", (command: CraftClientCommand, playerTile, commandList) => {
    const tempInventory = playerTile.spirit.inventory;
    const tempRecipe = getRecipeById(command.recipeId);
    tempInventory.craftRecipe(tempRecipe);
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

addCommandListener("inspect", (command: InspectClientCommand, playerTile, commandList) => {
    const tempReference = convertJsonToSpiritReference(command.spiritReference);
    const tempSpirit = tempReference.getSpirit();
    const tempResult = playerTile.spirit.inspect(tempSpirit);
    if (tempResult && tempSpirit instanceof MachineSpirit) {
        addUpdateInventoryItemCommands(tempSpirit.inventory, commandList);
    }
});

addCommandListener(
    "stopInspecting",
    (
        command: StopInspectingClientCommand,
        playerTile,
        commandList,
    ) => {
        const tempReference = new ComplexSpiritReference(command.spiritId);
        const tempSpirit = tempReference.getSpirit();
        playerTile.spirit.stopInspecting(tempSpirit);
    },
);

addCommandListener("transfer", (command: TransferClientCommand, playerTile, commandList) => {
    playerTile.spirit.transferInventoryItem(
        command.sourceParentSpiritId,
        command.destinationParentSpiritId,
        convertJsonToSpiritReference(command.spiritReference)
    );
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

addCommandListener("recycle", (command: RecycleClientCommand, playerTile, commandList) => {
    playerTile.spirit.recycleInventoryItem(
        command.parentSpiritId,
        convertJsonToSpiritReference(command.spiritReference)
    );
    processInventoryUpdates(command, playerTile.spirit, commandList);
});

addCommandListener("setChipPortsCommand", (command: SetCircuitTilePortsCommand, playerTile, commandList) => {
    const pos = createPosFromJson(command.pos);
    playerTile.spirit.setChipPorts(pos, command.sidePortIndexes);
});

class GameDelegate {
    
    constructor() {
        
    }
    
    playerEnterEvent(player: Player): void {
        // Player tile is created by enterWorld command.
    }
    
    playerLeaveEvent(player: Player): void {
        const tempTile = worldSpirit.getPlayerTile(player);
        if (tempTile !== null) {
            tempTile.removeFromWorld();
            delete complexSpiritMap[tempTile.spirit.id];
        }
    }
    
    async persistEvent(): Promise<void> {
        await dbUtils.performTransaction(async () => {
            await persistNextComplexSpiritId();
            await persistAllComplexSpirits();
        });
    }
}

export const gameDelegate = new GameDelegate();

const timerEvent = async (): Promise<void> => {
    await gameUtils.performAtomicOperation(async () => {
        await worldSpirit.tick();
    });
    setTimeout(timerEvent, 40);
};

export const loadOrCreateWorldSpirit = async (): Promise<void> => {
    const results = await niceUtils.performDbQuery(
        "SELECT id FROM ComplexSpirits WHERE classId = ?",
        [complexSpiritClassIdSet.world]
    ) as ComplexSpiritDbJson[];
    if (results.length > 0) {
        worldSpirit = await loadComplexSpirit(results[0].id, false);
    } else {
        worldSpirit = complexSpiritTypeSet.world.craft();
    }
    timerEvent();
};


