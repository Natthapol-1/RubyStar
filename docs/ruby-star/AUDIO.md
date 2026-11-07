# Audio

[Overview](README.md)

Runtime mix in `game/engine.ts` is authoritative. `scripts/celestial-audio-map.json` identifies source assets; use the runtime gains below. Attack mix is 0.765. Game-over uses four descending sawtooth tones with peak gain 0.32 per tone. Current celestial gains before that mix: Solar .75 + swoosh .8; Lunar 1.1; Jupiter plasma .8 + laser shot .75 + Queen attack .55; Singularity .8 loop; Saturn .85; Venus .8 (`celestial/venus-veil.wav`); Binary Star .8 (`celestial/binary-star.mp3`, the user-supplied `binary_star.mp3`) + `celestial/gaia-reach.mp3` .45; Neptune .9 + electric .6; Sirius 1.3 + full-energy cue; Gaia construction .45 + occupied-field click .4 loop.

Source layers: Jupiter/Solar plasma `mixkit-sci-fi-plasma-gun-power-up-1679`, Solar swoosh `mixkit-long-sweeping-air-swoosh-167`, Gaia cast `mixkit-sci-fi-construction-complete-811`, Gaia occupancy `mixkit-sci-fi-click-900`, Jupiter shot `mixkit-laser-weapon-shot-1681`, Neptune layer `mixkit-screechy-electified-item-3213`, Venus the user-supplied `mixkit-sci-fi-positive-item-grab-3173`. Jupiter also uses `bossQueenAttack1.mp3`. Runtime files use renamed copies under `public/sounds/celestial`.

Singularity sound repeats until field expiry; use its gapless 1.046s loop with short edge fades. Gaia occupancy sound repeats only while at least one living enemy occupies its field. Loops stop on pause/hidden page, expiry, game over, restart and unmount. Audio should not continue through paused gameplay. Supernova detonation layers the bomb impact at volume 1 (ordinary bombs use about .636), `meteorExplode.mp3` at volume .85, and a 65Hz sawtooth tail at gain .3. Local sound preview: `/ruby-star-sound-preview.html`.


## Saturn challenge

Saturn blizzard damage uses the supplied `public/sounds/blizzard-damage.mp3` at .65 through the effects mix. It replaces the ordinary player/Ruby hit cue only when a storm pulse causes actual HP loss. Shield-only damage and fully prevented hits are silent; a pulse hurting both characters plays once. Ordinary attacks, icicle impacts and other hazards keep their existing sounds. Ice Cub uses a frost-break impact cue for its physical shove; Mage casting has no laser effect. Player Snowball recharge completion uses Jupiter's existing `fenceReady` map-skill cue once; debug Snowball Ready uses that same cue when it clears a running cooldown. Snowbowls reuse the player's complete wind-up, pitched release, player-contact and wall-contact recording sequence.

Beginning a successful Snowball hold reuses the exact bomb-placement sound and gain (`place_bomb.wav`, .1625 × attack mix), once per charge. Release reuses `alienShootLaser.wav` at three times its ordinary shot gain (.6 × attack mix) and playback rate 1.3 with pitch preservation disabled. Snowball contact with an ordinary enemy plays the supplied `snowball-hit.mp3` at .7 through the attack preference, once per target per roll. Warden hits use gain 1 and playback rate 1.25 with pitch preservation disabled, whether shielded or exposed; wall stops use the same impact cue, while reaching open range is silent. The Warden's shield shots reuse `ice.mp3`; barrier hits and icicle landings reuse the existing frost-break recording. A complete barrier break additionally layers the user-supplied `dragon-studio-glass-breaking-504033.mp3`, stored as `saturn-barrier-break.mp3`, at gain .85 once with the screen-wide shatter. Partial hits and exposed-boss hits do not play this layer.

## Menu sounds

