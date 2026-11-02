# Skills and upgrades

[Overview](README.md)

## Constellations

After every third actual boss defeat (3, 6, 9, 12, 15, ...), wait one second of unpaused play for defeat effects, then pause and offer three distinct random unowned Constellations. Each can be chosen only once per run; there are no ranks or repeat picks. Choices continue after Ascension. When fewer than three remain, offer the remaining choices; after all 40 are owned, stop offering Constellations. Restart clears owned upgrades and pending choices. The God-panel Constellations button opens a paused editor with all 40 upgrades as independent toggles; click an active card to remove its effect, then use Done, Escape or a backdrop click to resume. This does not advance stages or consume milestone rewards.

Click, tap, keys 1/2/3, or focused-button Enter/Space selects. Keyboard focus stays in the dialog. `gamePhase='constellation'` freezes simulation and rejects gameplay actions. Boss restoration, hazard cleanup and celestial rewards still resolve, including meteor/special defeats. Choosing clears held mouse/touch movement and attack input. The chosen star pattern briefly appears as a faint, non-interactive afterglow for 96 gameplay ticks (1.6s) while play continues; it pauses with gameplay and clears on restart. The HUD lists owned constellations, with descriptions available on hover.

| Constellation / internal key | Effect |
| --- | --- |
| Dorado / `chargeField` | During an active Wave charge (after 200 ms), refresh a field beneath the player; it lingers 1.5s after charging stops |
| Serpens / `deathField` | Alien defeats leave the same field for 4s; objectives, downed twins and unfinished Devourer families do not count |
| Vulpecula / `bombStun` | A bomb that damages HP stuns surviving regular aliens for 1.2s, bosses for 1s; shield-only hits do not stun |
| Circinus / `bulletShield` | Eight direct bullet hits grant 4 player shield, capped at 12, with a 3s grant cooldown; preserves larger existing shields and does not shield Ruby |
| Ophiuchus / `healing` | Manual healing recharges 50% faster: 12-tick cooldown rather than 18 |
| Lyra / `laser` | Normal/powered laser damage ×1.2 |
| Pegasus / `speed` | Movement ×1.08, including carrying and speed burst; forced knockback unchanged |
| Aquarius / `energy` | Ordinary kill and blue-shard energy ×1.2, including Runner bonus; Leech stored-energy refunds are not multiplied |
| Perseus / `bomb` | Normal/powered bomb radius +1 tile, including visible range and self-damage reach |
| Orion / `bullets` | Normal/powered bullet damage ×1.25 |
| Draco / `wave` | Normal/powered wave damage ×1.25 |
| Cassiopeia / `ruby` | Incoming Ruby damage ×0.85 before its shield, including meteors |
| Phoenix / `power` | Powered duration +60 ticks, including Sirius Surge; firing during active power does not extend it |
| Aquila / `laserRate` | Laser cooldown ×0.85 |
| Cygnus / `waveReach` | Normal/powered wave radius +1 tile and push +1 tile; visible wave matches actual reach |
| Scorpius / `bombDamage` | Normal/powered bomb damage ×1.2, including its self-damage calculation |
| Taurus / `burstDuration` | Manual/powered/free speed-burst duration ×1.25 |
| Vela / `burstRate` | Manual speed-burst cooldown ×0.8 |
| Centaurus / `waveRate` | Wave cooldown ×0.85; hold-to-charge time unchanged |
| Delphinus / `playerGuard` | Incoming player damage ×0.85 before shields, including meteors, poison and bomb self-damage; Ruby unchanged |
| Libra / `manualHealing` | Manual healing adds +1 Ruby HP and +1 player HP per use |
| Hercules / `killHealing` | Ordinary kill healing adds +2 player HP; meteor defeats give none |
| Cepheus / `bombRate` | Bomb cooldown ×0.8 |
| Crux / `laserRange` | Normal/powered laser range +2 tiles; bullets unchanged |

