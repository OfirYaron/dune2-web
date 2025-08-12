// ui.test.js
// Tests for UI updates and HUD logic

describe('UI Module', function() {
  beforeEach(function() {
    // Only reset HUD and log elements, do not overwrite the whole body
    let spice = document.getElementById('spice');
    let carried = document.getElementById('carried');
    let bcount = document.getElementById('bcount');
    let ucount = document.getElementById('ucount');
    let log = document.getElementById('log');
    if (!spice) {
      spice = document.createElement('div');
      spice.id = 'spice';
      document.body.appendChild(spice);
    } else { spice.textContent = ''; }
    if (!carried) {
      carried = document.createElement('div');
      carried.id = 'carried';
      document.body.appendChild(carried);
    } else { carried.textContent = ''; }
    if (!bcount) {
      bcount = document.createElement('div');
      bcount.id = 'bcount';
      document.body.appendChild(bcount);
    } else { bcount.textContent = ''; }
    if (!ucount) {
      ucount = document.createElement('div');
      ucount.id = 'ucount';
      document.body.appendChild(ucount);
    } else { ucount.textContent = ''; }
    if (!log) {
      log = document.createElement('div');
      log.id = 'log';
      document.body.appendChild(log);
    } else { log.textContent = ''; }
  });

  it('should update HUD when resources change', function() {
    const game = { spice: 123, selectedHarvester: { carried: 45 }, buildings: [], units: [] };
    updateHUD(game);
    chai.assert.equal(document.getElementById('spice').textContent, '123');
    chai.assert.equal(document.getElementById('carried').textContent, '45');
  });

  it('should update HUD spice count', function() {
    const game = { spice: 99, selectedHarvester: null, buildings: [], units: [] };
    updateHUD(game);
    chai.assert.equal(document.getElementById('spice').textContent, '99');
  });

  it('should update HUD carried amount', function() {
    const game = { spice: 0, selectedHarvester: { carried: 77 }, buildings: [], units: [] };
    updateHUD(game);
    chai.assert.equal(document.getElementById('carried').textContent, '77');
  });

  it('should update HUD building count', function() {
    const game = { spice: 0, selectedHarvester: null, buildings: [{type:'barracks'}, {type:'barracks'}, {type:'factory'}], units: [] };
    updateHUD(game);
    chai.assert.equal(document.getElementById('bcount').textContent, '2');
  });

  it('should update HUD troop count', function() {
    const game = { spice: 0, selectedHarvester: null, buildings: [], units: [{type:'trooper'}, {type:'trooper'}, {type:'harvester'}] };
    updateHUD(game);
    chai.assert.equal(document.getElementById('ucount').textContent, '2');
  });

  it('should display new game event in log', function() {
    logMessage('Test event');
    const log = document.getElementById('log');
    chai.assert.match(log.textContent, /Test event/);
  });
  // Add more UI logic tests here
});

// Local definitions for browser test runner
function updateHUD(game) {
  const spiceEl = document.getElementById("spice");
  const carriedEl = document.getElementById("carried");
  const bcountEl = document.getElementById("bcount");
  const ucountEl = document.getElementById("ucount");
  spiceEl.textContent = Math.floor(game.spice);
  carriedEl.textContent = game.selectedHarvester ? Math.floor(game.selectedHarvester.carried) : 0;
  bcountEl.textContent = game.buildings.filter(b => b.type === "barracks").length;
  ucountEl.textContent = game.units.filter(u => u.type === "trooper").length;
}

function logMessage(msg) {
  const log = document.getElementById("log");
  const entry = document.createElement("div");
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${msg}`;
  log.prepend(entry);
  while (log.children.length > 100) {
    log.removeChild(log.lastChild);
  }
}
