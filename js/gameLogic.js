
import { game, createUnit, createBuilding } from './gameState.js';
import { UnitTypes, BuildingTypes, isEnemyUnit } from './entities.js';
import { logMessage } from './ui.js';

export function attemptBuildBarracks(x, y) {
    if (game.spice < BuildingTypes.BARRACKS.cost) {
      logMessage("Not enough spice to build Barracks (100).");
      return;
    }
    // Clamp within canvas with some padding
    const canvas = document.getElementById("gameCanvas");
    x = Math.min(Math.max(x, 40), canvas.width - 40);
    y = Math.min(Math.max(y, 40), canvas.height - 40);
    game.buildings.push(createBuilding("barracks", x, y));
    game.spice -= BuildingTypes.BARRACKS.cost;
    logMessage("Barracks built.");
  }
  
  export function attemptTrainTrooper() {
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
export function update(dt) {
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

export function checkWinLose() {
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
  export function loadLevel(levelNum) {
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
  
  // Expose a global helper so input or other modules can request level changes
  window.jumpToLevel = function(levelNum) {
    try {
      loadLevel(levelNum);
    } catch (e) {
      console.warn('jumpToLevel failed', e);
    }
  };
  
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
  export function showHUD() {
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
  
  // Expose a small helper to set the objective display (used by end-screen and level transitions)
  export function showObjective(msg) {
    const el = document.getElementById('objective-text');
    if (el) {
      el.textContent = msg;
      return;
    }
    // Fallback: refresh HUD objective and log message for visibility
    refreshObjectiveText();
    if (msg) logMessage(msg);
  }
