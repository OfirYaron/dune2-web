// Level 1: basic harvesting and building training

function loadLevel1() {
  logMessage("Level 1 started: Harvest spice and build troops.");

  game.spice = 0;
  game.spiceGoal = 200;
  game.units = [];
  game.buildings = [];
  game.spicePatches = [];
  game.selectedUnit = null;
  game.selectedHarvester = null;
  game.gameOver = false;
  game.gameWon = false;

  // Add Base building
  game.buildings.push(createBuilding("base", 100, 300));

  // Add one harvester
  game.units.push(createUnit("harvester", 130, 320));

  // Add spice patches
  game.spicePatches.push(
    { id: 1, x: 450, y: 200, radius: 25, amount: 200 },
    { id: 2, x: 500, y: 350, radius: 30, amount: 150 }
  );
}

loadLevel1();
