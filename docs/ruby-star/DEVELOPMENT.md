# Development

[Overview](README.md)

## Code map

Ruby Star is a real-time top-down survival/defense game in Arkade, a Next.js 15 / React 19 / TypeScript app. The Windows application wraps the same static export in Electron; see [Windows desktop](DESKTOP.md) for commands, save architecture and distribution. Routes: `/` (lobby), `/tutorial`, `/endless`, `/ascension`, `/challenge` (star map), `/challenge/<body>` and `/gambit` (Star Gambit, in development); local development normally uses `http://localhost:3000/ruby-star`. God panel: shown only in development builds; release builds hide it, including query URLs. It provides a five-column boss summon grid and a five-column celestial skill grid, with matching BOSSES and CELESTIAL SKILLS headings and bosses directly above skills; skill buttons preview the matching player suit and highlight the held skill. Constellations opens a paused all-upgrade toggle editor. Protection controls pair Immortal (player/Ruby HP minimum 1) with Invincible (ignore damage); refill controls pair Full HP with Full Energy. These modes are mutually exclusive and persist through reset. Every God panel has a No Meteors toggle beside Reset (beside the COMET summon button in Endless and Ascension): it cancels pending meteor warnings and impacts, suppresses future meteor strikes, hides their countdown and persists through restart. Disabling it resumes the fresh meteor cycle. Comets retain their normal behavior and their existing COMET summon button. A Saturn-only God-panel No Freeze toggle prevents ice freezes, immediately thaws an ice-frozen player and persists through reset; it leaves damage, slows and non-ice stuns in effect.