| Sculptor / `wallSlam` | A direct Wave's knockback deals one extra 50% of that Wave's damage if a normal alien hits cover. No bonus on bosses or echoes; cover stays intact |
| Columba / `rubyDefense` | Successfully restoring Ruby HP through manual healing stores one defensive Wave. When an enemy comes within 3 tiles of placed Ruby, it fires at 60% normal Wave radius and 50% normal Wave damage, with one tile of normal-alien push. Draco scales its damage; no echoes or on-cast procs. Stored charge travels with Ruby but cannot trigger while carried |
| Reticulum / `laserWire` | Each Laser segment leaves a 5-second tripwire, armed after its 18-tick beam fades. Its first crossing enemy takes 75% of that segment’s damage and stops for 30 ticks (15 for bosses). Existing occupants must leave before retriggering. Wires from the two most recent accepted Laser casts can coexist; a third cast removes the oldest set without refreshing surviving lifetimes. Reflections and companion segments share their original cast slot; companion and reflected wires retain their reduced damage |
| Pyxis / `teleportDecoy` | Completed teleports leave one fragile decoy at the origin for up to 6 seconds. It draws ordinary aliens within 10 tiles and breaks on one connected hit. Bosses retain their usual targeting. The independent Lunar Echo remains intact; another teleport replaces the fragile decoy |
| Caelum / `wallStep` | Each manual Speed Boost allows one immediate crossing of a single interior cover cell with open floor beyond, ending the boost. Cannot cross chamber boundaries, sealed hallways or thick walls. Cover remains intact and landing hazards still apply |
| Ara / `bulletBurst` | A connected bullet hit, including a lethal hit, triggers a 1.5-tile explosion dealing 100% of that bullet’s damage to nearby enemies. Shared 1.5-second cooldown across all bullets/copies; no recursive on-hit effects |
| Andromeda / `waveLaser` | A fully charged Wave empowers the next successful Laser cast. Beams widen to 72px (96 powered), with matching body-overlap hit detection, and each ray can cross one interior wall tile. Damage and range remain unchanged; walls remain intact. This stores one charge; partial charges, delayed echoes and Ruby echoes do not arm it. Companion laser copies inherit the empowered cast. |
| Lepus / `twinShot` | Two auto-aimed bullets, each 60% damage. They pick distinct nearest eligible enemies when at least two are in range; otherwise both target the single enemy. Each shot skips the other assigned target so aligned enemies still split the volley. Maximum combined damage remains 120% of one ordinary bullet. Orion and Twin copies scale normally |
| Sagitta / `ricochet` | Each laser ray reflects once from floor-adjacent cover, returning at a small random angle (up to 7.5 degrees) with 50% damage and its remaining range plus two bonus tiles. Moon mirrors keep their hostile reflection rule |
| Eridanus / `waveEcho` | One second wave at the original cast position after 24 ticks, 40% original wave damage and the same radius; no push or recursive echoes |
| Fornax / `bombPull` | Detonation waits 24 ticks and pulls normal aliens one floor tile toward the bomb every 6 ticks within explosion radius +2 tiles. No boss pull, cover crossing or repeated detonation input |
| Lacerta / `boostTrail` | While Speed Boost is active, mark each floor cell crossed. Revisiting refreshes its 90-tick lifetime. Enemies occupying a marked cell slow to 65%; the trail deals no damage |
| Corona / `rubyWave` | Placed Ruby emits a wave at 60% radius and 35% damage when you cast. No push, extra power consumption or recursive echoes |
| Lupus / `bulletMark` | Three bullet hits mark a target for 6 seconds. A direct Charge Wave consumes the mark for a 1.6-tile explosion dealing 50% wave damage. Explosions cannot mark or trigger other marks |
| Puppis / `boostCharge` | Manual Speed Boost makes the next wave hold 35% faster (650 ms normal, 975 ms chilled); charge presses add two instead of one. Consumed on wave cast |
| Pictor / `rubyLaser` | Casting within 3 tiles of placed Ruby fires a four-direction laser copy from Ruby for 35% damage. Same range and one-bounce rules; no recursive Ruby copies |

