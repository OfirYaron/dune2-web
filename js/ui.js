export function updateHUD(game) {
  const spiceEl = document.getElementById("spice");
  const carriedEl = document.getElementById("carried");
  const bcountEl = document.getElementById("bcount");
  const ucountEl = document.getElementById("ucount");

  spiceEl.textContent = Math.floor(game.spice);
  carriedEl.textContent = game.selectedHarvester ? Math.floor(game.selectedHarvester.carried) : 0;
  bcountEl.textContent = game.buildings.filter(b => b.type === "barracks").length;
  ucountEl.textContent = game.units.filter(u => u.type === "trooper").length;
}

export function logMessage(msg) {
  const log = document.getElementById("log");
  const entry = document.createElement("div");
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${msg}`;
  log.prepend(entry);
  while (log.children.length > 100) {
    log.removeChild(log.lastChild);
  }
}

// Tooltip helper (lightweight, non-blocking)
export const tooltip = {
  el: null,
  init() {
    // guard: if tooltip element doesn't exist (or duplicates exist), keep only one
    const existing = document.querySelectorAll('#tooltip');
    if (existing.length > 1) {
      existing.forEach((n, i) => { if (i > 0) n.remove(); });
    }
    this.el = document.getElementById('tooltip');
  },
  show(html, x, y) {
    if (!this.el) this.init();
    this.el.innerHTML = html;
    this.el.style.display = 'block';
    this.el.style.left = `${x + 12}px`;
    this.el.style.top = `${y + 12}px`;
    this.el.setAttribute('aria-hidden', 'false');
  },
  move(x, y) {
    if (!this.el) return;
    this.el.style.left = `${x + 12}px`;
    this.el.style.top = `${y + 12}px`;
  },
  hide() {
    if (!this.el) this.init();
    this.el.style.display = 'none';
    this.el.setAttribute('aria-hidden', 'true');
  }
};

// Dedupe HUD and tooltip on DOM ready to avoid editor previews or duplicate injections
document.addEventListener('DOMContentLoaded', () => {
  const huds = document.querySelectorAll('#hud');
  if (huds.length > 1) huds.forEach((n, i) => { if (i > 0) n.remove(); });
  const tips = document.querySelectorAll('#tooltip');
  if (tips.length > 1) tips.forEach((n, i) => { if (i > 0) n.remove(); });
});