`ui-sfx.ts` supplies menu/readiness cues, mostly synthesized with Web Audio at ×5 boost and a .6 peak cap, with recorded cues where specified. Lobby: hover/focus tick on cards and arrows, distinct select cues for Endless Space (warp-in sweep) and Ascension (three-note ascent with shimmer), a low denied buzz on the locked card, and page/back slides when rotating. Rule sheet: page slide when the HUD RULES button opens it and to Aliens & Bosses, back slide to Main Rules, power-down chirp on ✕ and a two-tone acknowledge on UNDERSTOOD (other arcade games keep the shared click). EXIT uses the back slide. Teleport: a rising warble when X/TP opens the menu, hover ticks on available chambers and the power-down chirp when cancelled; arrival keeps its existing cue. Tutorial: the acknowledge cue when a step is cleared and the Ascension cue on completion. Room strike ready (Neptune's Trident or Gaia's Sunfire reaching full): a bright rising chime with a shimmer (`charged`) layered with `strike-charged.wav` (a 2.7s sci-fi "item acquired" cue, gain .55; played from `engine.ts`). Challenge victory: a fanfare (rising C–E–G arpeggio into a held major chord with a high shimmer). In-game ready cues from the same synth: the bomb ready again after its cooldown (the supplied power-up recording), the Moon Mark recharged (a prominent icy chime) and the Moon Mark locking on when cast (a falling ping and two quick beeps). Both Moon Mark cues use triple their original voice gains, retaining the shared .6 peak cap.

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

## Pylon overload

Pylons reuse meteor-warning pulses once per second during their three-second overload warning, with the urgent pulse in the final second. The chamber blast plays the user-supplied `pylon-explode.mp3`, stored as `public/sounds/pylon-explode.mp3`, once at .9 before the shared .765 attack mix (.6885 final), replacing the bomb explosion cue. Overload warnings pause in menus and during Eclipse along with their timers.

## Aegis attack

Aegis uses the user-supplied `Aegis-attack.mp3`, stored as `public/sounds/aegis-attack.mp3`. It plays once when its existing strike connects with the player, Ruby or a Lunar Echo, in both shielded and exposed states. Gain is .8 before the shared .765 attack mix (.612 final); it replaces the generic alien shooting cue for Aegis.

## Shield and pylon breaks

User-supplied assets under `public/sounds/`: `frost-shield-break.mp3` plays once when damage depletes an enemy's Frost Warden ice-shield pool (.7 before the attack mix); `pylon-break.wav` replaces the generic alien death cue when a pylon is destroyed (.85); `aegis-shield-break.wav` plays once when the last living pylon is destroyed and Aegis's barrier actually breaks (gain 3 before the .765 mix, or 2.295 final). A Web Audio gain node boosts this cue beyond the HTML volume limit, roughly 3.3 times its earlier level; nodes disconnect when playback ends or fails. The final pylon plays its own break and the barrier break together. Partial damage, pylon overload/relocation and debug cleanup do not play these break cues.

## Aegis shield return

During the last 3 seconds of exposure, a synthesized two-note triangle chime plays at 3, 2 and 1 seconds (660→990 Hz, then 990→1480 Hz on the final second). It is deliberately softer and rounder than the square meteor/pylon beep.

## Twin attacks, sharing and revival

Dawn's melee hits use `public/sounds/celestial/jupiter-storm.wav` at gain 1.3 before the .765 mix (.9945 final). The user-supplied `dawn_attack.mp3` remains stored as `public/sounds/dawn-attack.mp3` for future use. Dusk's user-supplied `dusk_attack.mp3` is stored as `public/sounds/dusk-attack.mp3` and plays once when its tracking charge fires at .8 before the mix (.612 final), layered with `celestial/neptune-electric.wav` at a Dusk-only multiplier of 3.5 on the normal .6 gain (1.6065 final after the .765 mix), using Web Audio amplification. Neptune's own skill keeps its normal electric-layer gain. `public/sounds/twin-revive.mp3` plays once when a fallen twin actually returns, at .85 before the mix (.65025 final). Downing a twin, paused ticks and final encounter completion do not play revival audio.

Each actual HP transfer plays `celestial/skill-ready.wav` once at the normal ready-cue gain (.5 before the .765 mix, .3825 final). Failed transfer attempts, full recipients, pauses and downed partners do not trigger it.

