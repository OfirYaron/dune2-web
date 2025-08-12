// input.js
// Handles mouse and keyboard input for the game

export function setupInput(canvas, game, logMessage, attemptBuildBarracks, attemptTrainTrooper) {
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  canvas.addEventListener("mousedown", (e) => {
    if (game.gameOver) return;
    if (e.button !== 0) return; // Left click only

    // Check for unit selection
    let clickedUnit = game.units.find(u => {
      return Math.hypot(u.x - game.mouse.x, u.y - game.mouse.y) < u.size / 2;
    });
    if (clickedUnit) {
      game.selectedUnit = clickedUnit;
      if (clickedUnit.type === "harvester") game.selectedHarvester = clickedUnit;
      else game.selectedHarvester = null;
      return;
    }

    // Check for building selection
    let clickedBuilding = game.buildings.find(b => {
      return Math.abs(b.x - game.mouse.x) < b.size / 2 && Math.abs(b.y - game.mouse.y) < b.size / 2;
    });
    if (clickedBuilding) {
      game.selectedUnit = null;
      game.selectedHarvester = null;
      return;
    }

    // If a harvester selected and click on spice patch => set harvest target
    if (game.selectedHarvester) {
      let patch = game.spicePatches.find(s => {
        let dx = s.x - game.mouse.x;
        let dy = s.y - game.mouse.y;
        return dx * dx + dy * dy < s.radius * s.radius;
      });
      if (patch && patch.amount > 0) {
        game.selectedHarvester.state = "movingToSpice";
        game.selectedHarvester.targetPatchId = patch.id;
        game.selectedHarvester.tx = patch.x + (Math.random() - 0.5) * 10;
        game.selectedHarvester.ty = patch.y + (Math.random() - 0.5) * 10;
        game.selectedHarvester.harvestTimer = 0;
        logMessage("Harvester ordered to harvest spice.");
        return;
      }
    }

    // Otherwise move selected unit to clicked location
    if (game.selectedUnit) {
      game.selectedUnit.tx = game.mouse.x;
      game.selectedUnit.ty = game.mouse.y;
      game.selectedUnit.state = "moving";
    }
  });

  window.addEventListener("keydown", (e) => {
    if (game.gameOver) return;
    if (e.key.toLowerCase() === "b") {
      attemptBuildBarracks(game.mouse.x, game.mouse.y);
    } else if (e.key.toLowerCase() === "t") {
      attemptTrainTrooper();
    }
  });
}