| File or directory | Responsibility |
| --- | --- |
| `game/constants.ts` | Tile map, enemy configurations, boss roster, difficulty tiers, ability tuning, celestial skill definitions |
| `game/event-audio.ts` | Event warning/arrival/charge cues, Black Hole/Eclipse loop lifecycle and cleanup |
| `game/events.ts` | Minor-event scheduling, gravity, star landing/pickup and Eclipse |
| `game/encounter-art.ts` | Approved Sentinel/totem/twin sprites, attack/revival effects and floor/chamber warnings |
| `game/engine.ts` | Pure mutable game state, 60Hz tick, movement/pathfinding, attacks, damage, rewards, spawning, hazards, audio |
| `game/aliens.ts` | Regular alien AI with its own behaviour (Sniper, Lancer, Healer, Charger, Ghost, Shielder, Grappler), the shared `stepEnemy`/`walkPath` walking helpers and Lancer beam geometry; the engine calls `updateRegularAlien`. Ordinary melee chasers keep the shared chase in `engine.ts` |
| `game/neptune.ts`, `game/gaia.ts`, `game/moon.ts`, `game/sun.ts`, `game/jupiter.ts`, `game/saturn.ts`, `game/sirius.ts`, `game/venus.ts`, `game/singularity-maw.ts` | Challenge logic and state types (`NeptuneState`, `GaiaState`, `MoonState`, `SunState`, `JupiterState`); the core engine calls in through `updateNeptune`/`updateGaia`/`updateJupiter` and exported helpers, and the modules import engine helpers back |
| `game/binary.ts`, `game/binary-art.ts`, `game/binary-world-art.ts`, `game/BinaryGuide.tsx`, `game/MagnetStatus.tsx` | Binary Star challenge: twin lives, opposite-room jumps, magnetic fields and collisions, twin moves, art, rule sheet and C HUD |
| `game/neptune-art.ts` | Neptune challenge art: joined reef rock, rooted leafy kelp, floor caustics/bubbles/marine snow, fish, stingers, jellyfish, sharks, water clones, water balls, tides and Ocean’s Chorus (sky laser) |
| `game/jupiter-art.ts`, `game/JupiterGuide.tsx`, `game/VoltFenceStatus.tsx` | Jupiter warm/storm palette, capacitor station, persistent electric fences, room hazards, charge/exposure art, rule sheet and C HUD |
| `game/jupiter-cover.ts` | Jupiter phase 2+ pursuit room reconfiguration: substantial cover sections, random placement/orientation, preview/retraction/rise, connectivity checks and safe cancellation |
| `game/sun-art.ts`, `game/SunGuide.tsx` | Sun units, stations, temperature atmosphere, water effects and animated rule sheet; Sun debug controls include Wave Ready, Full Heat, Zero Heat, Phase 1/2/3 and independent No Wisps (preserved on restart; No Mobs leaves wisps alone) |
| `game/enemy-health-art.ts` | Shared Endless-style above-unit HP painter for all regular/custom aliens and non-boss objectives; `preview-enemy-health.cjs` renders the cross-world reference |
| `game/BombStatus.tsx` | Icon-only HUD bomb ready/armed/cooldown indicator |
| `game/CelestialStatus.tsx`, `game/MoonMarkStatus.tsx`, `game/CoolingWaveStatus.tsx` | Icon-only HUD ready/recharging indicators: the celestial skill (Celestial Challenge), the Moon Mark (Moon challenge) and Hydro Pulse (Sun challenge) |
| `game/ModeLobby.tsx` | Mode lobby: title, carousel of mode cards, routing |
| `game/gambit.ts`, `game/gambit-art.ts`, `game/GambitLoadout.tsx`, `app/gambit/page.tsx` | Star Gambit (in development, see [Star Gambit](STAR-GAMBIT.md)): weapon slots and effects, weapon/HUD/backdrop art, loadout picker and route. The Bazaar layout lives in `constants.ts` (`applyChamberLayout`, `generateBazaarMap`); `MAP_COLS`/`MAP_ROWS` follow the active layout. |
| `game/RubyStarGame.tsx` | The game for a given mode: canvas renderers, input, animation loop, camera, HUD, God panel, touch controls |
| `app/tutorial/page.tsx`, `endless/page.tsx`, `ascension/page.tsx` | Mode routes; each renders `RubyStarGame` with its mode, started by `createModeState` in `engine.ts` |
| `game/LoadingScreen.tsx`, `game/NavigationProvider.tsx`, `app/loading.tsx` | Shared startup and route loading screen. `useLoadingRouter` paints the overlay before navigation, then holds it through React's route transition; the App Router fallback also covers suspended first loads. Lobby, star map, challenge entry and game/back controls use this router. The loading screen shows only the Ruby Star title and three animated square dots against the starfield; it has no icon. |
| `game/neptune-refrain.ts`, `game/neptune-refrain-art.ts`, `game/NeptuneRefrainBar.tsx` | Ocean’s Melody: surfaced listen/answer rhythm, pending heal settlement, deferred Ocean’s Chorus readiness, synthesized notes and the live score below Neptune’s HP. See [Neptune](NEPTUNE.md). |
| `game/trials.ts`, `challenge/page.tsx`, `challenge/[body]/page.tsx` | Celestial Challenge data (body, guardian boss, map position), star map page and per-world route (`trial` mode in the engine) |
| `game/CutscenePlayer.tsx`, `game/cutscene-art.ts`, `game/ChallengeEntry.tsx`, `game/challenge-arrival.ts`, `game/sun-arrival.ts` | Canvas playback and ship art shared by the intro and all challenge arrivals. The challenge route checks access and first-visit state before mounting the game. |
| `game/display-settings.ts`, `game/DisplaySettings.tsx`, `game/PhotosensitivityNotice.tsx` | Comfort settings: Screen Shake (off / low / full) and Reduce Flashing, kept in the profile (`display`) on desktop and in localStorage on the web, shown in lobby Settings and the pause menu; the one-time photosensitivity notice before the first-launch intro |
| `game/Credits.tsx`, `game/app-version.ts` | Credits panel under Settings, and the release version from `package.json` (injected as `NEXT_PUBLIC_APP_VERSION` by `next.config.ts`), shown in the lobby corner, Settings and Credits |
| `game/ui-sfx.ts` | Synthesized sci-fi menu cues for the lobby, rule sheet, EXIT and teleport menu |
| `game/CelestialSkillGuideCard.tsx` | Shared animated F-skill card for every challenge rule sheet, using the real celestial cast renderer |
| `game/ConstellationAfterglow.tsx` | Faint non-blocking confirmation art, reusing the choice star positions and link geometry |
| `game/ConstellationChoice.tsx` | Paused run-upgrade interface, including the final single choice |
| `game/RubyStarGuide.tsx` | Simple main rules and Aliens & Bosses sheet |
| `game/guide-art.ts`, `game/thorn-art.ts` | Simplified color-accurate guide shots and shared battlefield/guide thorn warning, falling seed and ground painter |
| `game/NeptuneGuide.tsx` | Neptune challenge rule sheet: animated picture cards for what is new on that map |
| `game/gaia-art.ts` | Gaia challenge art: overgrowth, Sunstones, pods, blossoms, sporelings, crawlers, Ragecaps, root binds, Sunfire, forest backdrop |
| `game/moon-art.ts` | Moon challenge art: room palette, crystal cover blocks, polished crystal floor (sheen, reflections, mist, runes), motes, crystal-cavern backdrop, the Queen's floor reflection, shards, arrival and unmask effects |
| `game/GaiaGuide.tsx`, `game/MoonGuide.tsx` | Gaia and Moon challenge rule sheets (same picture-card format) |
| `game/VictoryScreen.tsx` | Full-screen challenge victory celebration (canvas burst, fanfare, buttons) |
| `tests/*.test.cjs` | Node gameplay regression tests; transpile TypeScript directly |
| `scripts/preview-*.cjs` | Render actual game drawing functions to PNG; no replacement mockup artwork |
| `scripts/check-ruby-*.cjs`, `scripts/check-charge-cycle.cjs` | Browser UI and repeated-charge checks |
| `public/sounds/`, `public/sounds/celestial/` | Audio assets; preserve the existing layered mix |
| `docs/ruby-star/visual-reference/` | Source-rendered visual references |
| `docs/ruby-star/boss-remodels/` | Archived boss remodels (code, renders and notes), not used by the game |