## Thorn Weaver field

The aimed field plays `falling-thing.wav` (0.75s, gain .6) starting 45 ticks before it erupts, so it lands with the falling seed; then the thorns erupt with `place-plant.mp3` (.4 gain). It never uses the player's `charging.wav`. Seed pods bursting in the Gaia challenge reuse `place-plant.mp3` at .5.

## Neptune Trident

1.6s before the Trident lands, `meteorFalling.mp3` plays at rate 1.6 with pitch raised (`preservesPitch = false`, gain .5) so its fall ends on the strike; Neptune's electric cue (`celestial/neptune-electric.wav`) adds a crackle 0.5s before impact. The strike itself uses the meteor impact sound.

## Gaia Sunfire

The blast layers the Solar Flare cue (`celestial/solar-flare.wav`, ×1–1.6 with charge) with `sci-fi-explosion-09.mp3` (gain .45–.95 with charge). A full chamber burn plays both at their strongest plus `bombExplode.wav` (.9), with a heavier screen shake.

## Moon reveal

When the Moon Queen's disguise breaks before a jump, the Lunar Echo cue (`celestial/lunar-echo.wav`, gain .99) plays from 0.1s in (skipping its silent start) at rate 1.6 with pitch raised (`preservesPitch = false`), so it lands with the reveal, over `frost-shield-break.mp3` at .4; both before the .765 attack mix.

## Sun cooling

Normal Cooling Wave and cooling-station completion reuse Neptune’s Tide at its existing gain. Reaching zero temperature plays a dedicated pressure-collapse cue once: a 140→36 Hz triangle (.12 voice gain), 56→28 Hz sine (.08), 1568→196 Hz triangle (.045), then a two-note icy rise. It layers `sci-fi-explosion-09.mp3` at .9, `frost-shield-break.mp3` at .8 and Neptune’s Tide at ×1.2. Repeated cooling while already extinguished does not replay the transition. Empowered waves play Tide at ×1.25, the Neptune electric layer at ×.9 and a dedicated synthesized pressure impact: 140→42 Hz triangle (.085 voice gain), 64→38 Hz sine (.06), 1100→150 Hz triangle (.035) and 1760→660 Hz sine (.025), all using the standard UI gain/cap. Each successful empowered cast plays once, including the finishing blow. Thermal eruption reuses the Solar swoosh.

Holding Space while actually charging a station plays a coolant-pump pulse immediately and every 20 gameplay ticks (about .33s): a 420→620 Hz triangle (.075 voice gain, .09s) and 1240→980 Hz sine (.054, .12s), using the standard UI gain/cap. These voices are three times the original station pulse gains. Each pulse layers Ruby’s manual-heal sound, `/sounds/deghost.wav`, quietly at volume .08 (manual healing uses .32), and restarts the same 18-tick player jiggle. Scheduling stops on release, leaving range, King blocking, completion/relocation or pause. No persistent Sun audio loop is added.

Sunburst marking plays a map-wide three-pulse rising alarm (`sunburstWarning`): each pulse layers a 440→660 Hz square (.085 voice gain, .18s) with a 220→330 Hz triangle (.055, .21s), spaced .26s apart and using the standard ×5 UI gain/.6 voice cap. It layers the King's fire spell at .7. The cue plays once when a room is marked, regardless of the player's chamber or camera; it does not repeat each countdown tick or start while gameplay is paused.

## Jupiter and critical heat

Jupiter uses short global synth cues: a falling discharge followed by a rising exposure chime, the supplied Reaper dash recording, and the supplied fence-hit recording for a triggered fence. The Reaper's existing slash mix remains. C readiness plays `celestial/skill-ready.wav` at .3825, matching the normal ready-cue mix, instead of the synthesized electric chime. It sounds once when cooldown reaches zero, including a God-panel refresh of an active cooldown. No persistent audio loop is added; simulation owns all scheduling and menus pause it.

