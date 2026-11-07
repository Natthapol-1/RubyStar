# Build balance

[Overview](README.md) · [Exact skill rules](SKILLS.md)

Constellations are one-time run choices. Their comparison target is about 15–25% improvement to the relevant tactic, or a similar defensive/control opportunity. This is an affected-tactic budget, not a claim that every pick increases whole-run DPS by that amount. A passive numerical bonus is reliable; positioning, delayed damage, cover contacts, two-attack setups and dangerous close-range play can justify a larger peak.

Celestial blessings target roughly two constellation choices in overall value. Healing, shielding, movement and crowd control are assessed alongside damage rather than converted into a misleading single DPS percentage. No blessing should grant unlimited stacking, recursive attacks, repeated full-bar refreshes or overlapping field damage. Combined builds retain independent caps.

## Constellation comparison

| Constellation | Value and tradeoff |
| --- | --- |
| Lyra | +25% Laser damage, automatic, matching Orion and Draco; a reliable weapon baseline |
| Aquila | 15% shorter Laser cooldown ≈17.6% more casts if the player keeps firing |
| Orion | +25% bullet damage, automatic |
| Lepus | +20% total volley damage; distributes fire to two targets, with a smaller hit on each |
| Draco | +25% Wave damage, automatic |
| Centaurus | Shorter Wave cooldown; benefits damage, push and readiness, but the one-second charge still costs time |
| Eridanus | +40% Wave damage on whatever is around you 2s after the cast; no extra push |
| Scorpius | +25% bomb damage, matching the other damage constellations; also raises self-blast damage |
| Cepheus | 20% shorter bomb cooldown =25% more potential detonations; requires more placements and escapes |
| Perseus | +1 bomb-radius tile; more coverage with a larger self-danger area |
| Cygnus | +1 Wave reach/push tile; more control/coverage rather than free single-target damage |
| Crux | +2 Laser reach tiles; positioning and distant/multiple targets determine its value |
| Aquarius | +20% earned energy; benefits every powered ability but requires pickups/kills |
| Phoenix | +1s powered duration; stronger burst window, limited by energy and ability cooldowns |
| Pegasus | +8% movement, always available, including carrying Ruby; reliability compensates for the smaller number |
| Taurus | +25% burst duration; improves sustained escape uptime and all free boosts |
| Vela | 20% shorter manual boost cooldown; similar average movement value to Taurus, with more activations |
| Ophiuchus | +50% manual-heal throughput; enemy-clear and proximity requirements remain |
| Libra | +1 player/Ruby HP per manual heal, a 25% combined heal gain (base 3+5 →4+6); requires safe healing |
| Hercules | +2 HP per ordinary defeat; combat sustain that requires kills and is wasted at full HP |
| Delphinus | 15% less player damage ≈17.6% more effective HP/shield capacity; automatic protection |
| Cassiopeia | The same effective-capacity gain for Ruby instead of the player |
| Sculptor | +75% Wave damage when an ordinary alien is actually pushed into cover; bosses and failed contacts give none |
| Monoceros | Heavy shot every 8th instead of 20th: about +12.5% average bullet damage (half of Orion) plus 2.5× as many one-tile pushes; a crowd-control pick that stacks with Orion |
| Hydra | +7.5% per enemy hit by the previous Laser, capped at +37.5%: weaker than Lyra's flat +25% on one or two targets, about equal at three to four, stronger in crowds; resets on a miss |
| Crater | Up to 20 HP each for you and Ruby per meteor (about every 30s) if you go back into the freshly cleared room; comparable to Hercules' kill healing, but rewards moving into the blast zone afterwards |
| Triangulum | Pure setup: bunches Laser-hit aliens by one tile so the next Wave, bomb, Peridot field or Hydra-boosted Laser catches more of them; no value against single targets or bosses |
| Sagitta | A 50%-damage Laser return; gains two extra return tiles but needs cover geometry and a connecting reflected ray |
| Reticulum | Crowd control only, no damage: a 0.4s stop per alien at most every 2s (about 20% downtime on a target you keep lasering); bosses immune |
| Andromeda | Wider, wall-piercing Laser after a completed Wave; rewards a two-action setup, without direct damage inflation |
| Ara | A one-bullet-damage splash at most every 1.5s; weaker against one target than Orion, stronger against a packed group |
| Lupus | A 50%-Wave splash after three bullet hits; requires setup on a surviving target and then a connecting Wave |
| Corona | Ruby's smaller 35%-damage Wave; requires Ruby placed and useful targets near it |
| Pictor | Ruby's 35%-damage Laser copy; player must remain near placed Ruby and line targets up |
| Columba | A stored 50%-damage defensive Wave; safe healing, Ruby placement and an approaching enemy are required |
| Pyxis | A six-second, one-hit departure decoy after teleport; ordinary aliens within ten tiles take the bait |
| Caelum | One safe crossing of single-cell cover per manual boost; ends the boost and cannot bypass thick/boundary walls |
| Fornax | Groups ordinary aliens before a bomb, improving hit count at the cost of a short detonation delay |
| Lacerta | A narrow, short-lived slow trail; rewards escape routes and enemy pursuit rather than standing still |
| Puppis | Faster Wave setup after manual boost; rewards alternating mobility and charging |
| Dorado | A larger 2-DPS slow field during charging and for 3s afterward; stationary, close-range activation is the cost |
| Serpens | The same damage/slow in smaller 5.5-second death fields; needs kills and enemies near those positions |
| Vulpecula | Bomb survivors stop for 1.2s (1s bosses); no duration stacking, and no stun through shield-only damage |
| Circinus | Eight direct bullet hits give 4 player shield, at most once per 3s and capped at 12; useful against bosses without kills |