The simulation uses approximately 60 ticks/second, independent of monitor refresh rate. Positions have both tile coordinates and pixel interpolation. One tile = 48px; map = 51×51 tiles. Walls control pathfinding/collision. Prefer engine changes for gameplay and renderer changes for cosmetics.

The game module exports only React components: the game and its player/enemy portrait components. Canvas drawing helpers stay internal so portrait reuse does not invalidate the Fast Refresh component boundary. Changes to shared engine state or module initialization can still require a reload; ordinary visual/component edits should preserve the live run.

Gemstone drawing is shared through `gemstone-cuts.ts` (chooser silhouettes/materials), `BlessingGem.tsx` (SVG inventory/reward art), `blessing-art.ts` (pixel combat cues and dedicated wards) and `BlessingAfterglow.tsx` (per-frame reward reveal). `preview-blessing-gems.cjs`, `preview-blessing-combat.cjs` and `preview-blessing-reveal.cjs` render source references. `check-current-ui.cjs` and `check-desktop-ui-details.cjs` use isolated profiles against the desktop development server on port 3001.

`field-art.ts` shares the existing Singularity floor tiles with Obsidian wells; their gameplay radii and timers remain independent. The God panel uses a 280px base width, 30px text buttons and 44px summon/skill buttons, scaled down only when necessary to fit the viewport. Full Energy routes through the regular energy handler so Amber can be tested.

`game/celestial-enemy-data.ts` holds the concise, map-grouped Celestial Enemies terminal catalogue. `CelestialEnemyPortrait.tsx` uses the actual unit portraits, including the Golden Soul variant and the shared Neptune shark painter. Keep catalogue prose short and update it when a map’s special enemies change; boss entries remain in Alien Bosses and environmental mechanics stay in map rules.

## Challenge modules

