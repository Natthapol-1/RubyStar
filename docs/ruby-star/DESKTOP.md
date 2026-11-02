# Windows desktop

[Overview](README.md) · [Development](DEVELOPMENT.md)

Ruby Star uses one Next.js / React / Canvas game for web and Windows. Electron supplies Chromium, an isolated preload and a small main process. Tauri would require a Rust toolchain and depend on the Windows WebView runtime; Electron preserves the existing browser rendering and audio behavior with a bundled runtime. No engine conversion or duplicate assets are involved.

## Commands

Use Node 20 or newer, then `npm ci`.

| Command | Purpose |
| --- | --- |
| `npm run dev:web` | Existing browser development workflow at localhost:3000 |
| `npm run build:web` / `npm start` | Build and serve the web application |
| `npm run dev:desktop` | Start/reuse the dedicated Next development server at 127.0.0.1:3001 and open/focus Electron; closing stops a server owned by this launcher |
| `npm run build:desktop` | Export every game route and all public assets to `out/` |
| `npm run package:windows` | Build the export, then create a Windows x64 NSIS installer and ZIP in `dist/` |
| `npm run check:desktop` | Launch the exported app through Playwright using a separate temporary test profile |
| `npm run test:desktop` | Save recovery, onboarding, unlock and resume regression tests |
| `npm test` / `npm run typecheck` | Shared gameplay regressions and TypeScript validation |

`desktop/package.json` is the packaged application manifest, with no production Node dependencies. Packaging copies the static export into the application resources; Next.js and build tools are not shipped as runtime dependencies. Keep its release version in sync with the root manifest. `desktop/main.cjs` serves only the bundled export over `ruby://game/`; packaged play starts no HTTP server and blocks external requests. The desktop build snapshots source in a unique `.tmp/desktop-build-*` directory, builds there, then stages a clean static export in `out/`. This leaves running web/app development servers intact. Desktop development uses `.next-desktop-dev` and port 3001; normal web development uses `.next` and port 3000. The launcher reuses an existing Ruby Star server rather than starting a conflicting copy.

## Window and controls

The window starts at 1280×800 and supports resizing down to 1024×600. Canvas dimensions follow the available viewport while the existing camera retains square tiles and world coordinates. F11 or Alt+Enter toggles fullscreen. Escape or PAUSE opens the pause/settings panel; Continue resumes. SAVE & RETURN TO LOBBY and SAVE & QUIT preserve the current run. Window focus loss pauses gameplay. Closing the window requests a renderer snapshot and flush before shutdown. During play, desktop runs also checkpoint every 15 seconds and when the window loses focus, becomes hidden or navigates away. Checkpoints flush immediately; a forced server/process stop can lose changes since the last checkpoint. An unanswered Resume prompt never overwrites the stored run. A single-instance lock prevents simultaneous save writers. BGM, attack SFX and other SFX have independent saved volume sliders. The existing MUSIC button remains a quick toggle.

F3 toggles a small overlay only in development builds. It measures intervals in the real battlefield rendering loop: current FPS, a rolling five-second average, and frame time. It does not change fixed-timestep simulation. Production builds do not enable the overlay. Fullscreen, settings, saves and terminal use the same dark panels, pale type and neon accents as the game.

## Profiles and run snapshots

The stable per-user location is `%APPDATA%\Ruby Star\saves\profile-v1.json`, outside the installation directory. Installer updates and uninstall do not delete it. The separate `resumes` section stores versioned run snapshots; Endless and Ascension share one slot, while each playable challenge has its own. On entry a saved run offers Resume or Start New Run. A finished run removes its snapshot. First Orbit has its own resume slot until completion; map previews do not create snapshots. Existing temporary resources, enemies, hazards, timers, upgrades and held powers belong to the snapshot, not permanent progression.

