# Dune 2 Lite (Web)

A simplified web-based real-time strategy (RTS) game inspired by Dune 2. The game runs entirely in the browser using HTML5 Canvas and JavaScript.
See latest deployed game here: https://ofiryaron.com/dune2-web/


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

## How to Run Locally (Avoid CORS Issues)

Modern browsers block ES6 modules and some resources when opened directly from the file system due to CORS restrictions. To run the game locally, you must use a local web server:

### Option 1: Python (if installed)
```sh
python3 -m http.server 8080
```
Then open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Node.js (if installed)
Install `http-server` globally:
```sh
npm install -g http-server
```
Then run:
```sh
http-server -p 8080
```
And open [http://localhost:8080](http://localhost:8080).

This will resolve CORS errors and allow ES6 modules to load correctly.

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

## Testing

This project uses **Mocha** and **Chai** (via CDN) for unit and integration testing, with all tests written in vanilla JavaScript. Tests cover core game logic, UI updates, and edge cases.

### Test Directory Structure
- `tests/` — Contains all test files (e.g., `engine.test.js`, `entities.test.js`, `ui.test.js`).

### How to Run Tests Locally
1. Open `index.html` in your browser.
2. The test runner will be available at `/tests/` (see below for setup).
3. All tests are run automatically and results are displayed in the browser.

### Adding/Editing Tests
- Create new test files in the `tests/` directory.
- Use Mocha's `describe` and `it` blocks for organizing tests.
- Use Chai's `assert`/`expect` for assertions.
- Cover all game mechanics, UI logic, and edge cases.

### Example Test
```js
// tests/sample.test.js

describe('Sample Test', function() {
  it('should pass this basic test', function() {
    chai.assert.equal(2 + 2, 4);
  });
});
```

### Continuous Integration (CI)
- All tests are run automatically on every push and pull request using GitHub Actions.
- CI uses a headless browser to run tests and will fail builds on test errors.

### Contribution Guidelines for Tests
- Write clear, isolated tests for each function or feature.
- Add integration tests for interactions between modules.
- Document any new test files and their purpose in the README.
- Ensure tests pass locally before pushing changes.
