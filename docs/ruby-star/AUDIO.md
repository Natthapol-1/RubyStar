# Audio

[Overview](README.md)

Runtime mix in `game/engine.ts` is authoritative. `scripts/celestial-audio-map.json` identifies source assets; use the runtime gains below. Attack mix is 0.765. Game-over uses four descending sawtooth tones with peak gain 0.32 per tone. Current celestial gains before that mix: Solar .75 + swoosh .8; Lunar 1.1; Jupiter plasma .8 + laser shot .75 + Queen attack .55; Singularity .8 loop; Saturn .85; Venus .8 (`celestial/venus-veil.wav`); Binary Star .8 (`celestial/binary-star.mp3`, the user-supplied `binary_star.mp3`) + `celestial/gaia-reach.mp3` .45; Neptune .9 + electric .6; Sirius 1.3 + full-energy cue; Gaia construction .45 + occupied-field click .4 loop.

Source layers: Jupiter/Solar plasma `mixkit-sci-fi-plasma-gun-power-up-1679`, Solar swoosh `mixkit-long-sweeping-air-swoosh-167`, Gaia cast `mixkit-sci-fi-construction-complete-811`, Gaia occupancy `mixkit-sci-fi-click-900`, Jupiter shot `mixkit-laser-weapon-shot-1681`, Neptune layer `mixkit-screechy-electified-item-3213`, Venus the user-supplied `mixkit-sci-fi-positive-item-grab-3173`. Jupiter also uses `bossQueenAttack1.mp3`. Runtime files use renamed copies under `public/sounds/celestial`.

Singularity sound repeats until field expiry; use its gapless 1.046s loop with short edge fades. Gaia occupancy sound repeats only while at least one living enemy occupies its field. Loops stop on pause/hidden page, expiry, game over, restart and unmount. Audio should not continue through paused gameplay. Supernova detonation layers the bomb impact at volume 1 (ordinary bombs use about .636), `meteorExplode.mp3` at volume .85, and a 65Hz sawtooth tail at gain .3. Local sound preview: `/ruby-star-sound-preview.html`.


## Celestial skill ready (challenges)

When a challenge's celestial skill (F) comes back after its cooldown (`updateTrialSkill`), every world plays the supplied `ribhavagrawal-power-up-type-1-230548 (1).mp3`, copied to `celestial-ready.mp3`, once at .7 gain and original pitch/speed through Other Game SFX (`playUiSfx('celestialReady')`). The God panel's Skill Ready button uses the same recording when it restores the skill. This replaces the old acquired/chime layers only for F readiness; primal skills keep their own cues.

Normal star energy plays Endless's `powerUpBoost.mp3` at .38 through Other Game SFX whenever the bar crosses into full. All maps and reward sources use the same transition, including direct fills and the God panel's Full Energy button. A shard that fills the bar plays the power-up cue in place of the ordinary pickup sound.

## Star Gambit weapons

Weapon sounds play on the attack channel through `WEAPON_SFX` (`gambit.ts`). Each gain puts the clip's loudest 50ms near the player's own attacks: the Laser lands about -19 dB before the attack volume, bullets about -22 dB, frequent sounds lower.

| Weapon | Sound |
|---|---|
| Orbital Strike | `falling-thing.wav` when called (-22 dB, pitch 1.4); `bombExplode.wav` on impact (-18 dB, pitch .95) |
| Arc Blade | `slash.mp3` (-20 dB, pitch 1.1) |
| Comet Dash | `charging.wav` when charging starts (-24 dB, pitch 1.2); `speedBoost.mp3` on the dash (-20 dB, pitch 1.2) |
| Chain Spark | `jupiter-fence-hit.mp3` (-20 dB, pitch 1.25) |
| Boomerang Disc | `venus-sand-sweep.wav` (-22 dB, pitch 1.6) |
| Sentry | `place_bomb.wav` when placed (-22 dB, pitch 1.2); `laserBullet.mp3` per shot (-26 dB, pitch 1.5) |
| Gravity Well | `reverse.mp3` (-20 dB) |
| Ruby Lance | `laserBeam.mp3` at the Laser's level, pitch .8 |

Like the base attacks, a weapon that hits plays the alien-hit sound once per volley (each disc or dash contact counts separately). Gravity Well pulses play no hit sound.

## Saturn challenge

