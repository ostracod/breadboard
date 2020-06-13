
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
// Map from name to SimpleSpiritType.
export let simpleSpiritTypeSet = {};
// Map from name to ComplexSpiritType.
export let complexSpiritTypeSet = {};
// Map from name to SimpleWorldTile.
export let simpleWorldTileSet = {};

// Map from serial integer to SimpleSpirit.
export let simpleSpiritMap = {};
// Map from complex spirit ID to ComplexSpirit.
export let complexSpiritMap = {};
// Map from complex spirit ID to ComplexSpirit.
export let dirtyComplexSpiritMap = {};

// Map from serial integer to SimpleSpiritType.
export let simpleSpiritTypeMap = {};
// Map from spirit class ID to list of ComplexSpiritType.
export let complexSpiritTypesMap = {};

// Map from spirit serial integer to WorldTile.
export let simpleWorldTileMap = {};
// Map from spirit class ID to ComplexWorldTileFactory.
export let complexWorldTileFactoryMap = {};

export let recipeList = [];
export let recipeDataList = [];

import {EmptySpiritType, BarrierSpiritType, MatteriteSpiritType, EnergiteSpiritType, BlockSpiritType, WireSpiritType, PlayerSpiritType, MachineSpiritType, CircuitSpiritType} from "./spiritType.js";
import {SimpleWorldTile} from "./worldTile.js";
import {ComplexWorldTileFactory, PlayerWorldTileFactory, MachineWorldTileFactory} from "./worldTileFactory.js";
import {Recipe, RecipeComponent} from "./recipe.js";

// TODO: Rework all of this code down here.

export let emptySpiritType = new EmptySpiritType();
export let emptySpirit = emptySpiritType.spirit;
new BarrierSpiritType();
export let matteriteSpiritType = new MatteriteSpiritType();
new EnergiteSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new BlockSpiritType(colorIndex);
}
for (let arrangement = 0; arrangement < wireArrangementAmount; arrangement++) {
    new WireSpiritType(arrangement);
}

export let playerSpiritType = new PlayerSpiritType();
for (let colorIndex = 0; colorIndex < spiritColorAmount; colorIndex++) {
    new MachineSpiritType(colorIndex);
}
export let circuitSpiritType = new CircuitSpiritType();

for (let serialInteger in simpleSpiritMap) {
    let tempSpirit = simpleSpiritMap[serialInteger];
    new SimpleWorldTile(tempSpirit);
}
function getSimpleWorldTile(spiritKey) {
    let tempInteger = simpleSpiritSerialIntegerSet[spiritKey];
    return simpleWorldTileMap[tempInteger];
}
export let emptyWorldTile = getSimpleWorldTile("empty");
export let barrierWorldTile = getSimpleWorldTile("barrier");
export let matteriteWorldTile = getSimpleWorldTile("matterite");
export let energiteWorldTile = getSimpleWorldTile("energite");

new PlayerWorldTileFactory();
new MachineWorldTileFactory();
new ComplexWorldTileFactory(complexSpiritClassIdSet.circuit);

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
    new RecipeComponent(circuitSpiritType, 1)
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


