
import {SimpleSpirit} from "./spirit.js";
import {SimpleSpiritType, ComplexSpiritType} from "./spiritType.js";
import {WorldTile} from "./worldTile.js";
import {CircuitTile} from "./circuitTile.js";

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
    world: 0,
    player: 1,
    machine: 2,
    circuit: 3
};

export const spiritColorAmount = 16;
export const wireArrangementAmount = 12;
export const worldSize = 100;
export const circuitSize = 17;

export let simpleSpiritSet: {[name: string]: SimpleSpirit} = {};
export let simpleSpiritTypeSet: {[name: string]: SimpleSpiritType} = {};
export let complexSpiritTypeSet: {[name: string]: ComplexSpiritType} = {};
export let simpleWorldTileSet: {[name: string]: WorldTile} = {};
export let simpleCircuitTileSet: {[name: string]: CircuitTile} = {};

// Map from serial integer to SimpleSpirit.
export let simpleSpiritMap = {};
// Maps from complex spirit ID to ComplexSpirit.
export let complexSpiritMap = {};
export let dirtyComplexSpiritMap = {};

// Map from serial integer to SimpleSpiritType.
export let simpleSpiritTypeMap = {};
// Map from spirit class ID to list of ComplexSpiritType.
export let complexSpiritTypesMap = {};

export let simpleWorldTileMap: {[serialInteger: string]: WorldTile} = {};
export let simpleCircuitTileMap: {[serialInteger: string]: CircuitTile} = {};
// Maps from spirit class ID to ComplexWorldTileFactory.
export let complexWorldTileFactoryMap = {};
export let complexCircuitTileFactoryMap = {};

export let recipeList = [];
export let recipeDataList = [];

import {EmptySpiritType, BarrierSpiritType, MatteriteSpiritType, EnergiteSpiritType, BlockSpiritType, WireSpiritType, PlayerSpiritType, MachineSpiritType, WorldSpiritType, CircuitSpiritType} from "./spiritType.js";
import {SimpleWorldTile} from "./worldTile.js";
import {SimpleCircuitTile} from "./circuitTile.js";
import {ComplexWorldTileFactory, PlayerWorldTileFactory, MachineWorldTileFactory, WorldTileFactory, CircuitTileFactory} from "./tileFactory.js";
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
new WorldSpiritType();
new CircuitSpiritType();

for (let serialInteger in simpleSpiritMap) {
    let tempSpirit = simpleSpiritMap[serialInteger];
    new SimpleWorldTile(tempSpirit);
    new SimpleCircuitTile(tempSpirit);
}

new PlayerWorldTileFactory();
new MachineWorldTileFactory();
new ComplexWorldTileFactory("circuit");

export let worldTileFactory = new WorldTileFactory();
export let circuitTileFactory = new CircuitTileFactory();

function createSimpleRecipeComponent(spiritKey, count, offset = 0) {
    let tempInteger = simpleSpiritSerialIntegerSet[spiritKey] + offset;
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


