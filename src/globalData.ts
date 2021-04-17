
import { RecipeJson } from "./interfaces.js";
import { SimpleSpirit, ComplexSpirit } from "./spirit.js";
import { SimpleSpiritType, ComplexSpiritType, EmptySpiritType, BarrierSpiritType, MatteriteSpiritType, EnergiteSpiritType, BlockSpiritType, WireSpiritType, PlayerSpiritType, MachineSpiritType, WorldSpiritType, CircuitSpiritType } from "./spiritType.js";
import { SimpleWorldTile } from "./worldTile.js";
import { SimpleCircuitTile } from "./circuitTile.js";
import { AbstractComplexWorldTileFactory, ComplexWorldTileFactory, PlayerWorldTileFactory, MachineWorldTileFactory, WorldTileFactory, CircuitTileFactory, ComplexCircuitTileFactory } from "./tileFactory.js";
import { Recipe, RecipeComponent } from "./recipe.js";

export const simpleSpiritSerialIntegerSet = {
    empty: 0,
    barrier: 1,
    matterite: 2,
    energite: 3,
    block: 4,
    loading: 30,
    wire: 31,
};

export const complexSpiritClassIdSet = {
    world: 0,
    player: 1,
    machine: 2,
    circuit: 3,
};

export const spiritColorAmount = 16;
export const wireArrangementAmount = 12;
export const worldSize = 100;
export const circuitSize = 17;

export const simpleSpiritSet: {[name: string]: SimpleSpirit} = {};
export const simpleSpiritTypeSet: {[name: string]: SimpleSpiritType} = {};
export const complexSpiritTypeSet: {[name: string]: ComplexSpiritType} = {};
export const simpleWorldTileSet: {[name: string]: SimpleWorldTile} = {};
export const simpleCircuitTileSet: {[name: string]: SimpleCircuitTile} = {};

export const simpleSpiritMap: {[serialInteger: string]: SimpleSpirit} = {};
export const complexSpiritMap: {[id: string]: ComplexSpirit} = {};
export const dirtyComplexSpiritMap: {[id: string]: ComplexSpirit} = {};

export const simpleSpiritTypeMap: {[serialInteger: string]: SimpleSpiritType} = {};
export const complexSpiritTypesMap: {[classId: string]: ComplexSpiritType[]} = {};

export const simpleWorldTileMap: {[serialInteger: string]: SimpleWorldTile} = {};
export const simpleCircuitTileMap: {[serialInteger: string]: SimpleCircuitTile} = {};
export const complexWorldTileFactoryMap: {[classId: string]: AbstractComplexWorldTileFactory} = {};
export const complexCircuitTileFactoryMap: {[classId: string]: ComplexCircuitTileFactory} = {};

export const recipeList: Recipe[] = [];
export const recipeDataList: RecipeJson[] = [];

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

for (const serialInteger in simpleSpiritMap) {
    const tempSpirit = simpleSpiritMap[serialInteger];
    new SimpleWorldTile(tempSpirit);
    new SimpleCircuitTile(tempSpirit);
}

new PlayerWorldTileFactory();
new MachineWorldTileFactory();
new ComplexWorldTileFactory("circuit");

export const worldTileFactory = new WorldTileFactory();
export const circuitTileFactory = new CircuitTileFactory();

const createSimpleRecipeComponent = (
    spiritKey: string,
    count: number,
    offset = 0,
): RecipeComponent => {
    const tempInteger = simpleSpiritSerialIntegerSet[spiritKey] + offset;
    const tempType = simpleSpiritTypeMap[tempInteger];
    return new RecipeComponent(tempType, count);
};

const createMachineRecipeComponent = (colorIndex: number): RecipeComponent => {
    const tempTypeList = complexSpiritTypesMap[complexSpiritClassIdSet.machine] as MachineSpiritType[];
    for (const spiritType of tempTypeList) {
        if (spiritType.colorIndex === colorIndex) {
            return new RecipeComponent(spiritType, 1);
        }
    }
    return null;
};

new Recipe(
    [
        createSimpleRecipeComponent("matterite", 1),
        createSimpleRecipeComponent("energite", 1),
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
            createSimpleRecipeComponent("energite", 1),
        ],
        createMachineRecipeComponent(colorIndex)
    );
}


