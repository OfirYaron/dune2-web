Game mechanics — Dune 2 Lite (Web)

This document summarizes the current game mechanics and conventions implemented in the project. Keep this file updated as new units, buildings, or systems are added.

Overview
- The game is a small RTS focused on harvesting "spice" resource, building a barracks, training troopers, and destroying enemy buildings.
- Core game logic lives in `js/engine.js`. Unit/building definitions are in `js/entities.js`. State and factory helpers are in `js/gameState.js`. Level setups are in `js/level1.js` and `js/level2.js`. HUD and logging are in `js/ui.js`.

Game state
- `game` (from `js/gameState.js`) holds arrays for `units`, `buildings`, `spicePatches`, numeric values for `spice`, `spiceGoal`, and UI selection (`selectedUnit`, `selectedHarvester`).
- `currentLevel` (in `js/engine.js`) tracks the active level.

Units & Buildings
- Units are created via factory helpers such as `createUnit()` and `createBuilding()`.
- Unit types include `harvester` and `trooper`. Type-specific stats (hp, speed, size, cost, attackPower, attackRange, capacity, etc.) are defined in `js/entities.js`.
- Buildings include `base`, `barracks`, `enemy_base`, and `enemy_barracks`.

Resource (Spice)
- Spice patches are objects with `{id, x, y, radius, amount}`.
- Harvesters move to a patch, harvest spice in steps, carry spice up to `capacity`, return to the `base`, and unload iteratively (10 spice every 400 ms).
- Harvest/unload timing and amounts are implemented in `js/engine.js` (harvestTimer / unloadTimer).

Harvester specifics
- Harvest cycle states: `movingToSpice` -> `harvesting` -> `returning` -> `unloading` -> `idle`.
- When a harvester finishes unloading it may auto-return to its last patch if it still contains spice.
- Harvesters can crush troopers by overlapping them (vehicle crush logic implemented in `js/engine.js`).
- Harvester HP and other stats are defined in `js/entities.js`.

Combat
- Troopers (both player and enemy) attack at a per-unit attack rate with an `attackCooldown` (800 ms by default) and apply `attackPower` damage to targets within `attackRange`.
- Enemy units are marked with `isEnemy: true`.
- Vehicles/harvesters can crush troopers by overlapping, instantly setting target `hp` to 0.
- Combat and crush events are logged via `logMessage()` in `js/ui.js` for debugging.

Selection & Control
- Only player units (non-enemy) are selectable and controllable. Selection uses canvas coordinates and `game.selectedUnit`.
- Left-click selects; clicking on world while a unit is selected issues move/harvest commands (handled in input code).

Training & Barracks
- Building a barracks costs spice; training a trooper queues a timer on the barracks. When complete a trooper spawns next to the barracks.

HUD & Objectives
- HUD displays current spice, carried amount, barracks count, and troop count. The objective panel shows per-level objectives.
- Objective text is derived from `getObjectiveText(level)` in `js/engine.js` and refreshed when a level is loaded.

Levels & Level Picker
- Levels are modularized: `js/level1.js`, `js/level2.js` define level setup routines.
- Press `Q` to open the Level Picker popup and jump to another level. `loadLevel(n)` imports the level module and resets game state.

Camera & Input
- Basic panning (middle mouse) and zoom (mouse wheel) are implemented in `js/engine.js`.
- Input bindings live in `js/input.js` and are wired at startup.

Win / Lose Conditions
- Win: `game.spice >= game.spiceGoal` AND all enemy buildings destroyed.
- Lose: `base` destroyed OR all harvesters destroyed.
- End screen triggers `loadLevel(2)` automatically on win if on level 1.

Debugging & Logging
- `logMessage()` prepends timestamped messages to DOM element `#log`. Combat, crush, harvesting, and training events log messages to help debugging.

Extending this document
- When adding a unit, building, or new mechanic, add a short entry here describing new states, timers, HUD exposure, and where primary logic is implemented.

Contact
- Code owners: refer to repo README for author/contact info.
