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

function draw() {
  // Clear canvas with sand color
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

  // Draw buildings
  for (let b of game.buildings) {
    ctx.fillStyle = b.color;
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 3;
    ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
    ctx.strokeRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);

    // Label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      b.type === "enemy_base" ? "Enemy Base" :
      b.type === "enemy_barracks" ? "Enemy Barracks" :
      b.type.charAt(0).toUpperCase() + b.type.slice(1),
      b.x,
      b.y + 5
    );
  }

  // Draw units
  for (let u of game.units) {
    // Unit body
    ctx.fillStyle = u.color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(u.x - u.size / 2, u.y - u.size / 2, u.size, u.size);
    ctx.strokeRect(u.x - u.size / 2, u.y - u.size / 2, u.size, u.size);

    // Unit label
    ctx.fillStyle = "#000";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(u.label, u.x, u.y + 5);

    // Draw health bar
    const hpRatio = u.hp / (UnitTypes[u.type.toUpperCase()]?.hp || 100);
    ctx.fillStyle = hpRatio > 0.5 ? "#0f0" : hpRatio > 0.2 ? "#fa0" : "#f00";
    const barWidth = u.size;
    const barHeight = 4;
    ctx.fillRect(u.x - barWidth / 2, u.y - u.size / 2 - 10, barWidth * hpRatio, barHeight);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(u.x - barWidth / 2, u.y - u.size / 2 - 10, barWidth, barHeight);
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