Saturn: blizzard damage plays `blizzard-damage.mp3` at .65 only when your HP actually drops. A grant plays `ice.mp3` at .55, and marking the next targets a soft high `constellation-choice.wav` (.2). As the grant rings appear 1.5s before a grant lands (`grantWarning`), the supplied crystal-beat recording `saturn-warning.mp3` (.6) warns of it. Frost shield coming to you or kept by the Absolute Zero field plays `shield.mp3` at .9. Breaking her frost shield plays a high `ice.mp3` (.35, rate 1.5) at most every 8 ticks. The recall warning (1.5s ahead) plays the same `saturn-warning.mp3` (.6) at rate 1.35, higher pitched; a recall that heals her plays `frost-shield-break.mp3` softly (.3), and a backlash the frost break with `saturn-barrier-break.mp3` (.55). Absolute Zero readiness uses the shared primal-ready recording, including the God panel’s Zero Ready refresh. C casts with the supplied time-stop recording, bundled as `absolute-zero-cast.mp3` (.75, playback rate 1.4); a frozen-tile freeze plays `freeze.mp3` (.55). Frostbiter growls with `hitHurt.wav` (.25, rate .6) as it crouches, leaps with `slash.mp3` and lands with `snowball-hit.mp3`; Hailer fires with `place_bomb.wav` and `falling-thing.wav` and its shells land with the frost break; Glacier Hulk winds up with `charging.wav` (.3, rate .6) and slams with the frost break and `bombExplode.wav` (.4, rate .7).

Dropper warnings use the Thorn Weaver's `playThornFall` helper: `falling-thing.wav` at .6 times the attack volume, normal pitch, starting when the tile locks for its 0.55-second descent. Landings use the existing Charger impact cue. Blinker displacement uses the normal teleport cue. Jammer uses the regular melee cue, the shared empowered reward sound when its teleport Wave is stored, and the normal Wave sound when that reward fires on arrival. Spook deaths layer `deghost.wav` at .28 times attack volume and pitch 1.4 with the supplied bleh recording, bundled as `spook-bleh.mp3`, at boosted 1.75 gain and normal pitch. The bleh follows the effects volume control.

## Menu sounds

`ui-sfx.ts` supplies menu/readiness cues, mostly synthesized with Web Audio at ×5 boost and a .6 peak cap, with recorded cues where specified. Lobby: hover/focus tick on cards and arrows, distinct select cues for Endless Space (warp-in sweep) and Ascension (three-note ascent with shimmer), a low denied buzz on the locked card, and page/back slides when rotating. Rule sheet: page slide when the HUD RULES button opens it and to Aliens & Bosses, back slide to Main Rules, power-down chirp on ✕ and a two-tone acknowledge on UNDERSTOOD (other arcade games keep the shared click). EXIT uses the back slide. Teleport: a rising warble when X/TP opens the menu, hover ticks on available chambers and the power-down chirp when cancelled; arrival keeps its existing cue. Tutorial: the acknowledge cue when a step is cleared and the Ascension cue on completion. Primal cooldown readiness and its God panel refreshes use Jupiter’s ready recording (`celestial/skill-ready.wav`, volume .7, normal pitch). Full Sunfire, Trident and Holy Light use the Gaia full-charge cue (`playStrikeCharged`), the bright UI chime with `strike-charged.wav` at .55. The same cue plays when their God panel fill buttons bring the meter to full. The celestial F recharge uses the separate supplied `celestial-ready.mp3` recording. Challenge victory: a fanfare (rising C–E–G arpeggio into a held major chord with a high shimmer). In-game ready cues from the same synth: the bomb ready again after its cooldown (the supplied power-up recording), the Moon Mark recharged (the shared recorded primal cue) and the Moon Mark casting (an airy 260→1047 Hz sine rise landing in overlapping triangle/sine glass chimes at about 1.5, 2.3 and 3.1 kHz, gently falling in pitch). The cast settles over .55 seconds alongside the travelling lights and target seal. Moon Mark readiness uses the shared primal recording; all voices use the shared effects mix, ×5 UI boost and .6 peak cap.

## Cutscenes

Each guardian reveal uses a sound from its encounter: King fire warning, Sentinel attack, Weaver thorn cast, Queen teleport, Reaper dash, Warden ice, Chanter singing, Prayer knockback burst, Dawn and Dusk attacks, or the Devourer's two eating layers. Neptune uses the full `seaSinging4.mp3` take at .6 times the Effects volume and holds the reveal through the end of the song before fading out.

Challenge arrivals play `speedBoost.mp3` as the thruster ignites. Their cruises and the intro's Course Set for the Ruby Star shot use the same 3.55-second edit of the supplied laser charging MP3 (`charging-sun-travel.wav`). Each challenge approach plays `meteorFalling.mp3` as the ship flies in and `gameModeClick.mp3` at docking. The Moon skips the docking click and plays the Queen's gameplay teleport cue, `ghostHunt2.mp3`, during her final reveal. The intro uses a 4.2-second stretch of `falling-thing.wav` (`intro-ship-fall.wav`) from the start of the overhead descent to impact, with its source pitch preserved. Cutscene sounds use the effects mix and stop when the scene is skipped.

