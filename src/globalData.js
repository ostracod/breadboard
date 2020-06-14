
export const simpleSpiritSerialIntegerSet = {
    empty: 0,
    barrier: 1,
    matterite: 2,
    energite: 3,
    block: 4,
    loading: 30,
    wire: 31
};

export const complexSpiritClassIdSet = {
    player: 0,
    machine: 1,
    circuit: 2
};

export const spiritColorAmount = 16;
export const wireArrangementAmount = 12;

// Map from name to SimpleSpirit.
export let simpleSpiritSet = {};
// Maps from name to SpiritType.
export let simpleSpiritTypeSet = {};
export let complexSpiritTypeSet = {};
// Maps from name to Tile.
export let simpleWorldTileSet = {};
export let simpleCircuitTileSet = {};

// Map from serial integer to SimpleSpirit.
export let simpleSpiritMap = {};
// Maps from complex spirit ID to ComplexSpirit.
export let complexSpiritMap = {};
export let dirtyComplexSpiritMap = {};

// Map from serial integer to SimpleSpiritType.
export let simpleSpiritTypeMap = {};
// Map from spirit class ID to list of ComplexSpiritType.
export let complexSpiritTypesMap = {};

// Maps from spirit serial integer to Tile.
export let simpleWorldTileMap = {};
export let simpleCircuitTileMap = {};
// Maps from spirit class ID to ComplexWorldTileFactory.
export let complexWorldTileFactoryMap = {};
export let complexCircuitTileFactoryMap = {};

export let recipeList = [];
export let recipeDataList = [];

import {EmptySpiritType, BarrierSpiritType, MatteriteSpiritType, EnergiteSpiritType, BlockSpiritType, WireSpiritType, PlayerSpiritType, MachineSpiritType, CircuitSpiritType} from "./spiritType.js";
import {SimpleWorldTile} from "./worldTile.js";
import {SimpleCircuitTile} from "./circuitTile.js";
import {ComplexWorldTileFactory, PlayerWorldTileFactory, MachineWorldTileFactory} from "./tileFactory.js";
import {Recipe, RecipeComponent} from "./recipe.js";

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
    new SimpleCircuitTile(tempSpirit);
}

new PlayerWorldTileFactory();
new MachineWorldTileFactory();
new ComplexWorldTileFactory("circuit");

function createSimpleRecipeComponent(spiritKey, count, offset) {
    let tempInteger = simpleSpiritSerialIntegerSet[spiritKey];
    if (typeof offset !== "undefined") {
        tempInteger += offset;
    }
    let tempType = simpleSpiritTypeMap[tempInteger];
    return new RecipeComponent(tempType, count);
}

function createMachineRecipeComponent(colorIndex) {
    let tempTypeList = complexSpiritTypesMap[complexSpiritClassIdSet.machine];
    for (let spiritType of tempTypeList) {
        if (spiritType.colorIndex === colorIndex) {
            return new RecipeComponent(spiritType, 1);
        }
    }
    return null;
}

new Recipe(
    [
        createSimpleRecipeComponent("matterite", 1),
        createSimpleRecipeComponent("energite", 1)
    ],
    new RecipeComponent(complexSpiritTypeSet.circuit, 1)
);
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new Recipe(
        [createSimpleRecipeComponent("matterite", 2)],
        createSimpleRecipeComponent("block", 1, colorIndex)
    );
    new Recipe(
        [
            createSimpleRecipeComponent("block", 1, colorIndex),
            createSimpleRecipeComponent("matterite", 1),
            createSimpleRecipeComponent("energite", 1)
        ],
        createMachineRecipeComponent(colorIndex)
    );
}

import {World} from "./world.js";

export let world = new World();


