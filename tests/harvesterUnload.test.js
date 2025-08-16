import { game, createUnit, createBuilding } from '../js/gameState.js';

describe('Harvester Unloading', () => {
  beforeEach(() => {
    game.spice = 0;
    game.units = [];
    game.buildings = [];
    // Add base and harvester
    game.buildings.push(createBuilding('base', 100, 100));
    const harvester = createUnit('harvester', 110, 110);
    harvester.carried = 25;
    harvester.state = 'unloading';
    harvester.unloadTimer = 0;
    game.units.push(harvester);
  });

  it('should unload spice in 10-unit steps every 400ms', () => {
    const harvester = game.units[0];
    let dt = 400;
    // First unload
    require('../js/engine.js').update(dt);
    expect(game.spice).toBe(10);
    expect(harvester.carried).toBe(15);
    expect(harvester.state).toBe('unloading');
    // Second unload
    require('../js/engine.js').update(dt);
    expect(game.spice).toBe(20);
    expect(harvester.carried).toBe(5);
    expect(harvester.state).toBe('unloading');
    // Final unload
    require('../js/engine.js').update(dt);
    expect(game.spice).toBe(25);
    expect(harvester.carried).toBe(0);
    expect(harvester.state).toBe('idle');
  });
});
