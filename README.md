# Pictionary Party Game

A local team drawing game built with Expo and React Native. One shared screen manages the board, die, prompts, timer and team positions while players draw on paper or a whiteboard.

## Live demo

- [Play the game](https://collivignarellioffice-byte.github.io/pictionary-party-game/)
- [Read the illustrated rulebook](https://collivignarellioffice-byte.github.io/pictionary-party-game/presentation/)

The web version is designed as a phone-sized experience on desktop and works directly in a mobile browser.

## How a match works

1. Choose 2–4 teams, name them and select a difficulty level and round duration.
2. Roll the digital die or use a physical die and enter its result. The provisional destination determines the prompt category.
3. Reveal the prompt only to the player who will draw.
4. Start the timer and draw without letters, words, numbers, gestures or spoken clues.
5. If the team guesses in time, it advances by the die value and plays again. Otherwise it stays in place and the turn passes.
6. The first team to reach square 60 wins. An exact roll is not required.

Five repeating board categories shape the prompts: people, places and animals; objects; actions; difficult concepts; and complete-scene challenges.

## Product decisions

This project began as an Expo Snack prototype and was prepared as a reliable, public web demo. The portfolio version:

- removes language, account, purchase and audio controls that did not have working behavior;
- prevents players from bypassing a challenge through the exit dialog;
- blocks the drawing round until the prompt has been revealed;
- supports either the in-app die or a physical die without changing the game flow;
- avoids repeating a prompt until its difficulty/category pool is exhausted;
- normalizes empty or whitespace-only team names;
- explains the physical materials and the real implemented rules inside the app;
- adds a dedicated rulebook that follows the game's visual system;
- includes automated tests and continuous deployment to GitHub Pages.

The game intentionally uses one shared device and keeps the drawing surface physical. It has no backend, accounts, online multiplayer or persistent match history. The prompt library and interface are currently in Italian. Browser vibration support varies by device.

## Stack and structure

- Expo 54, React 19 and React Native Web
- Local state only, with no external API or user data collection
- Pure game rules in [`game-logic.js`](./game-logic.js)
- Static rulebook in [`presentation/`](./presentation/)
- Node test suite in [`tests/`](./tests/)
- GitHub Actions deployment in [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)

## Run locally

```bash
npm install
npm run web
```

Then open the local URL shown by Expo.

## Test and build

```bash
npm test
npm run build:web
```

The production build is written to `dist/`. The build script also copies the rulebook and prepares the output for GitHub Pages.

## Role and process

Concept, game flow, interface direction and original prototype by Martina Collivignarelli. The recovered prototype was reviewed, refactored, tested and documented with AI-assisted development. Product decisions and final validation remained human-led.

## License

[MIT](./LICENSE)