Saturn uses `saturn.ts` for encounter state, grants, shatter and recall, the time-stop field, blizzard, frozen floor and three alien AIs (`updateSaturnAlien`). Short engine hooks keep ordinary Warden behaviour outside trials: `saturnShatter` in `damageEnemy`, `saturnDamageTaken`, `saturnTimeStopped` in the enemy loop and `isSaturnAlien` dispatch. `saturn-art.ts` renders scenery, grant/recall cues, the field, attack warnings, aliens and the minimap marks. UI: `SaturnGuide.tsx`, `TimeStopStatus.tsx` and `ShieldAmount.tsx`. Run `node --test tests/saturn.test.cjs` and `node scripts/preview-saturn.cjs docs/ruby-star/visual-reference`.

Venus, Sirius and Singularity scenery: `world-themes.ts` (one `WorldTheme` each, built independently) and `node scripts/preview-singularity.cjs docs/ruby-star/visual-reference`. Venus is a three-phase challenge in `venus.ts` (`state.venus`): its totems are `aegis_construct` bodies with `venusOrder` that leave `state.enemies` while buried, and the engine routes their hits and deaths to `venusTotemHit`/`venusTotemDestroyed`; art is `venus-art.ts`; see [Venus](VENUS.md). The Singularity is a three-family challenge: the Devourer swarm (challenge-only splitting, scaling and health accounting) in `engine.ts`, and the fixed Maws, consumption and Soul Lure in `singularity-maw.ts` (`updateSingularityMaws`, `placeSoulLure`/`releaseSoulLure`); see [The Singularity](SINGULARITY.md).

Sirius uses `sirius.ts` for the light/dark timer, runes and trail matching (`runeProgress`), the paused Ruby guess (reusing the `laserTarget` room picker through `chooseSkyLaser`/`cancelSkyLaser`) and the Zealot/Bellringer AI (`updateSiriusAlien`). Engine hooks: `siriusReversed` in `isMovementReversed`, `siriusDamageTaken` in `damageEnemy`, `siriusEmpower` in `damagePlayer`, `damageRuby` and `celestialMoveMultiplier`, `isSiriusAlien` dispatch and `updatePrayerAbilities` skipped. `sirius-art.ts` draws the trail, tells, effects, aliens and rune tiles; UI: `SiriusGuide.tsx` and the Sirius block of `GuardianBar`. Run `node --test tests/sirius.test.cjs`.

## Implementation rules

- Inspect relevant current source and local changes before editing; preserve unrelated work.
- Keep gameplay in `engine.ts` and rendering/input in `RubyStarGame.tsx`. Each Celestial Challenge keeps its logic in its own module (`neptune.ts`, `gaia.ts`, `moon.ts`, `sun.ts`); give new challenges their own module too, leaving only short hooks in `engine.ts`. New regular aliens with their own behaviour go in `aliens.ts` and reuse `stepEnemy`/`walkPath` instead of copying movement code. The modules and engine import each other, so they must not use each other's values at module load time, only inside functions. The shared room picker for full-charge room strikes (`chooseSkyLaser`, `cancelSkyLaser`) stays in `engine.ts`. Tests reach private engine helpers by appending an export to `engine.ts` when transpiling it, so moved code is imported from its own module. Cosmetic edits must not silently change damage, range, timing, collision, targeting or audio.
- Treat game state other than `playing` as paused for simulation and ability actions. Pause/stop persistent audio appropriately too. Both teleport and Constellation choices pause the game. Constellations are one-time choices; exclude owned entries, offer the final single entry, and stop when exhausted.
- Before every visual change, inspect the closest existing implementation and source-rendered reference. Reuse established visual grammar and shared painters; a reference is a style guide, not permission to duplicate another unit's identity.
- Keep tile/pixel interpolation synchronized after knockback, pull, teleport or interrupted charge. Share field bounds between collision and drawing.
- Keep target-specific effects scoped: Lunar AI substitution must restore player state in `finally`. Boss removal must clean up its hazards, audio and global effects.
- Apply Shielder fractional reduction before absorb shields. Do not inflate small damage by rounding to a minimum of one. Cassiopeia reduces Ruby damage before Ruby's shield pool.
- Use snapshot target lists when resolving multi-target attacks and kills so spawning children/removing echoes, constructs or a twin partner cannot cause skipped or repeated hits. Consume a celestial skill before resolving kills so replacement rewards survive.
- God controls are development-only and cannot be enabled by a query in release builds.
- Screen shake is scaled by the Screen Shake setting where the camera applies it (`shakeScale`). Route every new flash-style screen effect (full-screen flashes, washes, screen-space pressure fronts) through `drawFlashLayer` in `RubyStarGame.tsx`, which composites it at `REDUCED_FLASH_ALPHA` when Reduce Flashing is on; overlays that carry gameplay information (darkness, gas, light and dark, eclipse) stay outside it.
- Desktop only: do not implement, adapt, test or screenshot mobile/touch layouts or controls unless explicitly asked. Existing mobile code may stay but does not need updating, and mobile steps in browser checks can be skipped. Modals need keyboard focus, clear actions and paused gameplay.