Sun heat at 90+ schedules `sunHeatWarning`: two 330→220 Hz square pulses, .18s each, separated by .23s, at .09 voice gain through the standard ×5 boost/.6 cap. It plays globally on entering danger, then every 60 gameplay ticks (30 at heat 97+). Cooling below 90 resets the schedule; extinguishing stops it. This two-beat low alarm differs from the three-pulse rising Sunburst warning.

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

Jupiter pursuit Overdrive plays the supplied `/sounds/aegis-attack.mp3` at .8 before the shared attack mix once when the bar reaches full from phase 2. Bomb readiness plays the supplied `powerUp.wav`, bundled as `/sounds/bomb-ready.wav`, once at base gain .85 through Other Game SFX; it replaces the synthesized cue.

Celestial blessing selection plays the supplied `/sounds/gem_passive_trigger.wav` at .75 base gain when the overlay appears, replacing both the former synthesized gem chime and the constellation-chosen recording for blessings. Ordinary constellation selection is unchanged.

Amethyst decoy placement uses the normal gem passive cue. Decoy firing uses the same `/sounds/gem_passive_2.wav` at 1.4× playback rate with pitch preservation disabled and .6 base gain. All decoys share a 30-tick firing-cue gate and a shot on the placement tick adds no second cue. This follows Other Game SFX volume; the player’s bullet sound is unchanged.

Gem mechanics use the supplied `/sounds/gem_passive_2.wav` at .85 base gain: Ruby on entering its active buff, Emerald only on crossing into ten live stacks, Amethyst on actual decoy placement, Diamond on actual shield gain, Amber on actual energy gains and full-energy refresh, Pearl on reflection, Opal on a coordinated copy, Obsidian on creating a well, and Stardust on an actual shield grant. Sapphire plays the cue only when its leech actually restores player HP, with a 60-tick (one-second) sound cooldown. Other repeated events are limited to once per gem per 30 gameplay ticks; simultaneous gem procs share one cue. Peridot creates and refreshes walking fields silently. Peridot and Obsidian play `/sounds/gem_field_hit.wav` at .35 on damaging pulses, shared across overlapping fields and enemies with a 30-tick gate. All three recordings follow Other Game SFX volume; only the Amethyst firing variant is pitched up.

Comets play the meteor warning pulse once when an area is marked, `falling-thing.wav` (0.75s) at .6 × attack mix as the comet starts its final 45-tick fall, and the bomb explosion at impact. A Lancer starting its charge plays `charging.wav` pitched to 0.6× (about 1s, the windup length), only within 16 tiles of the player; its beam reuses the laser sound. A Charger within 16 tiles plays the bomb-placement cue when it locks its lane and the alien shot at rate 1.3 when the rush starts. The Eridanus echo wave plays the same Wave sound at the same volume as the player's Wave when it lands.

Soul Devourer bites layer `soundWaveAttack.mp3` at .49 and `slash.mp3` at .35 × attack mix; its eating sound is unchanged.

A heavy bullet shot (every 20th) layers `laserBullet.mp3` at .9 × attack mix and 0.7 rate with `bomb-ready.wav` at .35 and 1.3 rate over the normal shot sound; its hit adds `hitHurt.wav` at .45 and 0.8 rate. A killed Impostor plays the decoy-break sound (`decoyDeath.mp3`).

Non-boss alien attack sounds are levelled to about -21 dB (loudest 50ms RMS after gain) so no attack stands out; gains live in `ALIEN_ATTACK_SFX` (engine.ts). Boss attacks keep their own louder levels. When adding an alien attack sound, measure it and set its gain to land near -21 dB.

| Attack | Sound | Gain |
| --- | --- | --- |
| Melee hit (all melee aliens), Charger rush start, Shooter fire | `alienShootLaser.wav` (rush 1.3 rate, Shooter 0.8 rate) | .285 |
| Sniper shot, Lancer beam | `laserBeam.mp3` | .266 |
| Lancer charge | `charging.wav` at 0.6 rate | .556 |
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
| Kill buffs | Enchanter `powerUpBoost.mp3` .4 at 0.85 rate; Bleeder `seaHeal.mp3` .4 at 1.1 rate; Snatcher `shield.mp3` .5. The Shooter buff is silent |
