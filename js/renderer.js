import { game, GRID_SIZE } from './gameState.js';
import { camera } from './camera.js';
import { UnitTypes, isEnemyUnit } from './entities.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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

export function draw() {
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
  
    // Draw hover outline for unit or building
    if (game.hoveredUnit) {
      const u = game.hoveredUnit;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(u.x, u.y, u.size / 2 + 4, u.size / 2 + 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (game.hoveredBuilding) {
      const b = game.hoveredBuilding;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x - b.size/2 - 4, b.y - b.size/2 - 4, b.size + 8, b.size + 8);
    }
    ctx.restore();
  }