The version 1 profile stores First Orbit completion, one shared highest stage for Endless and Ascension, guardians defeated in normal Endless, cleared challenges, encountered aliens/bosses, collected constellations/skills, audio settings and input bindings. A single persistent HIGHEST RUN strip beneath the lobby title shows the shared Endless record while browsing. Game-over screens also show the shared record at the top right of the card; mode cards do not repeat it. Records update on reaching a new stage, survive run restarts and app updates, and preserve existing records. Older separate records are merged using the highest of normal Endless, Ascension and the saved run. Ascension is the same run mode starting at Stage 10. Development stage skips count, as they do for unlock testing. These are records of existing gameplay. There is no separate achievement system or account. Actual guardian defeats in development count for testing the same progression flow, including God protection and spawn-suppression toggles. Stage-jump buttons record reached stages for Ascension testing, but do not record guardian defeats. God controls are absent from release builds. The existing web game retains its browser music preference and open mode access; desktop progression gates are platform-specific.

The renderer retains one shared profile session across development module replacements and route bundles, including pending writes and save-protection state. A real app restart loads that profile from disk. Updates debounce for 400 ms and serialize writes through the main process. A write flushes a temporary file before atomic replacement on the same volume, retaining the previous readable file as `.bak`. Corrupt JSON is preserved with a `.corrupt-<timestamp>` suffix; a readable backup is recovered when possible. Missing saves start a fresh profile. Newer versions and structurally invalid profiles disable saving and display a message rather than overwrite data. Save failures remain visible in the application and cancel a normal close so the player can retry. Save IPC accepts only a bounded, versioned document from the main frame; the renderer never receives paths or unrestricted filesystem APIs.

The earlier web implementation saved only `rubyStar.music` in localStorage. The adapter retains that setting when it is present in the desktop origin. Browser profiles belong to separate origins and cannot be silently read by Electron; there is no earlier web progression to migrate. Leave any browser data intact.

The profile folder and one versioned portable document are suitable for a later Steam Auto-Cloud mapping. Steam, Steamworks, DRM, Steam achievements and cloud synchronization are not implemented or required. Future schema changes must add explicit migrations and preserve newer saves. Test resume compatibility when changing state fields; malformed snapshots are not offered for resume.

## Offline assets and security

All audio, art and fonts are bundled. Fonts and their OFL licenses live in `public/fonts/`. There are no runtime API/account requirements. Installing development dependencies and downloading packaging tools requires internet; packaged gameplay does not.

The renderer uses context isolation, sandboxing, disabled Node integration, denied permissions and window creation, restricted navigation and a production content policy. The preload exposes only load/save, fullscreen and shutdown coordination. Resource resolution stays inside the export directory. The packaged app contains no remote content and no development server. Upgrade Electron and review dependency advisories before releases; the web framework/build-tool dependency audit remains a separate maintenance concern from the dependency-free desktop main process.

## Testing and distribution

Build the export before `npm run check:desktop`. The check uses a test-only user-data folder under `.tmp/desktop-smoke`, never the player's profile. Test a clean profile, complete First Orbit, return to the lobby, and check the Endless default. In normal Endless, defeat guardians to unlock worlds and reach stage 10 for Ascension. Clear a supported challenge to see its gemstone reward and unlocked blessing. Inspect the exploration terminal's recorded/undiscovered entries and cleared/uncleared map labels.

Exercise all four rooms, Ruby carrying/healing, teleport, both mouse buttons, keyboard abilities, meteors and guardian phases. Test pausing and resuming during combat and upgrade choices, both Endless entry cards sharing a run, and each challenge retaining its own run. Check BGM and each SFX slider with audible output. Run offline with external network access blocked. Test 1024×600, 1280×720, 1920×1080 and fullscreen. Repeat on representative low-end hardware and high-refresh monitors; unit tests do not establish a performance baseline.

For testers, share the NSIS installer or the complete extracted ZIP. Do not send only the executable from `win-unpacked`, which needs adjacent runtime files. Unsigned packages can show Windows SmartScreen prompts. Before a commercial Steam release: obtain distribution rights for all audio/fonts/art, sign releases, choose final branding, test upgrade/rollback and save migrations on clean machines, profile sustained fights, validate supported hardware, and prepare store assets, accessibility review and support/crash-reporting policy. Steamworks integration is a separate task.
