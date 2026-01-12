import { game } from './gameState.js';
import { setupInput } from './input.js';
import { updateHUD, logMessage } from './ui.js';
import { setupCamera, camera } from './camera.js';
import { draw } from './renderer.js';
import { update, checkWinLose, showHUD, loadLevel, attemptBuildBarracks, attemptTrainTrooper } from './gameLogic.js';
import { isEnemyUnit } from './entities.js';

const canvas = document.getElementById("gameCanvas");

setupInput(canvas, game, logMessage, attemptBuildBarracks, attemptTrainTrooper);
setupCamera(canvas);

// --- Selection logic ---
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1) { // Middle mouse button
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
