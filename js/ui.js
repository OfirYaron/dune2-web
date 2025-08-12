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

