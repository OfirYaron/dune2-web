import { game, GRID_SIZE, createUnit, createBuilding } from './gameState.js';
import { setupInput } from './input.js';
import { UnitTypes, BuildingTypes } from './entities.js';
import { updateHUD, logMessage } from './ui.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

setupInput(canvas, game, logMessage, attemptBuildBarracks, attemptTrainTrooper);

function attemptBuildBarracks(x, y) {
  if (game.spice < BuildingTypes.BARRACKS.cost) {
    logMessage("Not enough spice to build Barracks (100).");
    return;
  }
  // Clamp within canvas with some padding
  x = Math.min(Math.max(x, 40), canvas.width - 40);
  y = Math.min(Math.max(y, 40), canvas.height - 40);
  game.buildings.push(createBuilding("barracks", x, y));
  game.spice -= BuildingTypes.BARRACKS.cost;
  logMessage("Barracks built.");
}

function attemptTrainTrooper() {
  const barracks = game.buildings.find(b => b.type === "barracks");
  if (!barracks) {
    logMessage("No Barracks available. Press B to build one.");
    return;
  }
  if (game.spice < UnitTypes.TROOPER.cost) {
    logMessage("Not enough spice to train Trooper (50).");
    return;
  }
  if (!barracks.trainQueue) barracks.trainQueue = [];
  barracks.trainQueue.push({ timeLeft: 2500 });
  game.spice -= UnitTypes.TROOPER.cost;
  logMessage("Trooper training started.");
}

