# Dune 2 Lite (Web)

A simplified web-based real-time strategy (RTS) game inspired by Dune 2. The game runs entirely in the browser using HTML5 Canvas and JavaScript.

## Features

- **Harvest spice**: Control harvesters to collect spice from patches.
- **Build structures**: Construct bases and barracks.
- **Train troops**: Create troopers to defend and attack.
- **Levels**: Includes at least two levels with increasing difficulty and enemy AI.
- **HUD and Log**: Real-time display of resources, units, and game events.

## File Structure

- `index.html`: Main HTML file. Loads the game canvas, HUD, log, and scripts.
- `css/style.css`: Styles for the game UI, HUD, canvas, and log.
- `js/entities.js`: Defines unit and building types, stats, and costs.
- `js/ui.js`: Handles HUD updates and logging game events.
- `js/engine.js`: Core game logic, rendering, unit/building management, and game state.
- `js/level1.js`: Level 1 setup (basic harvesting and building).
- `js/level2.js`: Level 2 setup (adds enemies and more spice patches).

## How to Play

1. Open `index.html` in a browser.
2. Use the mouse to select and control units.
3. Harvest spice, build barracks, and train troopers.
4. Progress through levels by meeting spice goals and defeating enemies.

## Customization

- To play Level 2, uncomment the `<script src="js/level2.js"></script>` line in `index.html` and comment out Level 1.

## Technologies

- HTML5 Canvas
- Vanilla JavaScript
- CSS

## Branch Naming Convention for Roadmap Issues

All branches related to roadmap issues should use the following naming convention:

`is<issue-number>-<short-description>`

- `is` prefix indicates the branch is tied to a specific issue.
- `<issue-number>` is the GitHub issue number (e.g., 4 for issue #4).
- `<short-description>` is a brief summary of the branch purpose (e.g., `refactor-modular-es6`).

**Example:**

```
is4-refactor-modular-es6
```

This helps keep roadmap, issues, and branches in sync and easy to track.
