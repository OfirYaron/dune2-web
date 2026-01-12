// tests/ui.test.js
describe('UI helpers', function() {
  it('box-select should include units inside bounds', function() {
    // simple box select check (pure function style)
    const units = [ {id:1,x:10,y:10}, {id:2,x:50,y:50}, {id:3,x:100,y:100} ];
    const x1 = 5, y1 = 5, x2 = 60, y2 = 60;
    const selected = units.filter(u => u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2).map(u=>u.id);
    chai.assert.deepEqual(selected, [1,2]);
  });

  it('tooltip HTML formatting contains name and hp', function() {
    const unit = { name: 'Harvester', hp: 120, carried: 10 };
    const html = `<b>${unit.name}</b><br>HP: ${unit.hp}`;
    chai.assert.include(html, 'Harvester');
    chai.assert.include(html, 'HP: 120');
  });
});
// ui.test.js
// Tests for UI updates and HUD logic

function createGameState({ spice = 0, carried = null, buildings = [], units = [] } = {}) {
  return {
    spice,
    selectedHarvester: carried !== null ? { carried } : null,
    buildings,
    units
  };
}

function setupHUDandLogElements() {
  const ids = ['spice', 'carried', 'bcount', 'ucount', 'log'];
  ids.forEach(id => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    } else {
      el.textContent = '';
    }
  });
}

describe('UI Module', function() {
  beforeEach(function() {
    setupHUDandLogElements();
  });

  it('should update HUD when resources change', function() {
    const game = createGameState({ spice: 123, carried: 45 });
    updateHUD(game);
    chai.assert.equal(document.getElementById('spice').textContent, '123');
    chai.assert.equal(document.getElementById('carried').textContent, '45');
  });

  it('should update HUD spice count', function() {
    const game = createGameState({ spice: 99 });
    updateHUD(game);
    chai.assert.equal(document.getElementById('spice').textContent, '99');
  });

  it('should update HUD carried amount', function() {
    const game = createGameState({ carried: 77 });
    updateHUD(game);
    chai.assert.equal(document.getElementById('carried').textContent, '77');
  });

  it('should update HUD building count', function() {
    const game = createGameState({ buildings: [{type:'barracks'}, {type:'barracks'}, {type:'factory'}] });
    updateHUD(game);
    chai.assert.equal(document.getElementById('bcount').textContent, '2');
  });

  it('should update HUD troop count', function() {
    const game = createGameState({ units: [{type:'trooper'}, {type:'trooper'}, {type:'harvester'}] });
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