// Game update loop
function update(dt) {
  if (game.gameOver) return;

  // Barracks training
  for (let b of game.buildings) {
    if (b.type === "barracks" && b.trainQueue && b.trainQueue.length > 0) {
      b.trainQueue[0].timeLeft -= dt;
      if (b.trainQueue[0].timeLeft <= 0) {
        b.trainQueue.shift();
        const spawnX = b.x + b.size;
        const spawnY = b.y;
        game.units.push(createUnit("trooper", spawnX, spawnY));
        logMessage("Trooper trained.");
      }
    }
  }

  // Units update
  for (let u of game.units) {
    // Movement
    if (u.tx !== null && u.ty !== null) {
      let dx = u.tx - u.x;
      let dy = u.ty - u.y;
      let distToTarget = Math.hypot(dx, dy);
      let maxDist = (u.speed * dt) / 1000;
      if (distToTarget < maxDist) {
        u.x = u.tx;
        u.y = u.ty;
        u.tx = null;
        u.ty = null;
        if (u.state === "moving") u.state = "idle";
      } else {
        u.x += (dx / distToTarget) * maxDist;
        u.y += (dy / distToTarget) * maxDist;
      }
    }

    // Harvester logic
    if (u.type === "harvester") {
      if (u.state === "movingToSpice" && u.tx !== null && u.ty !== null) {
        // Close enough to patch?
        if (Math.hypot(u.x - u.tx, u.y - u.ty) < 6) {
          u.state = "harvesting";
          u.harvestTimer = 0;
          u.lastPatchId = u.targetPatchId;
        }
      } else if (u.state === "harvesting") {
        let patch = game.spicePatches.find(s => s.id === u.targetPatchId);
        if (!patch || patch.amount <= 0) {
          u.state = "idle";
          u.targetPatchId = null;
          continue;
        }
        u.harvestTimer += dt;
        if (u.harvestTimer > 400) {
          u.harvestTimer = 0;
          let canTake = u.capacity - u.carried;
          let taken = Math.min(10, canTake, patch.amount);
          u.carried += taken;
          patch.amount -= taken;
          if (u.carried >= u.capacity) {
            u.state = "returning";
            const base = game.buildings.find(b => b.type === "base");
            if (base) {
              u.tx = base.x;
              u.ty = base.y;
            }
          }
        }
      } else if (u.state === "returning") {
        const base = game.buildings.find(b => b.type === "base");
        if (!base) continue;
        if (Math.hypot(u.x - base.x, u.y - base.y) < 18) {
          u.state = "unloading";
          u.unloadTimer = 0;
        }
      } else if (u.state === "unloading") {
        u.unloadTimer += dt;
        if (u.unloadTimer >= 400 && u.carried > 0) { // same as harvest time
          u.unloadTimer = 0;
          let toUnload = Math.min(10, u.carried);
          game.spice += toUnload;
          u.carried -= toUnload;
          if (u.carried === 0) {
            u.state = "idle";
            u.tx = null;
            u.ty = null;
            logMessage("Harvester finished unloading spice.");
          } else {
            logMessage(`Harvester unloaded ${toUnload} spice...`);
          }
        }
      }
    }

    // Trooper combat
    if (u.type === "trooper" && !isEnemyUnit(u)) {
      for (let enemy of game.units) {
        if (isEnemyUnit(enemy) && Math.hypot(u.x - enemy.x, u.y - enemy.y) <= UnitTypes.TROOPER.attackRange) {
          if (!u.attackCooldown || u.attackCooldown <= 0) {
            enemy.hp -= u.attackPower || 15;
            u.attackCooldown = 800;
            logMessage(`Trooper attacks enemy! [Attacker: id=${u.id||'?'} hp=${u.hp}] [Target: id=${enemy.id||'?'} hp=${enemy.hp}]`);
          } else {
            u.attackCooldown -= dt;
          }
        }
      }
    }
    // Enemy troop combat
    if (u.type === "trooper" && isEnemyUnit(u)) {
      for (let player of game.units) {
        if (!isEnemyUnit(player) && Math.hypot(u.x - player.x, u.y - player.y) <= UnitTypes.TROOPER.attackRange) {
          if (!u.attackCooldown || u.attackCooldown <= 0) {
            player.hp -= u.attackPower || 18;
            u.attackCooldown = 800;
            logMessage(`Enemy trooper attacks! [Attacker: id=${u.id||'?'} hp=${u.hp}] [Target: id=${player.id||'?'} hp=${player.hp}]`);
          } else {
            u.attackCooldown -= dt;
          }
        }
      }
    }
    // Harvester crush logic (kills any trooper it overlaps)
    if (u.type === "harvester") {
      for (let target of game.units) {
        if (target !== u && target.type === "trooper" && Math.hypot(u.x - target.x, u.y - target.y) < (u.size + target.size) / 2) {
          target.hp = 0;
          logMessage(`Trooper crushed by harvester! [Harvester: id=${u.id||'?'} hp=${u.hp}] [Trooper: id=${target.id||'?'} hp=${target.hp}]`);
        }
      }
    }
    // Vehicle crush logic
    if ((u.type === "harvester") || (UnitTypes[u.type.toUpperCase()]?.isVehicle)) {
      for (let target of game.units) {
        if (target !== u && target.type === "trooper" && !isEnemyUnit(u) && Math.hypot(u.x - target.x, u.y - target.y) < (u.size + target.size) / 2) {
          target.hp = 0;
          logMessage('Trooper crushed by vehicle!');
        }
      }
    }
  }

  // Remove depleted spice patches
  game.spicePatches = game.spicePatches.filter(s => s.amount > 0);

  // Remove dead units (hp <= 0)
  game.units = game.units.filter(u => u.hp > 0);

  // After unloading spice, auto-return to patch if not depleted
  for (let u of game.units) {
    if (u.type === "harvester" && u.state === "idle" && u.lastPatchId) {
      let patch = game.spicePatches.find(s => s.id === u.lastPatchId);
      if (patch && patch.amount > 0) {
        u.state = "movingToSpice";
        u.targetPatchId = patch.id;
        u.tx = patch.x + (Math.random() - 0.5) * 10;
        u.ty = patch.y + (Math.random() - 0.5) * 10;
        u.harvestTimer = 0;
        logMessage("Harvester auto-returning to spice patch.");
      }
    }
  }
}

