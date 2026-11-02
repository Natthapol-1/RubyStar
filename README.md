# Ruby Star

A standalone neon survival game. Defend Ruby in Endless Space, learn the controls in First Orbit, or fight celestial guardians.

## Run

Requires Node.js 20 or newer.

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. For the Windows app, run `npm run dev:desktop`; create an installer and ZIP with `npm run package:windows`. See [Windows desktop](docs/ruby-star/DESKTOP.md) for save locations, offline support and tester instructions. The lobby is at /; modes are /endless, /ascension, /tutorial and /challenge.

## Checks

```powershell
npm test
npm run typecheck
npm run build
```

The optional desktop browser checks use Microsoft Edge and always mute media and close their browser. Run the web dev server, then `npm run test:game-ui`. `npm run test:desktop` checks local saves and desktop progression; after `npm run build:desktop`, `npm run check:desktop` launches the exported Electron app with an isolated test profile. Canvas previews use `@napi-rs/canvas`.

Gameplay code lives in `game/`, routes in `app/`, shared UI in `components/`, assets in `public/sounds/`, and the game reference starts at [docs/ruby-star/README.md](docs/ruby-star/README.md).

This project runs independently of Arkade. Production builds use `npm run build` followed by `npm start`. GitHub origin: https://github.com/Natthapol-1/RubyStar.git. The Windows Electron build uses the same TypeScript/canvas engine and bundles its runtime and assets.