## Music toggle

The HUD MUSIC button (next to RULES) turns the background music on or off and remembers the choice in this browser (`localStorage` key `rubyStar.music`). While it is off, nothing starts the music automatically: not entering a mode, the first key or click, or closing a rule sheet.

## Space events

`event-audio.ts` owns distinct event cues. All gains below are final HTML Audio volumes; playback rate changes intentionally shift pitch.

| Event | Warning | Active |
| --- | --- | --- |
| Black Hole | `celestial/solar-flare-swoosh.wav`, gain .35, rate 1 | Retriggers `reverse.mp3` every 0.35s of event time, gain .22, rate 1; overlapping tails up to 1.2s, maximum four voices |
| Shooting Star | `light.mp3`, gain .32, rate 1.25 | Solar swoosh, gain .35, rate 1.5; pickup adds energy-pickup cue at .4/rate 1.2 |
| Eclipse | `celestial/skill-ready.wav`, gain .3, rate .65 (full cue, about 1.6s) | Retriggers `seaDive.mp3` every 2s, gain .28, rate .65, tails up to 4.8s; maximum three voices |
| Supernova | `kingFireSpell.mp3`, gain .35, rate .65 | Formation layers Solar flare (.45/rate .75) and swoosh (.4/rate .85). Triggered charge uses `celestial/solar-flare-swoosh.wav` (.4/rate 1), followed by the detonation mix above |

Warning/arrival cues are bounded one-shots; Supernova charge lasts up to 3 seconds. One-shot event cues play on transitions. Black Hole repeats on its 21-tick cadence with bounded overlapping voices; Eclipse retriggers every 120 ticks so the sound's fading tail does not leave silence before expiry. Event voices pause in place during teleport selection, rules, Constellations and hidden pages, then resume from the same playback position alongside the simulation. At expiry, repeating voices finish with a 24-tick (0.4s) quadratic volume fade; individual repeated cue tails also fade through their final 0.25s rather than cutting off abruptly. Fades pause with gameplay; game over, restart and unmount cancel all voices. Hidden pages and unavailable audio cannot interrupt gameplay. `tests/event-audio.test.cjs` verifies assets, cue identity, overlap, pause/resume and cleanup.

Constellation choices play the user-supplied `mixkit-magic-sparkle-whoosh-2350.wav`, stored as `public/sounds/constellation-choice.wav`, once at volume .6 when the delayed selection screen opens. Paused ticks do not retrigger it.

Confirming a valid Constellation choice plays the separate user-supplied `constellation_choosing.wav`, stored as `public/sounds/constellation-chosen.wav`, once at volume .6. Invalid, duplicate or out-of-dialog selections do not play it.

Ascension unlock plays the user-supplied `47313572-sci-fi-launch-5-351240_dIxRlzHd.mp3`, stored as `public/sounds/ascension-unlock.mp3`, once at volume .7 on the tenth boss defeat. God Stage +1 and the direct debug Ascension helper also play it when first crossing the unlock threshold; later rewards do not retrigger it.

Charger rush contact plays a heavy impact: `hitHurt.wav` at the levelled Charger-impact gain (see below), playback rate .7 with pitch shifting, plus a short 90Hz triangle thud. It replaces the generic alien firing cue for Charger hits and also plays when shields absorb the hit or a Lunar Echo is struck. Missed rushes do not play it.

## Reserved sound assets

- Public sound asset: nexawave-whoosh-transition.mp3. Original user-supplied filename: rescopicsound-cinematic-designed-sci-fi-whoosh-transition-nexawave-228295_cX0J7na3.mp3. Reserved for future use; no gameplay cue currently references it.
- Public sound asset: sci-fi-explosion-09.mp3. Original user-supplied filename: daviddumaisaudio-sci-fi-explosion-09-190268.mp3. Reserved for future use; no gameplay cue currently references it.

## Totem overload

Totems reuse meteor-warning pulses once per second during their three-second overload warning, with the urgent pulse in the final second. The chamber blast plays the user-supplied `totem-explode.mp3`, stored as `public/sounds/totem-explode.mp3`, once at .9 before the shared .765 attack mix (.6885 final), replacing the bomb explosion cue. Overload warnings pause in menus and during Eclipse along with their timers.

## Aegis attack

Aegis uses the user-supplied `Aegis-attack.mp3`, stored as `public/sounds/aegis-attack.mp3`. It plays once when its existing strike connects with the player, Ruby or a Lunar Echo, in both shielded and exposed states. Gain is .8 before the shared .765 attack mix (.612 final); it replaces the generic alien shooting cue for Aegis.

## Shield and totem breaks