function drawGrid() {
  ctx.strokeStyle = "#b0a060";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// --- Graphics & Animation Foundation ---
// TODO: Replace fillRect with sprite or SVG rendering for units/buildings
// TODO: Add animation state and frame for units (e.g., walking, harvesting, attacking)
// TODO: Implement explosion/combat animation rendering
// TODO: Add camera object for panning/zoom (initial stub)
let camera = {
  x: 0,
  y: 0,
  zoom: 1,
};
// --- End Graphics & Animation Foundation ---

function draw() {
  // Clear canvas with sand color
  ctx.save();
  ctx.setTransform(camera.zoom, 0, 0, camera.zoom, -camera.x, -camera.y);
  ctx.fillStyle = "#c2b280";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // Draw spice patches
  for (let patch of game.spicePatches) {
    const radius = patch.radius;
    // Draw patch circle
    ctx.fillStyle = "#ff7f00"; // bright orange spice
    ctx.beginPath();
    ctx.arc(patch.x, patch.y, radius, 0, Math.PI * 2);
    ctx.fill();
    // Border
    ctx.strokeStyle = "#663300";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Amount text
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(patch.amount), patch.x, patch.y + 5);
  }

  // Draw buildings (top-down, more realistic)
  for (let b of game.buildings) {
    ctx.save();
    ctx.translate(b.x, b.y);
    if (b.type === "base") {
      // Central dome
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#88a";
      ctx.fill();
      ctx.strokeStyle = "#2233AA";
      ctx.lineWidth = 3;
      ctx.stroke();
      // Side wings
      ctx.fillStyle = "#2233AA";
      ctx.fillRect(-28, -8, 16, 16);
      ctx.fillRect(12, -8, 16, 16);
      // Central platform
      ctx.fillStyle = "#444";
      ctx.fillRect(-12, 14, 24, 8);
      // Roof hatch
      ctx.fillStyle = "#fff";
      ctx.fillRect(-4, -6, 8, 8);
    } else if (b.type === "barracks") {
      // Main hall
      ctx.fillStyle = "#338833";
      ctx.fillRect(-20, -14, 40, 28);
      // Roof details
      ctx.fillStyle = "#2a2";
      ctx.fillRect(-20, -18, 40, 6);
      // Side rooms
      ctx.fillStyle = "#3f3";
      ctx.fillRect(-28, -8, 8, 16);
      ctx.fillRect(20, -8, 8, 16);
      // Door
      ctx.fillStyle = "#fff";
      ctx.fillRect(-6, 6, 12, 8);
      // Windows
      ctx.fillStyle = "#afa";
      ctx.fillRect(-16, -6, 8, 6);
      ctx.fillRect(8, -6, 8, 6);
    } else if (b.type === "enemy_base") {
      // Enemy base: hexagonal, red, with radar
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        let angle = Math.PI / 3 * i - Math.PI / 6;
        let x = Math.cos(angle) * 18;
        let y = Math.sin(angle) * 18;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "#AA2222";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Radar dish
      ctx.beginPath();
      ctx.arc(0, -12, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#f88";
      ctx.stroke();
    } else if (b.type === "enemy_barracks") {
      // Enemy barracks: bunker with hatch and vents
      ctx.fillStyle = "#992222";
      ctx.fillRect(-18, -10, 36, 20);
      // Hatch
      ctx.fillStyle = "#fff";
      ctx.fillRect(-6, 2, 12, 6);
      // Vents
      ctx.fillStyle = "#f33";
      ctx.fillRect(-14, -8, 8, 4);
      ctx.fillRect(6, -8, 8, 4);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(-18, -10, 36, 20);
    }
    // Label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      b.type === "enemy_base" ? "Enemy Base" :
      b.type === "enemy_barracks" ? "Enemy Barracks" :
      b.type.charAt(0).toUpperCase() + b.type.slice(1),
      0, 34
    );
    ctx.restore();
  }

  // Draw units (harvester as truck)
  for (let u of game.units) {
    ctx.save();
    ctx.translate(u.x, u.y);
    if (u.type === "harvester") {
      // Truck body
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(-12, -6, 24, 12); // main body
      // Cab
      ctx.fillStyle = "#fff";
      ctx.fillRect(6, -8, 8, 8); // cab
      // Tank
      ctx.fillStyle = "#888";
      ctx.fillRect(-12, -10, 12, 8); // tank
      // Wheels
      ctx.fillStyle = "#222";
      ctx.beginPath(); ctx.arc(-8, 8, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 8, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, 8, 3, 0, Math.PI * 2); ctx.fill();
      // Outline
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -6, 24, 12);
    } else if (u.type === "trooper") {
      if (isEnemyUnit(u)) {
        // Enemy: red body, helmet, gun
        ctx.fillStyle = "#bb4444";
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = "#fff";
        ctx.fillRect(-6, -12, 12, 6);
        ctx.fillStyle = "#222";
        ctx.fillRect(2, 0, 8, 3);
        ctx.strokeStyle = "#f33";
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -8, 16, 16);
        // Enemy label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("ENEMY", 0, 28);
      } else {
        // Trooper: blue body, helmet, gun
        ctx.fillStyle = "#88CCFF";
        ctx.fillRect(-8, -8, 16, 16); // body
        ctx.fillStyle = "#fff";
        ctx.fillRect(-6, -12, 12, 6); // helmet
        // Gun
        ctx.fillStyle = "#222";
        ctx.fillRect(2, 0, 8, 3);
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -8, 16, 16);
      }
    }
    // Unit label
    ctx.fillStyle = "#000";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(u.label, 0, 18);
    // HP bar (above)
    const maxHp = UnitTypes[u.type.toUpperCase()]?.hp || 100;
    const hpRatio = Math.max(0, Math.min(u.hp / maxHp, 1));
    ctx.fillStyle = hpRatio > 0.5 ? "#0f0" : hpRatio > 0.2 ? "#fa0" : "#f00";
    ctx.fillRect(-8, -14, 16 * hpRatio, 4);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(-8, -14, 16, 4);
    // Spice bar (below)
    const spiceRatio = Math.max(0, Math.min(u.carried / (u.capacity || 100), 1));
    ctx.fillStyle = "#ff9800"; // orange for spice
    ctx.fillRect(-8, 12, 16 * spiceRatio, 4);
    ctx.strokeStyle = "#663300";
    ctx.strokeRect(-8, 12, 16, 4);
    ctx.restore();
  }

  // Draw selection box around selected unit
  if (game.selectedUnit) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      game.selectedUnit.x - game.selectedUnit.size / 2 - 3,
      game.selectedUnit.y - game.selectedUnit.size / 2 - 3,
      game.selectedUnit.size + 6,
      game.selectedUnit.size + 6
    );
  }
  ctx.restore();
}

