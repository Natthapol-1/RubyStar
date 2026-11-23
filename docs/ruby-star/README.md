# Ruby Star development overview

Ruby Star is a top-down space-station survival/defense game. `/` is the mode lobby; modes are listed in [Gameplay](GAMEPLAY.md#modes-and-lobby).

## The game in brief

**Core loop.** You are a square ship protecting Ruby (a pink gem) across four rooms in a 2×2 grid: ALPHA top-left, BETA top-right, GAMMA bottom-right, DELTA bottom-left. If either of you hits 0 HP, the run ends. Tools: laser, held-charge wave, bullets (every 20th is heavy), speed burst, bomb, carrying Ruby, healing beside it and teleport pads. A full star gauge makes your next ability powered. Hazards: meteors move clockwise through the rooms, comets start at stage 3, and four rare space events (Black Hole, Shooting Star, Eclipse, Supernova).

**Endless Space.** Stage = bosses defeated, drawn from ten boss encounters. Alien types and difficulty tiers unlock over time. Every third boss kill offers one of three constellation upgrades (44 in all). From stage 10 (Ascension) boss kills give a one-use celestial skill on F that also changes your suit; Ascension mode starts a run there. From stage 20 (Transcendence) two bosses can be active at once and you choose a gemstone blessing every ten stages.

**Celestial Challenge.** A star map of ten worlds, all playable. Each is a three-phase fight against one guardian with its own aliens, a primal skill on C (middle-click), a recharging F skill, a world look and an animated picture-card rule sheet. Each world's F skill should matter to that world's mechanic, not just be a generic damage or heal button.

**First Orbit** is the guided tutorial. **Star Gambit** is a run-building mode in development.

## Topic references

Read only the topics a task needs.

| Topic | Reference |
| --- | --- |
| Modes, lobby, controls, combat, Ruby, energy, teleport, difficulty, meteors, comets | [Gameplay](GAMEPLAY.md) |
| Black holes, shooting stars, eclipses and Supernovas | [Space events](EVENTS.md) |
| Normal aliens, bosses, targeting, shields, defeat rewards, shared challenge alien pool | [Enemies and bosses](ENEMIES.md) |
| Constellations, gemstone blessings, Ascension and celestial skills | [Skills and upgrades](SKILLS.md) |
| Build comparison targets and activation tradeoffs | [Build balance](BALANCE.md) |
| Art direction, palettes, models, effects, battlefield and UI | [Visual style](VISUALS.md) |
| Sound assets, layers, mix and loop lifecycle | [Audio](AUDIO.md) |
| Star Gambit: what is built and the plan | [Star Gambit](STAR-GAMBIT.md) |
| Windows builds, saves, offline support and desktop testing | [Windows desktop](DESKTOP.md) |
| Code map, implementation rules, rule sheets, God panel, checks and render tools | [Development](DEVELOPMENT.md) |

**Celestial Challenge worlds** (rules, phases, aliens, look and checks):

| World · guardian | Core mechanic | Reference |
| --- | --- | --- |
| The Sun · Fiery King | Temperature, cooling stations, Cinder Wisps, Hydro Pulse | [Sun](SUN.md) |
| Venus · Aegis Sentinel | Buried numbered totem sequence, Sand Swirl, the Sentinel's leap and lance | [Venus](VENUS.md) |
| Gaia · Thorn Weaver | Overgrowth territory, Sunfire, Sunstones | [Gaia](GAIA.md) |
| The Moon · Shadow Queen | Illusions, reveal, mirrors, Moon Mark, darkness | [Moon](MOON.md) |
| Jupiter · Storm Reaper | Charge, storm pursuit, Shard Race, Volt Fence | [Jupiter](JUPITER.md) |
| Saturn · Frost Warden | Frost shields, grants and recalls, Absolute Zero, blizzard | [Saturn](SATURN.md) |
| Neptune · Sea Chanter | Dives and echoes, Ocean’s Melody, healing-charged Ocean’s Chorus | [Neptune](NEPTUNE.md) |
| Sirius · Blind Prayer | Light/dark swaps, traced runes, Holy Light, Sacred Halo, the Ruby guess | [Sirius](SIRIUS.md) |
| Binary Star · Astral Twins | Three twin lives, opposite-room jumps, magnetic poles, collisions | [Binary Star](BINARY.md) |
| The Singularity · Soul Devourer | Maws that open together, the Gravity Hook, Souls, the multiplying swarm | [The Singularity](SINGULARITY.md) |

**Lore** (story only; skip it during development): [Sun](SUN-LORE.md), [Venus](VENUS-LORE.md), [Gaia](GAIA-LORE.md), [Moon](MOON-LORE.md), [Jupiter](JUPITER-LORE.md), [Saturn](SATURN-LORE.md), [Neptune](NEPTUNE-LORE.md), [Sirius](SIRIUS-LORE.md), [Binary Star](BINARY-LORE.md), [Singularity](SINGULARITY-LORE.md).

[boss-remodels/](boss-remodels/README.md) archives unused boss remodels.

## Development direction

- Keep the defense loop centered on protecting both player and Ruby. Carrying, teleporting, healing, meteor timing and enemy priorities should remain meaningful choices.
- Style is **blocky neon-vector** ([Visual style](VISUALS.md#style-blocky-neon-vector)): match the luminous square player and full-energy aura with crisp rectangular silhouettes, dark insets, pale cores and selective glow; moving parts rotate as whole solid shapes, never as pixel staircases. Keep each alien, boss and celestial effect distinct.
- Target desktop only; do not implement or verify mobile unless explicitly asked.
- New modes get their own route and a lobby card. A new or reworked challenge world gets its own module, rule sheet and reference document.
- Keep player-facing rules short and clear ([Rule sheets](DEVELOPMENT.md#rule-sheets)); technical detail belongs in these references.
- Read the relevant source before editing. Documentation describes intended current behavior; resolve discrepancies against executable code and meaningful tests, then correct the documentation.

## Keep this reference current

When a change affects mechanics, balance, controls, progression, enemies, skills, architecture, audio behavior or visual direction enough to matter to future development, **update the relevant topic file in the same task**. Update this overview only when navigation or high-level direction changes. Refresh affected visual-reference images when model or style changes make them inaccurate.

Write the resulting current rules directly. Replace obsolete values instead of appending change notes. Do not record chat transcripts, version history, abandoned designs, approval history, task status, commit hashes or test-run diaries. Keep each fact in one topic and link to it elsewhere; add new paragraphs under the section they belong to, not at the end of the file.