Healing safety checks, HP/energy caps and bomb Ruby immunity remain. Upgrades affecting different aspects of the same ability combine. No upgrade changes celestial skill damage. Existing fields and placed bombs retain their rules; Perseus updates the shared bomb radius calculation for both gameplay and the indicator.

New regular aliens and Splitter children gain +5% HP per third-boss milestone, reaching +30% at defeat 18; after that the late-run factor adds +2% per defeat without a cap (see Difficulty). The factor multiplies existing tier/global HP scaling and does not retroactively rescale existing enemies. Bosses retain their existing +15 HP per prior defeat, without an extra Constellation multiplier; Queen echoes are unchanged. See [Difficulty](GAMEPLAY.md#difficulty-progression).

Dorado and Serpens share floor-bound fields. Dorado covers floor cells within a 2.25-tile centre radius (about five tiles across); Serpens covers the centre and four adjacent tiles. Fields deal 2 damage/second in half-second pulses and slow ordinary aliens by 20%, bosses by 10%. Overlapping shared fields never stack damage or slow; stronger existing slows stay stronger. Refreshing a tile reuses its field; at most eight remain, replacing the oldest. Fields pause with gameplay. [Field stages](visual-reference/constellation-fields.png).

## Celestial blessings (Endless)

At stages 20, 30, 40 and every ten thereafter, choose one gemstone from all remaining unowned blessings. There are ten, one for each boss; each is chosen once per run. They are separate from constellations and one-use F skills. If both milestones coincide, resolve the constellation first, then the blessing. Rewards queue when multiple encounters end together. Selection pauses gameplay and uses the existing square neon cards, boss-colored cut gemstones, keyboard 1–9/0 and focus trap. Owned blessings appear in the HUD with hover descriptions. Restart clears them; when all ten are owned, offers stop. Challenge and Tutorial modes do not award them.

| Blessing / boss | Effect |
| --- | --- |
| Amber · Sirius / Blind Prayer | Earn 35% more energy and gain +1s powered duration, additive with Phoenix and the Shooting Star bonus (also +1s to Sirius Surge); unpowered Laser, bullet, Wave and bomb attacks gain a blue outer tint with a yellow inner core. Opal copies and powered attacks keep their own colors. A transition from below full to full refreshes Laser, bullet, Wave, Speed Boost, bomb and manual-heal cooldowns once. It never creates or refreshes a held F skill. Returned Leech energy is not multiplied |
| Diamond · Saturn / Frost Warden | Actual player/Ruby healing adds 4 player shield; an incoming player hit grants 30% of its damage as shield after resolving, minimum 2 and maximum 12. The amount uses damage after reductions but before shield absorption. Shared 1s cooldown, 60 shield cap, larger existing shields preserved; healing at full HP gives none |
| Ruby · Sun / Fiery King | After 3s without incoming player damage, move 15% faster and deal 30% more player/special attack damage. A hit, including shield absorption, resets the timer. Attack colors turn red; reflection damage is not amplified |
| Emerald · Jupiter / Storm Reaper | Each accepted attack adds 4% movement speed for 3s, up to ten independently expiring stacks (40%). Hits stack 5% ordinary / 2.5% boss slow, capped at 50% ordinary / 25% boss, refreshing a 3s duration |
| Amethyst · Moon / Splitter Queen | Every successful manual, bomb-triggered, pickup/power or teleport speed burst leaves a shooting decoy. Teleports leave it at departure. Up to three survive, each with 18 HP and no passive expiry; a fourth replaces the oldest. Ordinary aliens within six tiles take the bait; bosses keep normal targets. Each decoy fires a purple bullet every 0.375s on average (alternating 22/23 ticks) for 0.275 × capped skill alien scaling damage, within eight tiles. Decoy shots cannot trigger player on-hit upgrades, healing or haste |
| Obsidian · Singularity / Devourer | Each non-meteor defeat has a 50% chance to leave a four-tile-radius gravity well for 4s, capped at four. Ten direct HP-damaging hits on the same boss within a rolling 3s window also create a well at its position, with a shared 6s cooldown. Switching targets resets progress; hits during cooldown are not banked. Fields, reflections and companion copies do not count. Wells pull ordinary aliens one floor-safe tile every 0.5s, deal 6 damage/sec to ordinary enemies or 0.3% max HP/sec to bosses, and slow them by 25%/15%. Overlap does not stack damage, slow or pull; bosses cannot be pulled |
| Opal · Binary Star / Astral Twins | Each original Laser, bullet volley, Wave or bomb detonation has a 45% chance for Ruby to copy it at 100% damage. Copies originate at placed Ruby, or the player while carrying it. They cannot roll another copy or add another healing or on-cast haste grant. Bomb copies do not hurt the player. Expected damage is +45% when the copied attack connects |
| Sapphire · Neptune / Sea Chanter | Direct attacks heal only when they damage enemy HP: Laser 1.5 HP, bullet 0.5, Wave 3, bomb 4, damaging celestial strike 4; capped at 4 HP per second across all hits. Direct attacks damaging enemy HP also weaken that enemy for 3s: its identified attacks deal 10% less damage to player and Ruby. Further hits refresh, never stack; passive fields and secondary attacks do not weaken. Misses, shield-only hits, scenery, passive fields, reflections and companion copies do not heal. Ruby is unchanged |
| Peridot · Gaia / Thorn Weaver | Walking onto a new floor tile leaves a three-by-three floor field for 4s. Fields deal 5 damage/second and slow ordinary aliens by 30%, bosses by 15%. At most twelve fields; overlapping fields do not stack. Standing still creates none; teleport paints only the landing tile |
| Pearl · Venus / Aegis Sentinel | Reduce all incoming player damage by 20%, multiplicatively with other defenses and before shield absorption. Reflect direct player hits to the identified attacker using damage before the Pearl reduction (other existing reductions still apply), including shield absorption. Boss return damage is capped at 3% maximum HP per hit. Ownerless hazards do not reflect. Venus Veil uses its existing reflection instead of duplicating it; reflection cannot bounce back recursively. Development Invincible preserves Pearl reflection for testing without damaging the player or resetting Ruby’s unharmed timer |

Blessing caps apply across copies and multiple targets. Timers advance only during play; reset clears run effects and saved runs preserve them. Removing a blessing in the God editor removes its continuing generation effects. Existing emitted attacks finish normally. A selection shows a centered 1.2-second gemstone reveal with chunky pixel stars, square sparks and a reward chime. It updates every animation frame, fades quickly and never intercepts input. See [Balance](BALANCE.md) for comparison targets and activation tradeoffs.

## Ascension and celestial skills

The **tenth boss defeat** unlocks Ascension and grants that defeated boss's skill. Every subsequent encounter grants its mapped skill. Aegis Sentinel grants Venus Veil; Astral Twins grants Binary Star, awarded once after defeating the pair. Hold one single-use skill; the next reward replaces it. F activates it. After a cast, F is ignored for 1.5s (`SPECIAL_RECAST_LOCK`; not in challenges, whose skill has its own cooldown), so a skill granted by that cast's boss kill is not fired by a repeated press. Consume the old skill before resolving its kills, so a boss killed by that skill can immediately grant a replacement. A held skill changes the suit; carrying Ruby takes model priority without deleting the skill. Celestial colors and shapes follow the player planet/star theme; see [Visual style](VISUALS.md).

| Boss reward | Skill | Effect |
| --- | --- | --- |
| King | Solar Flare | Entire arena: 10% boss max HP. Regular aliens take 25 × the alien skill scale (current tier HP multiplier × late-run alien HP factor up to Stage 18, `skillAlienScale`) so it has the same effect from the start to Stage 18 (it always just kills an unshielded Armored): 25 at the start, 57.5 at Stage 10, 65 from Stage 18. Regular Solar kills grant no energy, including Runner bonuses and Leech refunds; ordinary non-energy rewards remain. Boss kills still restore player/Ruby HP and energy fully |
| Queen | Lunar Echo | Stationary decoy with 12 connected hits; 21-tick invulnerability after each hit; no time limit |
| Reaper | Jupiter Storm | Within 6 tiles: 25% boss max HP; regular aliens take 60 × the alien skill scale (60 at the start, 156 from Stage 18). Enemies hit move at 50% speed for 60 ticks (1 second); recasts refresh the duration |
| Devourer | Singularity | One fixed version: 5-tile-radius field for 18s. Normal pull one tile/15 ticks; boss pull one tile/30 ticks, walls respected. Enemies inside cannot teleport; overdue Queen/Warden relocation waits until they leave or the field expires, without spawning echoes or granting jump healing while blocked. Damage once per second: 6 × the alien skill scale to regular aliens (grows with the stage like their HP, up to Stage 18), 1.5% max HP to bosses |
| Warden | Saturn Guard | Player and Ruby absorb shields refilled to at least 40 + 1 per stage each (58 from Stage 18), with celestial appearance until depleted; not stacking outside the [Saturn challenge](SATURN.md), where it adds to both pools |
| Prayer | Sirius Surge | At least 6s powered mode, clears star gauge, free speed burst, resets laser/bullet/wave/bomb/speed cooldowns. Existing placed bomb remains |
| Chanter | Neptune's Tide | Heals player/Ruby 40 + 1 per stage each (58 from Stage 18), matching Saturn Guard; pushes enemies within 8 tiles 3 tiles away |
| Aegis | Venus Veil | For 10s, damage to player and placed Ruby is cut to 35% (after Delphinus/Cassiopeia, before shields). Direct enemy attacks also return their full pre-reduction damage to the attacker; bosses take at most 3% max HP per reflected hit. Meteors, explosions, poison, Thorn fields, Supernova, pylon overloads and the player's own bomb are reduced but not reflected. Reflection still happens under Invincible, but not when Lunar Echo takes the hit |
| Twins | Binary Star | For 15s, an untargetable mirror twin stands on the first open tile beside placed Ruby (beside the player while carrying). Every laser, bullet and wave also fires from the twin, and each bomb detonation adds a twin blast there, all at 60% damage. Twin attacks use the same powered state, push, Supernova triggers and kill rewards; the twin blast never hurts the player |
| Weaver | Gaia's Roots | Stationary tile-aligned 12×12 field for 30s, floor only; enemies move 40% slower, take 4 × the alien skill scale damage/sec (grows with the stage like alien HP, up to Stage 18) or 1% boss max HP/sec |

Skill damage respects shields and enemy vulnerabilities, but does not feed diving Chanter. Persistent fields pulse once per second and expire before a pulse on the exact expiry tick; listed DPS×duration is not necessarily the exact total. For example, max Singularity lasts 24s but delivers 23 whole pulses: 46% boss max HP before shields/vulnerability if continuously inside. Gaia also excludes the exact-expiry pulse. Recasts replace the existing field/decoy of that type.

Values in the celestial table are before applicable Constellation modifiers. All stage-based skill scaling stops at Stage 18 (`SKILL_SCALE_STAGE_CAP`), even though aliens keep growing after that.

The God-panel Blessings button sits beside Constellations with matching styling. It opens all ten gemstone cards as independent toggles. Clicking an owned blessing removes it; Done, Escape or a backdrop click resumes play. This editor pauses simulation and preserves milestone picks and stage progress. Existing temporary shields or cast effects finish their normal lifetime when their blessing is removed.

On Windows, only gemstones earned by clearing their respective supported world appear as normal blessing choices. Before any world is cleared, Stardust substitutes: 2 shield for player and Ruby every 30 seconds, capped at 4 each; it lasts for that run and never permanently unlocks a gem. The ten-gem debug editor remains independent. Web blessing eligibility is unchanged.
