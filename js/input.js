// input.js
// Handles mouse and keyboard input for the game

export function setupInput(canvas, game, logMessage, attemptBuildBarracks, attemptTrainTrooper) {
  let rect = null;
  function updateMouseFromEvent(e) {
    rect = rect || canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
    return { x: game.mouse.x, y: game.mouse.y };
  }
  canvas.addEventListener("mousemove", (e) => updateMouseFromEvent(e));
  // Hover detection (unit/building under cursor)
  canvas.addEventListener('mousemove', (e) => {
    const m = updateMouseFromEvent(e);
    const prevUnit = game.hoveredUnit;
    const prevBuilding = game.hoveredBuilding;
    const unit = game.units.find(u => Math.hypot(u.x - m.x, u.y - m.y) < u.size / 2);
    game.hoveredUnit = unit || null;
    const building = game.buildings.find(b => Math.abs(b.x - m.x) < b.size / 2 && Math.abs(b.y - m.y) < b.size / 2);
    game.hoveredBuilding = building || null;
  });

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const m = updateMouseFromEvent(e);
    const building = game.buildings.find(b => Math.abs(b.x - m.x) < b.size / 2 && Math.abs(b.y - m.y) < b.size / 2);
    const menu = document.getElementById('context-menu');
    if (building && building.type === 'barracks') {
      menu.style.left = (e.clientX + 2) + 'px';
      menu.style.top = (e.clientY + 2) + 'px';
      menu.style.display = 'block';
      // attach action
      const train = document.getElementById('cm-build-trooper');
      train.onclick = () => { attemptTrainTrooper(); menu.style.display='none'; };
      return;
    }
    if (menu) menu.style.display = 'none';
  });

  // Box select state
  let boxStart = null;
  let isBoxSelecting = false;

  canvas.addEventListener("mousedown", (e) => {
    if (game.gameOver) return;
    if (e.button !== 0) return; // Left click only

    const m = updateMouseFromEvent(e);

    // Start box-select if shift is held or drag begins
    if (e.shiftKey) {
      boxStart = { x: m.x, y: m.y };
      isBoxSelecting = true;
      return;
    }

    // Check for unit selection (click)
    let clickedUnit = game.units.find(u => Math.hypot(u.x - m.x, u.y - m.y) < u.size / 2);
    if (clickedUnit) {
      if (e.shiftKey) {
        // toggle in multi-select set
        if (!game.multiSelect) game.multiSelect = new Set();
        if (game.multiSelect.has(clickedUnit.id)) game.multiSelect.delete(clickedUnit.id);
        else game.multiSelect.add(clickedUnit.id);
      } else {
        game.selectedUnit = clickedUnit;
        if (clickedUnit.type === "harvester") game.selectedHarvester = clickedUnit;
        else game.selectedHarvester = null;
        game.multiSelect = null;
      }
      return;
    }

    // Check for building selection
    let clickedBuilding = game.buildings.find(b => Math.abs(b.x - m.x) < b.size / 2 && Math.abs(b.y - m.y) < b.size / 2);
    if (clickedBuilding) {
      game.selectedUnit = null;
      game.selectedHarvester = null;
      game.multiSelect = null;
      return;
    }

    // If a harvester selected and click on spice patch => set harvest target
    if (game.selectedHarvester) {
      let patch = game.spicePatches.find(s => {
        let dx = s.x - m.x;
        let dy = s.y - m.y;
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

    // Otherwise move selected unit(s) to clicked location
    if (game.multiSelect && game.multiSelect.size > 0) {
      const targets = Array.from(game.multiSelect).map(id => game.units.find(u => u.id === id)).filter(Boolean);
      for (let u of targets) {
        u.tx = m.x + (Math.random() - 0.5) * 8;
        u.ty = m.y + (Math.random() - 0.5) * 8;
        u.state = "moving";
      }
    } else if (game.selectedUnit) {
      game.selectedUnit.tx = m.x;
      game.selectedUnit.ty = m.y;
      game.selectedUnit.state = "moving";
    }
  });

  // Mouse up to finish box select
  canvas.addEventListener('mouseup', (e) => {
    if (!isBoxSelecting || !boxStart) return;
    const m = updateMouseFromEvent(e);
    const x1 = Math.min(boxStart.x, m.x), x2 = Math.max(boxStart.x, m.x);
    const y1 = Math.min(boxStart.y, m.y), y2 = Math.max(boxStart.y, m.y);
    game.multiSelect = new Set();
    for (let u of game.units) {
      if (u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2) game.multiSelect.add(u.id);
    }
    isBoxSelecting = false;
    boxStart = null;
  });

  window.addEventListener("keydown", (e) => {
    if (game.gameOver) return;
    const k = e.key.toLowerCase();
    if (k === "b") {
      attemptBuildBarracks(game.mouse.x, game.mouse.y);
    } else if (k === "t") {
      attemptTrainTrooper();
    } else if (k === ' ') {
      // center on base
      const base = game.buildings.find(b => b.type === 'base');
      if (base) {
        if (!game.camera) game.camera = { x: 0, y: 0, zoom: 1 };
        game.camera.x = base.x - 400;
        game.camera.y = base.y - 300;
      }
    }
    // Level picker: Q
    if (k === 'q') {
      // prompt for level number (simple prompt UI)
      const val = prompt('Jump to level number: (1,2,...)');
      const n = parseInt(val, 10);
      if (!isNaN(n) && window.jumpToLevel) {
        window.jumpToLevel(n);
      }
    }
    // Close context menu on Escape
    if (e.key === 'Escape' || e.key === 'Esc') {
      const menu = document.getElementById('context-menu');
      if (menu) menu.style.display = 'none';
    }
  });

  // Close context menu when clicking anywhere outside it
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('context-menu');
    if (!menu) return;
    if (!e.target.closest || !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
}