## Rule sheets

Every challenge has an in-game rule sheet (`game/<World>Guide.tsx`, opened before the fight and from the ? button). Newer sheets (Binary Star, Neptune, the Singularity) set the pattern; follow it for every new or reworked sheet.

**Layout**
- Title `<WORLD> CHALLENGE`, then one bold line that says the goal of the fight.
- Sections in this order, leaving out any that are empty: **General rules & skills** (map rules, the primal skill card and the shared celestial skill card), **Enemies** (the boss and the map's own aliens), **Phase 2+**, **Phase 3**. A mechanic goes under the first phase it appears in.
- Each card: a short title, one small looping picture drawn with the real game art, and one or two short sentences.

**Writing**
- Say only what something does, in plain words a new player understands at a glance.
- Keep it concise: no numbers, timings, ranges or percentages; no tactical advice (such as telling players to leave before a blast); no edge cases, exceptions or implementation details.
- Cover only what is new on that map. Leave out secondary mechanics, even if they are in the code, unless a player needs them to understand the fight. Do not add a card just because a mechanic exists.
- Name things as the game does (Maw, Gravity Hook, Lost Soul); the primal skill card title is `PRIMAL SKILL` with its bound key, and the text starts with the skill's name.
- Detailed rules, numbers and edge cases belong in the world's reference document, not on the sheet.

**Upkeep**
- When a mechanic changes, update its card and picture in the same task, and remove cards for mechanics that are gone.
- Check the sheet in the game after changing it: every card fits, the pictures loop cleanly, and nothing leaks drawing state into the next card.

## Linked boss encounters

Aegis constructs are stationary `Enemy` objects with `constructOwnerId`; they use ordinary attack collision/targeting, but have no rewards or regular-alien support effects. `Enemy.aegis` holds shield/exposure/reflection state. `initializeNewEncounter` runs for both natural and debug spawns. Twins share `Enemy.twin.pairId`; index 0 is melee and index 1 is ranged. `updateAstralTwin` handles their attacks and movement; `twinRangedPath` scores reachable firing positions for 6–10-tile spacing, cover and diagonal approach, while `twinStepFits` enforces the 10-tile movement tether against both ends of partner interpolation. Dusk uses its own 3.2 movement speed and Queen-style chamber/range-gated tracking, including current pixel endpoints and Lunar Echo targeting; Dawn retains 2.6 movement speed. `downedTicks > 0` marks an inert, untargetable body (its internal HP sentinel is 1 so generic casualty sweeps terminate). The final twin defeat removes its partner and resolves boss rewards once. `updateBossEncounters` advances revival/exposure timers once per playing tick, including Eclipse, while twin transfers pause under Eclipse. Transfers use a random 6–9s interval and randomly choose either eligible donor, moving up to 30% of current donor HP; one-second effects follow the live donor/receiver IDs. `EncounterEffect` stores bounded cosmetic cues from real attacks, shield transitions, totem overloads and revival; repeated reflections refresh one streak. `visualSpawnTicks`, `aegis.openAmount`, `twin.fallTicks` and `twin.reviveTicks` are updated once per playing tick, never by rendering. Totem lifetime/overload timers advance only outside Eclipse; damage never resets them. Overload relocates the same objective at full HP, restarting its lifetime without rewards or changing its owner. `BOSS_SKILL_REWARDS` maps the ten encounters to the ten celestial skills. Binary Star routes laser, wave and bomb damage through origin-parameterized helpers (`withMirrorTwin`, the bomb `blastAt`, `fireBulletFrom`) so the twin reuses the player's exact attack code; `getMirrorTwinTile` is shared by gameplay and rendering. Venus Veil passes the attacking `Enemy` into `damagePlayer`/`damageRuby`; only direct attacks supply it, so hazards are reduced without reflection. Reflected damage uses the `special` source and is cleaned up by the end-of-tick casualty sweep.

## God panel controls

The panel sits at the upper left of the battlefield, opposite the minimap, with scrollable controls. A −/+ button beside the GOD MODE title collapses it to a 180px title bar and expands it again; the choice is remembered in `localStorage` (`rubyStar.godCollapsed`).

`Stage +1` calls `godAdvanceStage`: increment the defeated-boss count once, update difficulty immediately, offer any third-defeat Constellation reward, and announce Ascension when crossing ten defeats. It preserves the live boss, HP, resources and celestial inventory; it does not simulate a boss kill or grant kill rewards. Only available while playing. `RESET` uses the same restart handler as PLAY AGAIN: starts at Stage 0, clears run upgrades/skills/hazards and input, and retains Immortal, Invincible, No Freeze, No Mobs and No Boss debug toggles. Stage +1, STAGE 20 and RESET share one compact row. STAGE 20 preserves the current encounter and resources, jumps difficulty to the late-run tier and offers the stage-20 blessing once, without guardian kill credit or retroactive constellation picks; reached stages still update the development profile for Ascension testing. The panel sizes its text controls consistently, retains 40px icon buttons and scales to fit the available height without scrolling. There is no separate Ascension button; advance stages to reach its unlock. Immortal and Invincible share a protection row; Full HP and Full Energy share a refill row. Immortal, Invincible, No Freeze, No Mobs and No Boss use color for visible toggle state, with `aria-pressed` for accessibility and no ON/OFF suffix. Four individual event buttons in a two-column grid trigger warned events; see [Space events](EVENTS.md).

On every challenge map, the Phase 2 and Phase 3 buttons also bring TIME (`score`) and the spawn clock (`difficultyTimer`) up to at least 60 seconds (`godPhaseClock`), so the full shared alien pool is already in play; a later clock is kept and Phase 1 leaves it alone.

On Sirius, **Light Sanctuary** toggles the cosmetic dark/soft-light state with `aria-pressed`. It smoothly sweeps illumination across the existing scenery over 1.8 seconds, reverses from the current blend if toggled midway, and retains the target/blend on RESET. Rendering reads cached interpolated palettes; only the UI animation loop advances `trial.siriusLightBlend`. See [Map previews](SIRIUS.md#look).

## World themes

`world-themes.ts` holds each `WorldTheme` (Venus, Sirius and the Singularity): room palette, minimap fill, backdrop, floor tile, cover tile and floor ambience. `worldTheme(state)` picks it by guardian and Sirius lighting. `RubyStarGame.tsx` uses it for the battlefield, backdrop, minimap, teleport picker and guardian-bar name. Drawing is read-only; ambience follows `gameTick`, while Sirius's cosmetic lighting transition advances in the animation loop.

Each world has its own materials, architecture and motion, tied to its guardian. Floors stay quiet, with sparse material details and restrained ambience clipped to floor tiles (`clipToFloor`). Cover keeps its full tile collision footprint; chips, dark tongues and background ruins are cosmetic. Drawing is deterministic for the supplied simulation tick and lighting blend, with balanced canvas save/restore calls.

Engine `createModeState` still supports a map preview through `trial.mapOnly` (with `noMobs` and `noBossSpawns`: no aliens, further bosses, meteors or events, no challenge mechanics or C skill, never counted as a clear, and the guardian bar showing the world name while the guardian is dead), but no world uses it now.

`node scripts/preview-singularity.cjs docs/ruby-star/visual-reference` renders Venus, Sirius (both lighting states) and the Singularity in ALPHA and GAMMA from the real drawing code and checks that drawing never changes state.

## Verification

Run checks appropriate to the changed behavior from the repository root:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node --test tests/*.test.cjs
node scripts/check-ruby-guide.cjs <absolute-output-directory>
node scripts/check-ruby-visuals.cjs <absolute-output-directory>
node scripts/check-charge-cycle.cjs <absolute-output-directory>
node scripts/check-ruby-keyboard.cjs
node scripts/check-constellations.cjs <absolute-output-directory>
node scripts/check-ruby-hud.cjs <absolute-output-directory>
node scripts/check-ruby-game-over.cjs <absolute-output-directory>
node scripts/check-ruby-events.cjs <absolute-output-directory>
node scripts/check-ruby-supernova.cjs
node scripts/check-ruby-celestial-controls.cjs
node scripts/check-ruby-new-bosses.cjs
node scripts/preview-linked-bosses.cjs
```

Use meaningful regression tests for gameplay changes. For simple art edits, render the actual drawing functions and inspect rather than adding tests that only mirror implementation. Check actual gameplay scale, an enlarged view and several animation ages. A single static preview does not validate motion, priority or footprint.

`node --test tests/backdrop-parallax.test.cjs` raster-checks Gaia, Moon and Neptune across former vertical wrap boundaries, negative/zero camera offsets, and Neptune’s depth-lighting midpoint.

The teleport meteor browser check also verifies rules hide both banners, selectors do not cover the rules sheet, and Gaia/Neptune Primal Skill room selectors show next and active countdowns.

## Render tools

| Script in `scripts/` | Output argument / purpose |
| --- | --- |
| `preview-player-celestial.cjs` | Output PNG; suits and player states |
| `preview-all-bosses.cjs` | Output PNG; boss model gallery |
| `preview-celestial-skills.cjs` | Output PNG; celestial cast gallery |
| `preview-normal-monsters.cjs` | Output directory, optional prefix; aliens and attack overlays |
| `preview-rewards.cjs` | Output directory; Ruby, bomb, reward effects and blast boundary |
| `preview-battlefield.cjs` | Output directory, optional prefix; overview, details and pads |
| `preview-space-events.cjs` | Output PNG; actual event warnings, early/active/fading stages and renderer immutability |
| `preview-jupiter.cjs` | Output directory; actual warm, pursuit, overcharged and exposed battlefield states, palette-transition sweep, storm intensity and shard damage/healing effects; read-only art checks |
| `check-ruby-teleport-meteor.cjs` | Muted desktop checks of next/active meteor warnings and paused countdowns in the teleport picker on all five worlds and Endless Space |
| `check-ruby-jupiter.cjs` | Muted headless desktop route, rule sheet, C input, God control placement, HUD, loop and pause checks; closes the browser afterward |
| `preview-sun.cjs` | Output directory; Sun at three temperatures, bridge backdrop at three animation ages, materials/reservoir charge, units, actual Hydro Pulse HUD states and Sunburst/meteor battlefield and minimap comparison; checks read-only art |
| `preview-moon.cjs` | Output directory; Moon world at three ages, crystal cover close-up, and disguised Queen among illusions vs revealed |
| `preview-charger.cjs` | Inspect script arguments; warning, rush and recovery frames |

Full-page source-extraction previews must also bind the three exported render helpers from `encounter-art.ts`.

Scripts use bundled `@napi-rs/canvas` and Playwright paths on this machine. Adapt dependency paths on another machine without replacing the renderer. Reference images live in [visual-reference/](visual-reference/).

## Documentation maintenance

As part of any meaningful change, update the relevant [topic document](README.md) in the same task. Mechanics/balance changes belong in Gameplay, Enemies or Skills; visual rules/palettes and affected reference images belong in Visuals; sound changes belong in Audio; architecture or tooling changes belong here. Update cross-links when moving files.

Replace outdated facts with the resulting current rules. Do not append chat history, approval history, change logs, completed-task reports or test-run snapshots. Keep detail in its owning topic and use links elsewhere. The overview must stay short enough to orient a new agent without loading every reference.
