// gameState.js
// Core game state object and helpers

export const game = {
  spice: 0,
  spiceGoal: 0,
  units: [],
  buildings: [],
  enemies: [],
  spicePatches: [],
  selectedUnit: null,
  selectedHarvester: null,
  mouse: { x: 0, y: 0 },
  nextId: 1,
  gameOver: false,
  gameWon: false,
};

export const GRID_SIZE = 40;

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function createUnit(type, x, y, UnitTypes) {
  const unitDef = UnitTypes[type.toUpperCase()];
  return {
    id: game.nextId++,
    type,
    x,
    y,
    tx: null,
    ty: null,
    speed: unitDef.speed,
    size: unitDef.size,
    color: unitDef.color,
    label: unitDef.label,
    hp: unitDef.hp,
    attackPower: unitDef.attackPower,
    attackRange: unitDef.attackRange,
    carried: 0,
    capacity: unitDef.capacity,
    state: "idle",
    harvestTimer: 0,
    attackCooldown: 0,
  };
}

export function createBuilding(type, x, y, BuildingTypes) {
  const bDef = BuildingTypes[type.toUpperCase()];
  return {
    id: game.nextId++,
    type,
    x,
    y,
    size: bDef.size,
    color: bDef.color,
    hp: bDef.hp,
  };
}