User-supplied assets under `public/sounds/`: `frost-shield-break.mp3` plays once when damage depletes an enemy's Frost Warden ice-shield pool (.7 before the attack mix); `totem-break.wav` replaces the generic alien death cue when a totem is destroyed (.85); `aegis-shield-break.wav` plays once when the last living totem is destroyed and Aegis's barrier actually breaks (gain 3 before the .765 mix, or 2.295 final). A Web Audio gain node boosts this cue beyond the HTML volume limit, roughly 3.3 times its earlier level; nodes disconnect when playback ends or fails. The final totem plays its own break and the barrier break together. Partial damage, totem overload/relocation and debug cleanup do not play these break cues.

## Aegis shield return

During the last 3 seconds of exposure, a synthesized two-note triangle chime plays at 3, 2 and 1 seconds (660→990 Hz, then 990→1480 Hz on the final second). It is deliberately softer and rounder than the square meteor/totem beep.

## Twin attacks, sharing and revival

Dawn's melee hits use `public/sounds/celestial/jupiter-storm.wav` at gain 1.3 before the .765 mix (.9945 final). The user-supplied `dawn_attack.mp3` remains stored as `public/sounds/dawn-attack.mp3` for future use. Dusk's user-supplied `dusk_attack.mp3` is stored as `public/sounds/dusk-attack.mp3` and plays once when its tracking charge fires at .8 before the mix (.612 final), layered with `celestial/neptune-electric.wav` at a Dusk-only multiplier of 3.5 on the normal .6 gain (1.6065 final after the .765 mix), using Web Audio amplification. Neptune's own skill keeps its normal electric-layer gain. `public/sounds/twin-revive.mp3` plays once when a fallen twin actually returns, at .85 before the mix (.65025 final). Downing a twin, paused ticks and final encounter completion do not play revival audio.

Each actual HP transfer plays `celestial/skill-ready.wav` once at the normal ready-cue gain (.5 before the .765 mix, .3825 final). Failed transfer attempts, full recipients, pauses and downed partners do not trigger it.

## Thorn Weaver field

The aimed field plays `falling-thing.wav` (0.75s, gain .6) starting 45 ticks before it erupts, so it lands with the falling seed; then the thorns erupt with `place-plant.mp3` (.4 gain). It never uses the player's `charging.wav`. Seed pods bursting in the Gaia challenge reuse `place-plant.mp3` at .5.

## Neptune

1.6s before the Trident lands, `meteorFalling.mp3` plays at rate 1.6 with pitch raised (`preservesPitch = false`, gain .5) so its fall ends on the strike; Neptune's electric cue (`celestial/neptune-electric.wav`) adds a crackle 0.5s before impact. The strike itself uses the meteor impact sound.

The Sea Chanter resurfaces to the shark charge cue (`seaSong.mp3`) played backwards at 1.25× speed with a raised pitch; the reversed clip is decoded and flipped in memory through Web Audio (`playReversed` in `audio-settings.ts`), preloaded when she dives. A dive timeout also plays her heal cue.

## Gaia Sunfire

Full Sunfire plays the same incoming shot as Trident: `meteorFalling.mp3` at .5 gain and rate 1.6, starting 94 ticks before impact. It triggers once per full strike, follows the gameplay countdown and does not play for partial casts.

The blast layers the Solar Flare cue (`celestial/solar-flare.wav`, ×1–1.6 with charge) with `sci-fi-explosion-09.mp3` (gain .45–.95 with charge). A full chamber burn plays both at their strongest plus `bombExplode.wav` (.9), with a heavier screen shake.

## Singularity Jaw

The Jaw's warning plays `charging.wav` at .4, pitch .5. Its bite plays `jaw-bite.wav`: the supplied freesound community monster bite, trimmed to 0.42–1.66 s of the original (its leading silence and tail removed) so it starts at once. It plays boosted to 1.6, pitched up to 1.35 (about 0.9 seconds), landing near -6 dB, deliberately louder than ordinary attacks. It starts 11 ticks before the snap (`JAW_SOUND_LEAD`) so its crunch lands as the jaw shuts. Catching you adds `hitHurt.wav` at .55, pitch .7.

## Singularity Maw windows

Each Maw's opening is announced on the simulation tick (its warning is silent) with the deep gulp: `reverse.mp3` at .35, slowed to .42 (about 4.5 seconds, a little past the window), layered with `celestial/singularity.wav` at .22, slowed to .25, while the backdrop black hole gulps with it. A Maw held open or closed from the god panel stays silent. A Maw teleporting is silent.

## Sirius challenge

