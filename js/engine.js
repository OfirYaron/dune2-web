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
          game.spice += u.carried;
          u.carried = 0;
          u.state = "idle";
          u.tx = null;
          u.ty = null;
          logMessage("Harvester returned and unloaded spice.");
        }
      }
    }

    // Trooper combat - placeholder, no enemies yet
    if (u.type === "trooper") {
      // TODO: Implement enemy combat in level2.js
    }
  }

  // Remove depleted spice patches
  game.spicePatches = game.spicePatches.filter(s => s.amount > 0);
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
    // Unit label
    ctx.fillStyle = "#000";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(u.label, 0, 18);
    // Health bar
    const hpRatio = u.hp / (UnitTypes[u.type.toUpperCase()]?.hp || 100);
    ctx.fillStyle = hpRatio > 0.5 ? "#0f0" : hpRatio > 0.2 ? "#fa0" : "#f00";
    ctx.fillRect(-8, -14, 16 * hpRatio, 4);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(-8, -14, 16, 4);
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
}

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

let lastFrame = performance.now();
function gameLoop() {
  const now = performance.now();
  const dt = now - lastFrame;
  lastFrame = now;

  update(dt);
  draw();
  updateHUD(game); // <-- Ensure HUD is updated every frame
  checkWinLose();

  requestAnimationFrame(gameLoop);
}

window.onload = () => {
  logMessage("Game started. Select your harvester and click on spice to harvest.");
  gameLoop();
};
