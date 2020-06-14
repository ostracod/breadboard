
const wireArrangementAmount = 12;

// Map from name to SimpleSpirit.
let simpleSpiritSet = {};
// Maps from name to SpiritType.
let simpleSpiritTypeSet = {};
let complexSpiritTypeSet = {};
// Map from name to SimpleWorldTile.
let simpleWorldTileSet = {};

// Map from serial integer to SimpleSpirit.
let simpleSpiritMap = {};
// Array of {spirit: ComplexSpirit, updateRequestCount: number}.
let complexSpiritCache = [];

// Map from serial integer to SimpleSpiritType.
let simpleSpiritTypeMap = {};
// Map from spirit class ID to list of ComplexSpiritType.
let complexSpiritTypeMap = {};

// Map from serial integer to SimpleWorldTile.
let simpleWorldTileMap = {};
// Map from spirit class ID to ComplexWorldTileFactory.
let complexWorldTileFactoryMap = {};

let recipeList = [];

new LoadingSpiritType();
new EmptySpiritType();
new BarrierSpiritType();
new MatteriteSpiritType();
new EnergiteSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new BlockSpiritType(colorIndex);
}
for (let arrangement = 0; arrangement < wireArrangementAmount; arrangement++) {
    new WireSpiritType(arrangement);
}

new PlayerSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new MachineSpiritType(colorIndex);
}
new CircuitSpiritType();

for (let serialInteger in simpleSpiritMap) {
    let tempSpirit = simpleSpiritMap[serialInteger];
    new SimpleWorldTile(tempSpirit);
}

new PlayerWorldTileFactory();
new MachineWorldTileFactory();
new ComplexWorldTileFactory("circuit");

for (let data of recipeDataList) {
    let tempRecipe = convertJsonToRecipe(data);
    recipeList.push(tempRecipe);
}

let localPlayerUsername;
let localPlayerSpiritId;
let localPlayerWorldTile = null;
let playerWorldTileList = [];
let worldTileGrid = new TileGrid(simpleWorldTileSet.loading);
// Map from parent spirit ID to inventory.
let parentSpiritInventoryMap = {};
let localPlayerInventory = null;
let inspectedMachineInventory = null;
let inspectedCircuitSpiritId = null;
let selectedRecipe = null;