Each step that extends the traced part of a rune plays `celestial/skill-ready.wav` at .55, pitched from .8 up to 1.6 as the rune nears completion. Supplied recordings: rune cast `sirius-rune-cast.mp3` (arcane seal activation) at 1.5 (boosted); traced rune `sirius-rune-seal.mp3` (holy magic seal activation) at 2.2 (boosted) layered with `holy2.mp3` at .6, pitch 1.1; light/dark swap `sirius-heal.mp3` (holy healing spell) at .7, pitched to .75 as the dark falls. The swap warning is `celestial/sirius-surge.wav` at .35 (pitch .6 before dark, 1.3 before light). A missed rune plays `dusk-attack.mp3` at .55, pitch .8, layered with `holy2.mp3` at .8, pitched down to .6. The Ruby ritual starts with `holy1.mp3` at .8; picking plays `commandClick.mp3` at .5; Ruby's move plays the teleport `gameModeClick.mp3` at .7; a right guess the supplied healing magic recording `sirius-guess-right.mp3` at .9, a wrong one `hitHurt.wav` at .5 (pitch .7) layered with `shieldBreak.mp3` at .45 (pitch .8). Zealot: the Charger's sounds: the lane-lock `place_bomb.wav` (`ALIEN_ATTACK_SFX.chargerLock`) as it braces, the launch shot (`ALIEN_ATTACK_SFX.shot`, pitch 1.3) as it dashes and the charger impact on a hit. Bellringer: `charging.wav` at .4, pitch 1.3, as it lifts its bell, then the supplied church bell recording `sirius-bell.mp3` at .8 when it rings. Sacred Halo (C) casts with `sirius-heal.mp3` at 1.4 (boosted), pitch 1.25; the supplied holy spell recording `sirius-float.mp3` plays softly at .3 under the whole float, slowed to .5× with pitch kept so its ~3.5s audible part spans the 6s float (a fresh copy starts only if a float runs longer), and fades out over half a second as you land (stopped on pause, hidden page, exit and reset); and its ready cue is the shared primal recording at .7, normal pitch; filling Holy Light resets the cooldown and plays the Gaia full-charge cue once. A full-Holy-Light burst layers `sirius-rune-seal.mp3` at 1.4 (boosted), `holy2.mp3` at 1, pitch .8, `levelup.mp3` at .6, pitch .7, and the holy spell recording `sirius-float.mp3` at full speed and 1.2 (boosted), over the soft float layer.

## Moon challenge

Entering darkness plays the supplied Dark Magic recording (`moon-darkness-entry.mp3`) once through Other Game SFX, with 2.5 times gain before peak compression. It uses the original speed and pitch. Reentry restarts the cue if its previous play is still active. The clip shares ambient audio pause, resume and cleanup.

When banked healing is paid out on the Queen's jump, the departure-chamber pulse plays `moonHealingWave`: `/sounds/gem_passive_2.wav` at .75 volume, original speed and pitch, through the shared effects mix. It plays once with the visible healing pulse, globally, with no loop or extra synthesized/recorded layers; a jump without banked healing plays no healing cue.

The real Moon Queen's attack recording and click layer play at 90% of their usual volume. Illusions, other maps, and her teleport/reveal cues keep their existing mix.

## Moon reveal

When the Moon Queen's disguise breaks before a jump, the Lunar Echo cue (`celestial/lunar-echo.wav`, gain .99) plays from 0.1s in (skipping its silent start) at rate 1.6 with pitch raised (`preservesPitch = false`), so it lands with the reveal, over `frost-shield-break.mp3` at .4; both before the .765 attack mix.

## Sun cooling

The inactive Sun Explore prototype uses Other Game SFX. Footsteps play on completed tile steps, with different sounds for district floors and catwalks. The furnace hum, steam hisses and coolant flow fade in around their physical sources as the player approaches. The hum and steam quiet during shutdown. Talking, reading, inspecting, advancing and closing dialogue, and returning to the star map use shared UI cues. The bypass test uses the coolant pump pulse, shutdown uses the extinguish cue, and the shift bell reuses the bell recording. Skip also plays a UI cue.

Normal Hydro Pulse and cooling-station completion reuse Neptune’s Tide at its existing gain. Reaching zero temperature plays a dedicated pressure-collapse cue once: a 140→36 Hz triangle (.12 voice gain), 56→28 Hz sine (.08), 1568→196 Hz triangle (.045), then a two-note icy rise. It layers `sci-fi-explosion-09.mp3` at .9, `frost-shield-break.mp3` at .8 and Neptune’s Tide at ×1.2. Repeated cooling while already extinguished does not replay the transition. Empowered waves play Tide at ×1.25, the Neptune electric layer at ×.9 and a dedicated synthesized pressure impact: 140→42 Hz triangle (.085 voice gain), 64→38 Hz sine (.06), 1100→150 Hz triangle (.035) and 1760→660 Hz sine (.025), all using the standard UI gain/cap. Each successful empowered cast plays once, including the finishing blow. Thermal Eruption layers the Solar swoosh at 1.25 times its usual gain with `sci-fi-explosion-09.mp3` and `bombExplode.wav`, each at full volume. Sunburst detonation layers the Solar Flare cue at 1.3 times its usual gain, the King fire spell at .95 and both explosion recordings at full volume. These impacts play once at detonation, at their original speeds and pitches.