function checkWinLose() {
  if (game.gameOver) return;

  // Win condition: spice >= goal and all enemy buildings destroyed
  const enemyBuildings = game.buildings.filter(b => b.type.startsWith("enemy"));
  if (game.spice >= game.spiceGoal && enemyBuildings.length === 0) {
    game.gameOver = true;
    game.gameWon = true;
    logMessage("You Win! Mission accomplished.");
    showEndScreen(true);
  }

  // Lose condition: base destroyed or all harvesters destroyed
  const base = game.buildings.find(b => b.type === "base");
  if (!base) {
    game.gameOver = true;
    game.gameWon = false;
    logMessage("You Lose! Your base was destroyed.");
    showEndScreen(false);
  }

  const harvesters = game.units.filter(u => u.type === "harvester");
  if (harvesters.length === 0) {
    game.gameOver = true;
    game.gameWon = false;
    logMessage("You Lose! All harvesters lost.");
    showEndScreen(false);
  }
}

function showEndScreen(win) {
  const message = document.createElement("div");
  message.style.position = "fixed";
  message.style.top = "50%";
  message.style.left = "50%";
  message.style.transform = "translate(-50%, -50%)";
  message.style.background = win ? "rgba(20,100,20,0.9)" : "rgba(150,20,20,0.9)";
  message.style.color = "#fff";
  message.style.fontSize = "48px";
  message.style.padding = "40px 60px";
  message.style.borderRadius = "10px";
  message.style.zIndex = "9999";
  message.style.textAlign = "center";
  message.style.fontWeight = "bold";
  message.textContent = win ? "YOU WIN!" : "YOU LOSE!";
  document.body.appendChild(message);
  if (win) {
    setTimeout(() => {
      message.remove();
      if (currentLevel === 1) {
        loadLevel(2);
      } else {
        showObjective('Congratulations! You completed all levels.');
      }
    }, 2500);
  }
}

