# Contributing Guidelines

## Code Style
- Use ES6 modules and syntax.
- Prefer `const` and `let` over `var`.
- Use strict equality (`===` and `!==`).
- Indent with 2 spaces, no tabs.
- Use semicolons at the end of statements.
- Prefer arrow functions for callbacks.
- Avoid unused variables and imports.
- Use descriptive names for functions and variables.

## Linting
- All code must pass ESLint checks before merging.
- Run `npx eslint js/` to check for lint errors.
- Fix all errors and warnings before submitting a PR.

## How to Contribute
1. Fork the repository and create a branch using the naming convention: `is<issue-number>-<short-description>`.
2. Make your changes and ensure all linting and tests pass.
3. Submit a pull request referencing the relevant issue.

## Example
```
git checkout -b is8-linting-code-style
npx eslint js/ --fix
```

Thank you for contributing to Dune 2 Lite (Web)!