Holding Space while actually charging a station plays a coolant-pump pulse immediately and every 20 gameplay ticks (about .33s): a 420→620 Hz triangle (.075 voice gain, .09s) and 1240→980 Hz sine (.054, .12s), using the standard UI gain/cap. These voices are three times the original station pulse gains. Each pulse layers Ruby’s manual-heal sound, `/sounds/deghost.wav`, quietly at volume .08 (manual healing uses .32), and restarts the same 18-tick player jiggle. Scheduling stops on release, leaving range, King blocking, completion/relocation or pause. No persistent Sun audio loop is added.

Sunburst marking plays the supplied extraterrestrial-alert recording (`/sounds/sun-heat-warning.mp3`) globally, at 1.2 times playback rate with pitch preservation disabled for a higher-pitched alarm. It repeats every .8 seconds, then every .4 seconds in the final two seconds. Managed overlapping tails are capped at seven voices per warning type, each at full volume (1.0) through the effects mix; pause/hidden-page handling is shared with ambient sounds. Detonation, defusing, extinguishing and encounter cleanup stop all its voices.

## Jupiter and critical heat

Jupiter plays the supplied Arcade recording (`jupiter-shard-race.mp3`) once when Shard Race begins, including entry through the God panel. It uses .85 gain through Other Game SFX at the original speed and pitch. The dash and fence hit use their supplied recordings. The Reaper's existing slash mix remains. C readiness plays `celestial/skill-ready.wav` at .7, normal pitch, shared by primal cooldown readiness cues. It sounds once when cooldown reaches zero, including a God-panel refresh of an active cooldown. No persistent audio loop is added; simulation owns all scheduling and menus pause it.

Sun heat at 90+ uses the same recording at its original speed and pitch, repeating every .8 seconds and every .4 seconds at 97+ heat. Cooling below 90, extinguishing, encounter cleanup or a new run stops every heat-warning voice.

Entering either Jupiter pursuit round plays the supplied `jupiter-pursuit-thunder.mp3` at .85 as a global one-shot, with no synthesized alarm layered over it. It is not limited by chamber or camera, does not loop or restart each frame, and also plays when the God panel enters Pursuit.

Charging and pursuit use only the supplied recordings, with no synthesized charge or pursuit cues. Jupiter charging starts the supplied `jupiter-charge-power-up.wav` at .75 once per charge, including initial arrival, the second round and loop restarts. Its first 3.8 seconds of audible buildup are stretched to the full charging duration (currently 6 seconds), with pitch preservation enabled. The nearly silent trailing fade is excluded from the timing, and pursuit stops the unused tail. It pauses with gameplay and stops when pursuit begins so it cannot spill into the thunder cue. Occasional background electricity uses the supplied `jupiter-electric-ambient.mp3` at .3, first after 3–7 seconds, then at randomized 6–14-second intervals. Only one ambience clip can play at once. It shares the ambient-audio pause/resume/hidden-page lifecycle and stops on challenge completion, loss, restart or leaving the page.

Successful Volt Fence casts use the supplied `jupiter-fence-cast.wav` at .85, replacing the synthesized cast chirp. Cooldown-blocked or paused casts do not play it.

A Volt Fence triggered by an enemy plays the supplied `jupiter-fence-hit.mp3` at .85 once as it deals damage and breaks, replacing the synthesized break sound.

The Reaper's dash plays the supplied `jupiter-reaper-boost.mp3` at .85 once when his dash launches immediately on cooldown completion, without a windup; it replaces the synthesized dash chirp.

Meteor impacts consume their warning on the strike tick: the explosion recording and chamber damage occur once. The independent impact animation then expires while the next meteor timer counts down.

Jupiter Storm Shard pickups reuse the supplied fence-hit recording at .7 for the player-triggered strike; Reaper healing uses the existing pickup cue. Each cue fires once per consumed shard.

The shared bomb-ready cue uses a 392 Hz square click at .09 voice gain and a 784 Hz triangle at .12, before the UI master gain. This mix applies to every map.

Reticulum stuns are silent; the Laser hit sound covers them.

Desktop audio settings independently scale BGM, attack recordings and other game/UI effects without changing their original relative mix. Preferences persist in the versioned local profile; paused loop lifecycles remain unchanged. The MUSIC button provides a quick BGM toggle. All clips and fonts are local for offline play; see [Windows desktop](DESKTOP.md).

