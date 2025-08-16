import { game, createBuilding, createUnit } from './gameState.js';
import { UnitTypes } from './entities.js';
import { logMessage } from './ui.js';

function createEnemyUnit(type, x, y) {
  const unitDef = UnitTypes[type.toUpperCase()];
  return {
    id: game.nextId++,
    type,
    x,
    y,
    tx: null,
    ty: null,
    speed: unitDef.speed * 0.8,
    size: unitDef.size,
    color: "#bb4444",
    label: unitDef.label,
    hp: unitDef.hp,
    attackPower: unitDef.attackPower,
    attackRange: unitDef.attackRange,
    carried: 0,
    capacity: unitDef.capacity,
    state: "patrol",
    isEnemy: true,
    patrolPoints: [
      { x: x - 60, y: y - 40 },
      { x: x + 60, y: y + 40 },
    ],
    patrolIndex: 0,
    patrolWait: 0,
    attackCooldown: 0,
  };
}

function loadLevel2() {
  logMessage("Level 2 started: More spice, enemies, and a bigger challenge.");

  game.spice = 0;
  game.spiceGoal = 400;
  game.units = [];
  game.buildings = [];
  game.spicePatches = [];
  game.selectedUnit = null;
  game.selectedHarvester = null;
  game.gameOver = false;
  game.gameWon = false;

  // Player base
  game.buildings.push(createBuilding("base", 100, 300));

  // Player harvester only
  game.units.push(createUnit("harvester", 130, 320));

  // Player barracks
  game.buildings.push(createBuilding("barracks", 170, 350));

  // Spice patches
  game.spicePatches.push(
    { id: 1, x: 450, y: 200, radius: 25, amount: 200 },
    { id: 2, x: 520, y: 350, radius: 30, amount: 180 },
    { id: 3, x: 600, y: 150, radius: 20, amount: 220 }
  );

  // Enemy base & barracks
  game.buildings.push(createBuilding("enemy_base", 700, 200));
  game.buildings.push(createBuilding("enemy_barracks", 740, 250));

  // Enemy troops patrolling near enemy base
  for (let i = 0; i < 2; i++) {
    const enemy = createEnemyUnit("trooper", 700 + i * 30, 230 + i * 15);
    game.units.push(enemy);
  }
}

loadLevel2();
