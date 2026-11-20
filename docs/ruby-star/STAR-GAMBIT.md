# Star Gambit (planned mode)

[Overview](README.md)

A run-building mode, separate from Endless (survival) and Celestial Challenge (boss mastery). Each run you pick one restriction, fill three weapon slots and spend a currency in a shop between waves, on a new map layout. There are no bosses; elite aliens get in the way instead. It is being built one step at a time; **Built so far** lists what exists now, and everything else here is the plan.

Working name: **Star Gambit**. Currency: **Glint** (small glowing crystal chips; "Stardust" is already an Endless blessing).

## Built so far

- Route `/gambit`, lobby card STAR GAMBIT (IN DEVELOPMENT): a hand of two yellow cards with pale glints.
- The **Bazaar Ring** map (63×63): six stalls (ALPHA–ZETA) on the corners of a hexagon around the PLAZA, each with a teleport pad (keys 1–7). A ring of corridors joins neighbouring stalls; the top and bottom stalls have spokes into the plaza and each side stall a straight corridor across into it. Each stall has its own crate pattern (ALPHA corner brackets, BETA broken shelves, GAMMA a broken ring round the pad, DELTA scattered crates, EPSILON diagonal arms, ZETA four counters); the plaza has four pillars. You and Ruby start in ALPHA.
- Its own backdrop: a dusk trading port. The sky has a banded setting sun, a ringed planet and moon, cloud streaks and a dotted traffic lane. The skyline has three parallax depths (hazy far towers, lit middle towers, dark near towers with rooftop gear and neon signs), plus crossing freighters and drifting crates.
- HUD: **WAVE** replaces STAGE, with a 150px bar that drains over each 45-second wave (the clock only advances the wave number for now). A Glint counter sits beside the energy bar (always 0 for now). Below 1280px wide, the HUD bars are a little narrower to make room.
- All ten weapons, drawn in the player-attack style (three-layer glowing bands, square rims, pixel rays, star flashes) with levelled sounds (see [Audio](AUDIO.md#star-gambit-weapons)). The three-slot HUD at the bottom shows each slot's first bound key (Laser, Bullets and Primal Skill controls). The default loadout is Laser, Blaster and Orbital Strike; the God panel WEAPONS button opens the loadout picker (hold weapons are not offered for the left slot).
- No aliens, bosses, meteors or space events; the God panel hides boss and celestial-skill buttons here. Shop, rules, effect cards, elites and Glint are not built yet.

## Run structure (plan)

1. Start of run: pick **1 of 3 Run Rules**, then fill **3 weapon slots**.
2. About 15 waves. Aliens drop Glint, collected by walking over it.
3. Between waves: the **Shop** (weapons, upgrades, map unlocks, consumables).
4. Every 3 waves: pick **1 of 3 Effect Cards**.
5. No bosses: **elite aliens** with abilities that hinder you. The final wave can bring every elite type.

## Run Rules (pick 1 of 3, restrictions only)

Rules never give an upside; choosing is picking the restriction that hurts your loadout least.

| Rule | Restriction |
|---|---|
| Teleport Charges | Teleport uses charges (up to 3, slow recharge); with none you cannot teleport |
| Twin Rubies | Two Rubies, never in the same chamber; carry only one at a time; losing either ends the run |
| Wandering Ruby | Ruby walks her own slow route; she cannot be carried |
| Glass Cannon | Half max HP |
| Lifeline | No manual healing |
| Short Fuse | Aliens move 20% faster |
| Collapsing Station | Every few waves one chamber seals for good, with any Glint inside |
| Heavy Ruby | Ruby cannot be carried |
| Fixed Pads | Each pad leads to one set chamber |
| Dim Station | No minimap |
| Thin Wallet | Shop prices 25% higher |
| Fragile Gear | Each weapon slot jams briefly after you are hit |

## Weapons (3 slots: left, right, middle click)

**Pulse Wave is always kept**: hold left click to charge and release, in every run; it never takes a slot and can be upgraded in the shop (radius, push, charge speed, an echo wave). Weapons in the left slot fire on a tap; the right and middle slots can use taps or holds, so hold weapons are a little stronger there.

| Weapon | Left slot (tap) | Right or middle slot |
|---|---|---|
| Laser (existing) | Tap to fire | Tap to fire |
| Blaster (existing bullets) | One short burst | Hold to auto-fire |
| Orbital Strike | Places a 3×3 strike at the cursor; heavy, short delay, slow cooldown | Same |
| Arc Blade | Short-range melee sweep, high damage, small knockback | Same |
| Comet Dash | Instant half-charge dash toward the cursor | Hold to charge a longer, stronger dash through enemies |
| Chain Spark | Lightning jumping between nearby aliens | Same |
| Boomerang Disc | Hits going out and coming back | Same |
| Sentry | Places a small turret (up to 2) | Same |
| Gravity Well | Places a field that drags aliens together | Same |
| Ruby Lance | Fires from Ruby | Same |

Each weapon has two or three upgrade tiers in the shop.

## Map layouts (one per run)

| Layout | Idea |
|---|---|
| **Bazaar Ring** (built) | Six stalls on a hexagon around a central plaza chamber |
| Cargo Lanes | Long corridors with conveyor belts carrying you, Ruby, Glint and aliens |
| The Spire | Three floors joined by lifts; aliens arrive at the top |
| Scrapyard | Open ground with destructible cover |

Across layouts: paid unlocks (doors, pads, cover), a new breach where aliens enter each wave, and vending pads for mid-wave buys at a markup.

## Meteors (plan)

Still warned and dangerous, but also a resource: an impact leaves a **salvage crater** of Glint for a short time. A **Meteor Beacon** (shop) chooses the next chamber hit; a **Meteor Shield** protects one chamber once. With Twin Rubies, one meteor never threatens both chambers at once.

## Effect Cards (every 3 waves, pick 1 of 3)

| Card | Effect |
|---|---|
| Advance Pay | Gain Glint now; aliens drop half as much for the next 3 waves |
| Overclock | Weapon cooldowns 25% faster for 3 waves; take 15% more damage |
| Bounty Board | Elites drop triple Glint for 3 waves, and more appear |
| Black Market | Next shop 30% cheaper; the next wave gets an extra elite |
| Insurance | Pay now; the next lost Ruby survives at 1 HP |
| Double or Nothing | Kill a target count next wave to double your Glint, or lose a third |
| Meteor Magnet | Meteors twice as often for 3 waves; craters hold double Glint |
| Lean Times | No shop after the next wave; every weapon gets a free upgrade now |

## Elite aliens (no bosses)

| Elite | Ability |
|---|---|
| Tax Collector | Its hits steal Glint; killing it returns it |
| Jammer | Disables one weapon slot while you are near it |
| Lockdown | Seals its chamber's doors and pad until it dies |
| Mirror Knight | Reflects one weapon type back at you |
| Overseer | Shields nearby aliens |
| Cloaker | Invisible on the minimap and faded in its room |
| Ruby Thief | Drags Ruby toward a breach |

## Open decisions

- Run length: a fixed 15-wave run with a finale, or endless with a score.
- Weapon start: free choice of all three, or Laser and Blaster with the rest bought in the shop.