New lobby utility icons, settings/controls actions, pause actions, terminal tabs and debug stage jump reuse the synthesized hover, confirm, page, back or Ascension cues. Other Game SFX scales these cues. Web settings retain the legacy music toggle and additionally persist the three audio levels locally.

Jupiter pursuit Overdrive plays the supplied `/sounds/aegis-attack.mp3` at 1.6 before the shared attack mix, with `jupiter-reaper-boost.mp3` at 1.7, once when the bar reaches full from phase 2. Bomb readiness plays the supplied `powerUp.wav`, bundled as `/sounds/bomb-ready.wav`, once at base gain .85 through Other Game SFX; it replaces the synthesized cue.

Celestial blessing selection plays the supplied `/sounds/gem_passive_trigger.wav` at .75 base gain when the overlay appears, replacing both the former synthesized gem chime and the constellation-chosen recording for blessings. Ordinary constellation selection is unchanged.

Amethyst decoy placement uses the normal gem passive cue. Decoy firing uses the same `/sounds/gem_passive_2.wav` at 1.4× playback rate with pitch preservation disabled and .6 base gain. All decoys share a 30-tick firing-cue gate and a shot on the placement tick adds no second cue. This follows Other Game SFX volume; the player’s bullet sound is unchanged.

Gem mechanics use the supplied `/sounds/gem_passive_2.wav` at .85 base gain: Ruby on entering its active buff, Emerald only on crossing into ten live stacks, Amethyst on actual decoy placement, Diamond on actual shield gain, Amber on actual energy gains and full-energy refresh, Pearl on reflection, Opal on a coordinated copy, Obsidian on creating a well, and Stardust on an actual shield grant. Sapphire plays the cue only when its leech actually restores player HP, with a 60-tick (one-second) sound cooldown. Other repeated events are limited to once per gem per 30 gameplay ticks; simultaneous gem procs share one cue. Peridot creates and refreshes walking fields silently. Peridot and Obsidian play `/sounds/gem_field_hit.wav` at .35 on damaging pulses, shared across overlapping fields and enemies with a 30-tick gate. All three recordings follow Other Game SFX volume; only the Amethyst firing variant is pitched up.

Comets play the meteor warning pulse once when an area is marked, `falling-thing.wav` (0.75s) at .6 × attack mix as the comet starts its final 45-tick fall, and the bomb explosion at impact. A Lancer starting its charge plays `charging.wav` pitched to 0.84× (about 0.7s, the windup length), only within 16 tiles of the player; its beam reuses the laser sound. A Charger within 16 tiles plays the bomb-placement cue when it locks its lane and the alien shot at rate 1.3 when the rush starts. The Eridanus echo wave plays the same Wave sound at the same volume as the player's Wave when it lands.

Soul Devourer bites layer `soundWaveAttack.mp3` at .49 and `slash.mp3` at .35 × attack mix; its eating sound is unchanged.

A heavy bullet shot (every 20th) layers `laserBullet.mp3` at .9 × attack mix and 0.7 rate with `bomb-ready.wav` at .35 and 1.3 rate over the normal shot sound; its hit adds `hitHurt.wav` at .45 and 0.8 rate. A killed Impostor plays the decoy-break sound (`decoyDeath.mp3`).

Non-boss alien attack sounds are levelled to about -21 dB (loudest 50ms RMS after gain) so no attack stands out; gains live in `ALIEN_ATTACK_SFX` (engine.ts). Boss attacks keep their own louder levels. When adding an alien attack sound, measure it and set its gain to land near -21 dB.

| Attack | Sound | Gain |
| --- | --- | --- |
| Melee hit (all melee aliens), Charger rush start, Shooter fire | `alienShootLaser.wav` (rush 1.3 rate, Shooter 0.8 rate) | .285 |
| Sniper shot, Lancer beam | `laserBeam.mp3` | .266 |
| Lancer charge | `charging.wav` at 0.84 rate | .556 |
| Charger lane lock | `place_bomb.wav` | .174 |
| Charger impact | `hitHurt.wav` at 0.7 rate | .195 |
| Bomber explosion | `bombExplode.wav` | .248 |
| Shooter orb hit | `snowball-hit.mp3` + `strike-charged.wav` (combined) | .272 + .191 |

Special aliens share `playSFX_special` (engine.ts):

