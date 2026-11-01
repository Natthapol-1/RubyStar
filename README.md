# Ruby Star

A standalone neon survival game. Defend Ruby in Endless Space, learn the controls in First Orbit, or fight celestial guardians.

## Run

Requires Node.js 20 or newer.

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. The lobby is at /; modes are /endless, /ascension, /tutorial and /challenge.

## Checks

```powershell
npm test
npm run typecheck
npm run build
```

The optional desktop browser checks use Microsoft Edge and always mute media and close their browser. Run the dev server, then `npm run test:desktop`. Canvas previews use `@napi-rs/canvas`.

Gameplay code lives in `game/`, routes in `app/`, shared UI in `components/`, assets in `public/sounds/`, and the game reference starts at [docs/ruby-star/README.md](docs/ruby-star/README.md).

This project runs independently of Arkade. Production builds use `npm run build` followed by `npm start`. GitHub origin: https://github.com/Natthapol-1/RubyStar.git. Desktop packaging is a separate future step; the current TypeScript/canvas engine can be reused.
