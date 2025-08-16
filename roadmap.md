# Dune 2 Lite (Web) Roadmap

This roadmap outlines a comprehensive, step-by-step plan to transform Dune 2 Lite from a basic two-level prototype into a full-scale, polished web RTS game. The plan prioritizes code quality, testing, maintainability, and feature completeness, all while remaining pure vanilla JavaScript and fully client-side for static hosting (no backend/server required).

---

## Phase 1: Code Quality, Testing, and Foundation

1. **Refactor Codebase for Modularity** [Issue](https://github.com/OfirYaron/dune2-web/issues/4)
   - Split logic into modules (entities, rendering, input, game state, etc.)
   - Use ES6 modules for better structure and maintainability.
2. **Add Unit and Integration Tests** [Issue](https://github.com/OfirYaron/dune2-web/issues/6)
   - Set up a vanilla JS testing framework (e.g., Jasmine or Mocha via CDN).
   - Write tests for core logic: unit movement, harvesting, combat, building placement.
   - Add tests for UI updates and HUD logic.
   - Add test run on CI (GitHub Actions).
   - Ensure tests cover all game mechanics and edge cases.
3. **Implement Linting and Code Style** [Issue](https://github.com/OfirYaron/dune2-web/issues/8)
   - Add ESLint with a strict config for vanilla JS.
   - Document code style guidelines in `CONTRIBUTING.md`.
4. **Set Up GitHub Actions CI** [Issue](https://github.com/OfirYaron/dune2-web/issues/10)
   - Run tests and linting on every push and PR.
   - Fail builds on test or lint errors.
5. **Automate Deployment** [Issue](https://github.com/OfirYaron/dune2-web/issues/12)
   - Use GitHub Pages (or similar) for auto-deployment on main branch updates.
   - Add deployment status badge to README.

---

## Phase 2: Core Game Improvements

6. **Improve Graphics and Animations** [Issue](https://github.com/OfirYaron/dune2-web/issues/14)
   - Redraw units and buildings with more detail (pixel art or SVG).
   - Add basic animations for movement, harvesting, combat, explosions.
   - Implement smooth camera panning and zoom.
7. **Enhance UI/UX**
   - Add tooltips, selection highlights, and context menus.
   - Improve HUD with icons and progress bars.
   - Add sound effects and background music (vanilla JS Audio API).
8. **Settings Menu**
   - Allow toggling sound, graphics quality, and controls.
   - Add save/load game functionality (localStorage).
9. **Accessibility Improvements**
   - Keyboard navigation and shortcuts.
   - Colorblind-friendly palette options.

---

## Phase 3: Feature Expansion

10. **Expand Troop and Building Types**
    - Implement all original Dune 2 units: infantry, tanks, trikes, siege tanks, rocket launchers, etc.
    - Add all building types: refinery, factory, radar, turrets, etc.
    - Implement unique stats, costs, and abilities for each.
11. **Army and Squad Management**
    - Enable multi-unit selection and group commands.
    - Add formation and patrol commands.
12. **Enemy AI Improvements**
    - Smarter pathfinding and attack logic.
    - Multiple enemy factions with different strategies.
13. **Resource and Economy System**
    - Add power, credits, and advanced spice mechanics.
    - Implement building upgrades and tech tree.
14. **Map Editor**
    - In-browser map editor for custom levels.
    - Save/load/share maps via localStorage or downloadable JSON files.

---

## Phase 4: Content Expansion

15. **Campaign and Story Mode**
    - Add multiple missions with increasing difficulty.
    - Implement mission objectives, cutscenes, and story progression.
16. **Additional Levels and Factions**
    - Add all original Dune 2 houses (Atreides, Harkonnen, Ordos).
    - Unique units, buildings, and abilities per faction.
17. **Advanced Enemy AI and Boss Battles**
    - Special enemy units and scripted events.
    - End-level bosses and unique challenges.

---

## Phase 5: Polish and Community

18. **Performance Optimization**
    - Profile and optimize rendering and game logic.
    - Support for mobile browsers and touch controls.
19. **Documentation and Tutorials**
    - Write comprehensive user and developer documentation.
    - Add in-game tutorial and help screens.
20. **Community Features**
    - Add high score leaderboard (localStorage or downloadable file).
    - Enable sharing replays and custom maps via downloadable/uploadable files.
    - Set up GitHub Discussions for feedback and ideas.

---

## Ongoing: Maintenance and Feedback

- Regularly update tests and documentation.
- Monitor issues and user feedback.
- Prioritize bug fixes and quality-of-life improvements.

---

## Future: Automated Test Coverage Reporting

- Integrate a coverage tool (e.g., Istanbul/nyc) for JavaScript.
- Generate coverage reports for all unit and integration tests.
- Display coverage status in README and CI.
- Ensure coverage thresholds for PRs and main branch.

---

This roadmap is designed for incremental progress, ensuring stability and quality at every step. Each phase builds on the previous, with a strong foundation in testing and automation before expanding features and content. All development will remain pure vanilla JavaScript, fully client-side, and suitable for static hosting with no backend dependencies.