| Event | Sound |
| --- | --- |
| Shooter orb hits the player (damage + stun) | `snowball-hit.mp3` .272 at 1.1 rate, plus `strike-charged.wav` .191 at 1.35 rate |
| Shooter orb hits a placed Ruby | `snowball-hit.mp3` .4 × attack mix at 0.9 rate |
| Bleeder curse starts (not on refresh) | `poisoned.wav` .45 at 0.8 rate |
| Snatcher grabs Ruby | `snatch-whistle.wav` (cartoon toy whistle) at 1 |
| Impostor takes on a boss look (within 16 tiles) | `deghost.wav` .4 at 0.7 rate |
| Enchanter pulse (within 16 tiles) | `gem_passive_trigger.wav` .5 × attack mix at 0.8 rate |
| Reflector bounces a bullet / returns a laser | `shield.mp3` .3 at 1.8 rate / `laserBeam.mp3` .266 at 1.3 rate; a bounced bullet hitting you plays the orb-on-Ruby impact |
| Trapper plants a mine (within 16 tiles) / mine fuse / mine blast | `place_bomb.wav` at the Charger lane-lock level / `bomb-ready.wav` .3 at 1.4 rate / the player's bomb sound (`bombExplode.wav`, .832 × attack mix) at 1.35 rate |
| Kill buffs | Enchanter `powerUpBoost.mp3` .4 at 0.85 rate; Bleeder regeneration has no activation sound; Snatcher `shield.mp3` .5; Reflector and Trapper share Enchanter's `powerUpBoost.mp3`. The Shooter buff is silent |

Singularity sound cooldowns: every repeatable Singularity sound plays at most once every second per kind (`soundGap`, `devourerSoundAllowed`): Devourer bites, meals (2.5 seconds instead, `eatSoundGap`), bursts and jumps (one shared explosion cooldown), swallows, a body lighting its fuse, hook slams and wall hits, the hook's ready chime, and Soulless attacks. Maw windows, the Jaw and hook grabs and throws are not repeatable enough to need it. Singularity Maw: a swallowed alien plays `reverse.mp3` at .35, pitch 1.1; a Devourer body uses .7, pitch .55, layered with `celestial/singularity.wav` at .45, pitch .6. The centre's throw plays `hitHurt.wav` at .6, pitch .6. Meals use the Endless meal sound (`reverse.mp3` + `grow.wav`) at 80% volume, at most once a second. The original's burst plays `sci-fi-explosion-09.mp3` at .8, pitch .8, with the meal sound. Gravity Hook: latching plays `jupiter-fence-cast.wav` at .35, pitch 1.3; the fling `speedBoost.mp3` at .35, pitch 1.4; a slam into another body `hitHurt.wav` at .5, pitch .8, with `bombExplode.wav` at .25, pitch 1.2; a wall hit `hitHurt.wav` at .4, pitch .9; readiness `celestial/skill-ready.wav` at .9, pitch 1.1. The Feast chain has no sound of its own.

Grappler uses Lancer’s `charging.wav` at the shared lane-warning gain and .84 playback rate for its 0.7-second warning, Lancer’s `laserBeam.mp3` firing cue on hook launch, and the Charger impact cue on contact. Its CC-immunity kill reward uses the shared empowered reward cue. No looping cable audio.

Entering Jammer interference plays one 0.2s low sawtooth buzz (130Hz, gain .06) with the existing `celestial/empty-charge.wav` chirp at .38 gain and .8 playback rate, both explicitly on Effects. Staying inside or overlapping fields does not repeat the cue; leaving rearms it. Checks use the actual player after movement and enemy updates, including during Eclipse, and pause with gameplay.

Soulless bone lunge: a quiet `strike-charged.wav` click at .12 × attack volume and .8 rate when it braces; `slash.mp3` at .25 × attack volume and 1.2 rate when it lunges; the existing Charger impact cue only if its one swipe connects. No laser or gunshot cue.

Singularity Convergence starts with `reverse.mp3` at .65 gain / .5 pitch and explodes immediately after its last arrival with `sci-fi-explosion-09.mp3` at .9 / .65 layered with `meteorExplode.mp3` at .45 / .75. It uses the Effects mix and advances only during gameplay.

The Sun Flare Spitter uses the existing King fire family at lower gain and higher pitch: `kingFireWarning.wav` at .14 / 1.6 for its locked windup, then `kingFireSpell.mp3` at .4 / 1.3 layered with `kingFireSpread.wav` at .22 / 1.5 once per three-fireball volley. Water uses the existing Hydro Pulse sound.

A Scorch Sapper draining nonzero station charge plays `celestial/empty-charge.wav` at .18 gain and .75 pitch, at most once per second per Sapper (`sapperSoundGap`). It stops scheduling cues when it moves away, is interrupted, has no charge left to drain, or gameplay pauses; no persistent loop is created.

Venus totem placement uses one shared arrival cue for both initial spawns and overload repositioning: Saturn’s grant-warning recording, `saturn-warning.mp3` at .9 gain and normal pitch, starting as it rises from the sand. Each actual placement plays once; water uncovering an existing buried totem does not retrigger it.

Sporelings reuse the Shooter release cue for their travelling spores. Impacts use `place-plant.mp3` at 0.3 gain and 1.3× pitch as the vine patch appears.