// Move loadLevel definition above window.onload
let currentLevel = 1;
window.currentLevel = currentLevel;
function loadLevel(levelNum) {
  window.currentLevel = currentLevel = levelNum;
  if (levelNum === 1) {
    import('./level1.js').then(() => {
      // HUD now handles objective
      refreshObjectiveText();
      // Ensure HUD is up-to-date after level load
      showHUD(game);
    });
  } else if (levelNum === 2) {
    import('./level2.js').then(() => {
      // HUD now handles objective
      refreshObjectiveText();
      // Ensure HUD is up-to-date after level load
      showHUD(game);
    });
  }
}

// --- HUD Helper Functions ---
function getHUDText(game) {
  const barracksCount = game.buildings.filter(b => b.type === 'barracks').length;
  const trooperCount = game.units.filter(u => u.type === 'trooper' && !isEnemyUnit(u)).length;
  const harvester = game.units.find(u => u.type === 'harvester');
  const carry = harvester ? harvester.carried : 0;
  return `
    <span style="margin:0 24px;">Spice: <b>${game.spice}</b></span>
    <span style="margin:0 24px;">Carry: <b>${carry}</b></span>
    <span style="margin:0 24px;">Barracks: <b>${barracksCount}</b></span>
    <span style="margin:0 24px;">Troops: <b>${trooperCount}</b></span>
  `;
}
function getObjectiveText(level) {
  if (level === 1) return 'Objective: Harvest 200 spice.';
  if (level === 2) return 'Objective: Harvest 400 spice and destroy all enemy buildings.';
  return '';
}

// Ensure the objective text in the HUD is refreshed when the current level changes
function refreshObjectiveText() {
  const el = document.getElementById('objective-text');
  if (el) {
    el.textContent = getObjectiveText(window.currentLevel || currentLevel || 1);
  }
}
// --- End HUD Helper Functions ---