These comparisons preserve specializations. An AoE pick can exceed a passive weapon bonus against a tight crowd and provide little against a lone distant guardian. Numerical weapon bonuses remain valid when setup is unreliable. Damage fields are floor-bound and non-stacking, and controls use the strongest relevant slow.

## Blessing guardrails

Target: each blessing is worth about two to three constellations and should change how a run plays: roughly +50–75% damage or 30–45% less damage taken, counting utility (healing, slows, pushes, distraction). One constellation is the reference unit: +25% damage (Lyra, Orion, Draco, Scorpius) or 15% less damage taken (Delphinus). Blessings that mix defence or control carry less raw damage. All values live in `BLESSING` in `constants.ts`.

| Blessing | Strength reference and limit |
| --- | --- |
| Ruby | +50% outgoing damage/+20% speed while unharmed; a 1.5-second setup, so it returns quickly between hits, and only real HP damage ends it (shield-absorbed hits keep it), so it pairs well with shields. About +40% average damage plus speed |
| Emerald | Each attack stack (up to ten, 3s each) gives +5% speed and +2% damage (+50%/+20% at full); hits slow ordinary enemies 7% per stack to 60% and bosses 3.5% to 30%. Needs constant attacking |
| Amethyst | Up to four independently destroyable 36-HP decoys, each firing 0.45 × alien skill scale every 0.375s and drawing ordinary aliens within six tiles; their fire never produces healing, haste or copies |
| Diamond | Real heals grant 6 shield; incoming hits grant 50% of mitigated damage before absorption, bounded to 2–20. Shared one-second cooldown and 80 cap; cannot replace a larger shield. Roughly a third of incoming damage returns as shield |
| Sapphire | At most 5 player HP/second from damaging hits plus a refreshing, non-stacking 3s debuff cutting directly hit enemies' damage by 20%; misses, shields and secondary copies do not heal |
| Peridot | Walking leaves up to sixteen four-second 3×3 fields dealing 8 DPS and slowing ordinary enemies 40%, bosses 20%; must move, floor-only, overlap never multiplies damage |
| Pearl | 25% player damage reduction plus direct-hit reflection calculated before its own reduction; a 4% boss max-HP cap per hit and no ownerless-hazard return prevent runaway reflection |
| Amber | +60% earned energy, +2s powered duration stacking with other duration bonuses, and basic-ability refresh on a real transition to full; no F-skill generation or repeated full-bar refresh |
| Obsidian | 75% kill chance for a four-tile/four-second well, capped at five; 9 ordinary DPS or 0.5% boss max HP/sec, 25%/15% slow and floor-safe ordinary-enemy pull. Overlap cannot multiply effects; ten direct boss hits within 3s also make one (shared 6s cooldown) |
| Opal | 65% chance ×100% copied damage = 65% expected extra primary-attack damage when copies connect; Ruby position matters |

Balance assertions test damage bounds, control duration, caps, expiry, failed-input behavior and non-recursion. Whole-run win rates and perceived difficulty still require playtesting across maps and builds; there is no measured universal average gain for these different effects.
