
const wireArrangementAmount = 12;
const circuitSize = 17;

// Map from name to SimpleSpirit.
const simpleSpiritSet = {};
// Maps from name to SpiritType.
const simpleSpiritTypeSet = {};
const complexSpiritTypeSet = {};
// Maps from name to Tile.
const simpleWorldTileSet = {};
const simpleCircuitTileSet = {};

// Map from serial integer to SimpleSpirit.
const simpleSpiritMap = {};
// Array of {spirit: ComplexSpirit, updateRequestCount: number}.
const complexSpiritCache = [];

// Map from serial integer to SimpleSpiritType.
const simpleSpiritTypeMap = {};
// Map from spirit class ID to list of ComplexSpiritType.
const complexSpiritTypesMap = {};

// Maps from spirit serial integer to Tile.
const simpleWorldTileMap = {};
const simpleCircuitTileMap = {};
// Maps from spirit class ID to ComplexTileFactory.
const complexWorldTileFactoryMap = {};
const complexCircuitTileFactoryMap = {};

const recipeList = [];

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
new ConstantLogicSpiritType();

for (const serialInteger in simpleSpiritMap) {
    const tempSpirit = simpleSpiritMap[serialInteger];
    new SimpleWorldTile(tempSpirit);
    new SimpleCircuitTile(tempSpirit);
}

new PlayerWorldTileFactory();
new MachineWorldTileFactory();
new ComplexWorldTileFactory("circuit");
new ComplexCircuitTileFactory("constantLogic");

const worldTileFactory = new WorldTileFactory();
const circuitTileFactory = new CircuitTileFactory();

for (const data of recipeDataList) {
    const tempRecipe = convertJsonToRecipe(data);
    recipeList.push(tempRecipe);
}

let localPlayerUsername;
let localPlayerSpiritId;
let localPlayerWorldTile = null;
let playerWorldTileList = [];
let worldTileGrid = new TileGrid(worldTileFactory);
let circuitTileGrid = new TileGrid(circuitTileFactory);
// Map from parent spirit ID to inventory.
let parentSpiritInventoryMap = {};
let localPlayerInventory = null;
let inspectedMachineInventory = null;
let inspectedCircuitSpiritId = null;
let inspectedCircuitTilePos = null;
let cursorCircuitTilePos = null;
let selectedRecipe = null;
let selectedCircuitTileOptionRow = null;