// --- HUD Header ---
function showHUD(game) {
  let hud = document.getElementById('hud-header');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'hud-header';
    hud.style.position = 'fixed';
    hud.style.top = '0';
    hud.style.left = '0';
    hud.style.width = '100%';
    hud.style.height = 'auto';
    hud.style.background = 'rgba(200,180,80,0.97)';
    hud.style.color = '#222';
    hud.style.fontSize = '18px';
    hud.style.zIndex = '10001';
    hud.style.display = 'flex';
    hud.style.flexDirection = 'column';
    hud.style.alignItems = 'center';
    hud.style.justifyContent = 'center';
    hud.style.fontWeight = 'bold';
    hud.style.borderBottom = '2px solid #444';
    hud.style.boxShadow = '0 2px 8px #0004';
    hud.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;width:100%;height:48px;">
        <span id="hud-stats-values">${getHUDText(game)}</span>
        <button id="controls-toggle" style="background:#222;color:#fff;border:none;padding:4px 12px;margin-left:24px;border-radius:6px;cursor:pointer;">Controls</button>
        <button id="objective-toggle" style="background:#222;color:#fff;border:none;padding:4px 12px;margin-left:12px;border-radius:6px;cursor:pointer;">Objective</button>
      </div>
      <div id="controls-details" style="display:none;padding:8px 24px 16px 24px;width:100%;background:rgba(30,30,60,0.97);color:#fff;">
        <ul style="margin:0;padding-left:18px;">
          <li><b>Left Click</b>: Select units/buildings, set move/harvest target</li>
          <li><b>B</b>: Build Barracks at mouse location</li>
          <li><b>T</b>: Train Trooper (if Barracks exists)</li>
          <li><b>Q</b>: Level Picker (jump to any level)</li>
          <li><b>Middle Mouse</b>: Pan camera</li>
          <li><b>Mouse Wheel</b>: Zoom camera</li>
        </ul>
      </div>
      <div id="objective-details" style="display:none;padding:8px 32px;width:100%;background:rgba(40,40,80,0.95);color:#fff;font-size:22px;text-align:center;">
        <span id="objective-text">${getObjectiveText(window.currentLevel || 1)}</span>
      </div>
    `;
    document.body.appendChild(hud);
    document.getElementById('controls-toggle').onclick = () => {
      const details = document.getElementById('controls-details');
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('objective-toggle').onclick = () => {
      const details = document.getElementById('objective-details');
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    };
  } else {
    // Only update stats values, not the whole HUD
    const statsSpan = document.getElementById('hud-stats-values');
    if (statsSpan) {
      statsSpan.innerHTML = getHUDText(game);
    }
    // Refresh the objective text as well (preserve visibility state of objective-details)
    const objectiveEl = document.getElementById('objective-text');
    if (objectiveEl) {
      objectiveEl.textContent = getObjectiveText(window.currentLevel || currentLevel || 1);
    }
    // Do not touch controls-details or objective-details so their state is preserved
  }
}
// --- End HUD Header ---

// --- Camera Panning & Zoom Input Stub ---
canvas.addEventListener('wheel', (e) => {
  camera.zoom = Math.max(0.5, Math.min(2, camera.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
});
let isPanning = false;
let panStart = { x: 0, y: 0 };
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1) { // Middle mouse button
    isPanning = true;
    panStart.x = e.clientX;
    panStart.y = e.clientY;
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (isPanning) {
    camera.x -= (e.clientX - panStart.x) / camera.zoom;
    camera.y -= (e.clientY - panStart.y) / camera.zoom;
    panStart.x = e.clientX;
    panStart.y = e.clientY;
  }
});
window.addEventListener('mouseup', () => { isPanning = false; });
// --- End Camera Panning & Zoom Input Stub ---

// --- Selection logic ---
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1) { // Middle mouse button
    isPanning = true;
    panStart.x = e.clientX;
    panStart.y = e.clientY;
    return;
  }
  // Only allow selection of player units (not enemy)
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / camera.zoom + camera.x;
  const my = (e.clientY - rect.top) / camera.zoom + camera.y;
  let found = null;
  for (let u of game.units) {
    if (!isEnemyUnit(u) && Math.abs(u.x - mx) < u.size / 2 && Math.abs(u.y - my) < u.size / 2) {
      found = u;
      break;
    }
  }
  game.selectedUnit = found;
});
// --- End Selection logic ---

let lastFrame = performance.now();
function gameLoop() {
  const now = performance.now();
  const dt = now - lastFrame;
  lastFrame = now;

  update(dt);
  draw();
  showHUD(game); // <-- Ensure HUD is rendered every frame
  updateHUD(game); // <-- Keep legacy HUD update for compatibility
  checkWinLose();

  requestAnimationFrame(gameLoop);
}

window.onload = () => {
  showHUD(game); // HUD now includes controls/objective
  loadLevel(1);
  logMessage("Game started. Select your harvester and click on spice to harvest.");
  gameLoop();
};

// --- Enemy Troop Visuals & Combat ---
function isEnemyUnit(u) {
  return u.isEnemy === true;
}

// Expose a small helper to set the objective display (used by end-screen and level transitions)
function showObjective(msg) {
  const el = document.getElementById('objective-text');
  if (el) {
    el.textContent = msg;
    return;
  }
  // Fallback: refresh HUD objective and log message for visibility
  refreshObjectiveText();
  if (msg) logMessage(msg);
}
