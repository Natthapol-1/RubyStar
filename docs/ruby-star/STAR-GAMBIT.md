# Star Gambit (planned mode)

[Overview](README.md)

A run-building mode, separate from Endless (survival) and Celestial Challenge (boss mastery). Each run you pick one restriction, take one weapon from a slot machine and spend a currency in a shop between waves, on one map (the Bazaar Ring). The core is managing **Glint**: you spend it on upgrades, but every 3 waves you must also pay Glint for **oxygen**, so every purchase is a gamble against the next payment. There are no bosses; elite aliens get in the way instead. It is being built one step at a time; **Built so far** lists what exists now, and everything else here is the plan.

Working name: **Star Gambit**. Currency: **Glint** (small glowing crystal chips; "Stardust" is already an Endless blessing).

## Built so far

- Star Gambit is for a later version. Route `/gambit` works only in development builds (release builds show the 404 page), and only development builds show its lobby card, with an IN DEVELOPMENT tag.
- The **Bazaar Ring** map (63×63): six stalls (ALPHA–ZETA) on the corners of a hexagon around the PLAZA, each with a teleport pad (keys 1–7). A ring of corridors joins neighbouring stalls; the top and bottom stalls have spokes into the plaza and each side stall a straight corridor across into it. Each stall has its own crate pattern (ALPHA corner brackets, BETA broken shelves, GAMMA a broken ring round the pad, DELTA scattered crates, EPSILON diagonal arms, ZETA four counters); the plaza has four pillars. You and Ruby start in ALPHA.
- Its own backdrop: a dusk trading port. The sky has a banded setting sun, a ringed planet and moon, cloud streaks and a dotted traffic lane. The skyline has three parallax depths (hazy far towers, lit middle towers, dark near towers with rooftop gear and neon signs), plus crossing freighters and drifting crates.
- **Shop:** a square gold button with a shopping-bag icon sits just right of the WAVE box and opens the Bazaar Shop (`GambitShop.tsx`; play pauses). It is the slot machine's gold cabinet with your Glint, the next oxygen bill (or the debt) and a shelf of six empty slots: no stock is built yet. Close, Escape or a backdrop click resumes.
- HUD: **WAVE** replaces STAGE, with a 150px bar that drains over each 45-second wave (the clock only advances the wave number for now). A Glint counter sits beside the energy bar. Below 1280px wide, the HUD bars are a little narrower to make room.
- One weapon per run, fired with the Primal Skill control (it replaces the primal skill; middle click by default). Laser, bullets and the Pulse Wave keep their usual controls. Nine weapons are built (Orbital Strike, Arc Blade, Comet Dash, Ruby Sling, Gravity Well, Ruby Leap, Storm Mark, Star Cannon and Siphon Nova), drawn in the player-attack style (three-layer glowing bands, square rims, pixel rays, star flashes) with levelled sounds (see [Audio](AUDIO.md#star-gambit-weapons)). Its icon sits beside the bomb in the HUD, like a challenge's primal skill icon (`GambitWeaponStatus.tsx`): a blocky pictogram in the weapon's colour whose border fills while it recharges, with a white bar while Comet Dash charges. Each run opens on the **slot machine** (`GambitSlotMachine.tsx`): you pick a lucky weapon (3× as likely as each other weapon, about a 66% chance to come up), pull the lever, and three reels land on three different weapons; you keep one (click it or press 1–3). The cabinet is a gold frame with chasing marquee lights, dark reel windows, a red-knobbed lever and the weapons' own pictograms. The God panel WEAPONS button still opens a plain picker of all nine, +1000 GLINT adds Glint, and Wave +1 / Wave −1 replace Stage +1: Wave +1 ends the current wave (charging an oxygen bill if one is due), Wave −1 steps back a wave (not below 1) without refunding anything.
- **Glint drops:** every alien killed (not by a meteor) drops one Glint chip worth about 20 × its max HP, +10% for each wave after the first, at least 1 (in wave 1 a normal alien gives 100 and an Armored 440; by wave 10 they give 190 and 836). You collect a chip by coming within 2 tiles of it in any direction: it flies to you and is counted. Uncollected chips last 20 seconds and blink in their last 3. Chips are small gold crystals on their point, bigger when richer.
- No aliens, bosses, meteors or space events yet, so nothing drops Glint in play; the God panel hides boss and celestial-skill buttons here. Shop, oxygen, rules, effect cards and elites are not built yet.

## Run structure (plan)

1. Start of run: pick **1 of 3 Wagers**, then pull the slot machine for **1 weapon** (built).
2. About 15 waves on the Bazaar Ring. Aliens drop Glint, collected within 2 tiles of you (built).
3. Between waves: the **Shop** (weapon and Pulse Wave upgrades, map unlocks, consumables).
4. Every 3 waves: pay the **oxygen** bill in Glint (built, below), then pick **1 of 3 Effect Cards**.
5. No bosses: **elite aliens** with abilities that hinder you. The final wave can bring every elite type.

## Oxygen (built)

The end of every third wave brings an oxygen bill: 1000 Glint, then ×1.5 each time, to the nearest 10 (1000, 1500, 2250, 3380, 5060…; `OXYGEN` in `gambit.ts`). It takes what you have; any shortfall becomes **oxygen debt**. While in debt you lose 1 HP per second for every 500 Glint owed (rounded, at least 1: owing 300 drains 1 HP per second, 1,300 drains 3), so a bigger debt hurts faster; Glint you collect pays the debt first, easing the drain as it shrinks. Glint spent in the shop is Glint you cannot use for air, so the run is about balancing upgrades against the next bill. The HUD shows an oxygen box (no label) at the start of the right-hand group (before TIME): the next bill and the waves until it is due (it flashes when a bill is charged), or the debt in red.

## Wagers (pick 1 of 3: a risk for a reward)

Each Wager trades a risk for a reward, like a bet, and changes how the run plays: choosing is picking the trade that suits your weapon. Chosen so far:

| Wager | Risk | Reward |
|---|---|---|
| Glint Ammo | Each use of your weapon costs 150 Glint (about one and a half normal aliens), competing with the oxygen bill | Your weapon has no cooldown |
| Wandering Ruby | Ruby walks its own slow route around the Bazaar; it cannot be carried | Ruby is tankier |
| Twin Rubies | Two Rubies, never in the same stall; losing either ends the run | Both Rubies heal themselves and attack nearby enemies |
| Locked Pads | Each teleport pad leads to one set stall | Each teleport releases a damaging wave where you arrive, like a Constellation effect |
| Iron Will | No speed boost | Immune to stuns, slows and freezes; your own bomb cannot hurt you |
| Long Shot | You walk 20% slower, and you take 40% more damage from enemies within 2 tiles | Your attacks and weapon deal more damage the further the enemy is from you: nothing extra within 2 tiles, rising to +80% at 8 tiles or more |
| Bleeding Edge | You lose 1 HP every second, all run | All your healing is doubled (heals, Siphon Nova, kill rewards), and healing past full HP becomes a shield, so you can heal even at full HP |

## Weapons (one per run, on the Primal Skill control)

Laser, bullets and the **Pulse Wave** (hold left click to charge and release) stay in every run on their usual controls; the Pulse Wave can be upgraded in the shop (radius, push, charge speed, an echo wave). The chosen weapon takes the primal skill's place and works like a skill: each hits far harder than the Laser (2.3 damage every 0.67 seconds) on a cooldown of 1.5–10 seconds. Balance: each is worth roughly 12–24 damage to a group every 3.5–7 seconds; skills with extra utility (stun, pull, heal, movement, lightning) give up some damage or cooldown for it. Arc Blade is the most frequent but melee only, and the Ruby skills need Ruby placed nearby.

| Weapon | Use |
|---|---|
| Orbital Strike | Places a 3×3 strike at the cursor: 24 damage after a 0.83-second delay; 5-second cooldown |
| Arc Blade | Short-range melee sweep the way you face: 8 damage and a 2-tile knockback; 1.5-second cooldown |
| Ruby Sling | Like the Singularity's Gravity Hook, but only on Ruby: hold to latch Ruby (carried, or placed within 8 tiles) and tow it behind you, release to fling it up to 7 tiles the way you face (bending toward an enemy within 30°); it stops at walls or the first enemy. Its 3×3 landing deals 14 damage and stuns for 1.5 seconds; 4.5-second cooldown |
| Gravity Well | A 5×5 field at the cursor after a 0.33-second warning; for 2 seconds it pulls each enemy inside one tile toward its centre every 0.25 seconds, dealing 2 damage per pull; 6-second cooldown |
| Ruby Leap | Jumps you beside a placed Ruby within 12 tiles at a steady speed (0.4 tiles per tick, so a full 12-tile jump takes 0.5 seconds and a short one is quicker); the landing deals 12 damage in a 7×7 area and pushes enemies 2 tiles away; 6-second cooldown |
| Storm Mark | Marks the enemy nearest the cursor (within 2.5 tiles of it) for 6 seconds. Each of your attacks on it (Laser, bullets, Pulse Wave, bomb) sends lightning to the 2 nearest enemies within 4 tiles of it for 5 damage each, at most every 0.5 seconds, like the Sniper kill buff; 10-second cooldown |
| Siphon Nova | Hold to grow a square field around you (radius 1 to 5 tiles over 1.5 seconds) while you move at half speed. Release to slow every enemy in it to half speed (1.5–3 seconds) and deal 3–8 damage; you heal 1–2 HP for each enemy hit (at most 15). All of it grows with the hold; 7-second cooldown |
| Star Cannon | Fires one big, slow orb three tiles across straight the way you face (3.5 px per tick); it hits every enemy it passes once for 14 damage with a 1-tile knockback and keeps going until it bursts at a wall; 5-second cooldown |
| Comet Dash | A fast dash (3× knockback speed) the way you are moving (or facing) through enemies: a tap goes 1 tile; distance grows with the square of the charge, so short holds stay short and a full 0.75-second hold goes 7; 12 damage to each enemy passed; 3.5-second cooldown |

Each weapon has two or three upgrade tiers in the shop.

## Map (one: the Bazaar Ring)

Star Gambit uses only the Bazaar Ring. Planned extras on it: paid unlocks (doors, pads, cover), a new breach where aliens enter each wave, and vending pads for mid-wave buys at a markup.

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
| Jammer | Disables your weapon while you are near it |
| Lockdown | Seals its chamber's doors and pad until it dies |
| Mirror Knight | Reflects one weapon type back at you |
| Overseer | Shields nearby aliens |
| Cloaker | Invisible on the minimap and faded in its room |
| Ruby Thief | Drags Ruby toward a breach |

## Open decisions

- Run length: a fixed 15-wave run with a finale, or endless with a score.
