# Saturn

[Overview](README.md) · [Gameplay](GAMEPLAY.md#modes-and-lobby)

Normal spawn slots draw from the [shared challenge alien pool](ENEMIES.md#shared-challenge-alien-pool) like the other maps: Armored, Healer, Runner and Charger join on the opening schedule, then Ghost, Bomber and Lancer after 60 seconds, with rare Shooters. The map’s own enemies retain their existing spawn rules.

`/challenge/saturn` is a fight against the Frost Warden in which you rarely hit her. **Her frost shields are her life:** she gives large frost shields to her aliens. Breaking or taking a frost shield costs her 20% of its amount. She calls the frost shield that is still out back to heal, and tears at herself when none is left. She has three phases of 1,200 HP (3,600 total); phase 2 adds Frost Bloom and frost-shielded empowered aliens, and phase 3 adds freezing grant and recall lines. Only the final defeat wins. Tuning is `SATURN` in `saturn.ts`; art is `saturn-art.ts`; the rule sheet is `SaturnGuide.tsx`; the C icon is `TimeStopStatus.tsx`.

Regular alien spawns, space events and the ordinary Warden chamber slow are off. Meteors still fall and take 10% of a phase from her, even through her own frost shield (it neither blocks nor absorbs the hit). Unlike elsewhere, a meteor here breaks her frost shield on shielded aliens in its chamber (costing her like any broken frost shield, without creating a pickup), but they survive; unshielded aliens are destroyed as usual. She still teleports into your chamber every 30 seconds.

Saturn’s book button beside Begin Challenge opens [Leave the Light On](SATURN-LORE.md), the story of the Frost Warden, her daughter Eda and the station’s landing lamp.

## Frost shields

- **Direct hits:** her body takes only 10% of your weapon and skill damage (`directDamage`).
- **Shatter:** frost shield you break on her aliens with your attacks costs her 20% of its amount (`shatterShare`). Frost shield broken by other sources does not.
- **Grants:** every 6 seconds (`grantInterval`) she gives 45 frost shield (`grantAmount`) to each of up to three marked aliens, a Glacier Hulk first and double (90). The targets for the next grant are marked as soon as a grant lands, so you have the whole cycle to find them. A snowflake hangs over each, a dotted cyan line joins it to her, and for the last 1.5 seconds a cyan square closes onto it and lands on its outline as the frost shield arrives. The minimap marks targets with cyan brackets that blink in the last 1.5 seconds, and every alien holding her frost shield with a bold violet diamond outline over its dot that flashes white during a recall warning. If fewer than three aliens are around, empty slots fill as new ones arrive.
- **Take it:** a marked target that dies before the grant keeps its slot (a Hulk's still double), and its frost shield comes to you instead, but only two-thirds of it as shield (30, or 60 from a Hulk; `killShieldShare`). Frost shield you take costs her 20% of its amount (`absorbShare`), however you take it.
- **Recall:** every 18 seconds (`recallInterval`), always midway between two grants, 3 seconds from each (the first recall waits an extra 3 seconds, `recallOffset`), she pulls back every point of her frost shield that is still out, on aliens and on you (the part of your shield that came from her, `playerIce`), and heals for 40% of it (`recallHealShare`), or only about 13% when it comes from a single holder (`loneRecallHealShare`), up to her current phase's cap. All of it is taken back, even though only part heals her. For the 1.5 seconds before it (`recallWarning`) everything holding her frost shield gets a violet diamond closing onto it, chevrons and moving motes along a violet line back to her, and a violet diamond closes on her too. A rising charge sound starts the warning. If nothing comes back, she takes a 20% backlash (`backlashShare`, 240 HP) instead. A failed recall fills the screen for about a second (`drawSaturnBacklash`): a white-then-violet flash, twelve long frost shield cracks radiating from her, square shock rings, tumbling frost shield fragments and a frosted violet frame with icicles, with a strong screen shake.
- Grant cues are cyan squares and recall cues violet diamonds, so the two never read alike. The HUD shows a GRANT and a RECALL bar under her HP; each turns white in its last moments.

## Phase 2: Frost Bloom and empowered aliens

Phase 3 keeps both.

- **Frost trail:** from phase 2, each tile you leave by walking is immediately tinted pale cyan, then freezes after 0.25 seconds (`trailDelay`, 15 ticks), melts 1.2 seconds after freezing (`trailIceTicks`, 72 ticks), and freezes you for 0.2 seconds (`trailFreezeTicks`, 12 ticks), removing one-fifth of your current shield (`trailShieldLoss`). Overlapping ordinary ice retains its normal freeze and shield loss. Up to five distinct tiles remain (`trailCap`), counting both warnings and frozen tiles. New footprints replace the oldest when the cap is reached. Each frozen footprint fades over its final half-second. A footprint replaced at the cap stops freezing immediately and fades over 0.2 seconds. Standing still creates no trail, so the remaining ice melts on its own. Any player freeze clears the entire trail as a hazard immediately, while frozen tiles and pending footprints fade over 0.2 seconds. No trail is generated while frozen; walking after thaw starts a fresh path. Teleport pads stay clear; teleporting creates no trail between locations. Absolute Zero protects against this ice as usual. [Frost trail preview](visual-reference/saturn-frost-trail.png).
- **Frost Bloom:** every 4 seconds (`bloomInterval`, 240 ticks), each living alien holding the boss's frost shield passes up to 10 (`bloomAmount`) to the nearest unshielded alien within 4 tiles (`bloomRadius`). It transfers existing shield, preserving the total. Donors and bare recipients are selected from the start of the pulse: a new holder cannot pass it on until the next pulse, and each recipient gets at most one transfer per pulse. Ties use enemy ID. Absolute Zero stops frozen aliens from giving or receiving a transfer. The timer pauses with gameplay and starts fresh on phase entry.
- **Recall:** spread shields count as additional holders under the existing recall rule. One remaining holder gives the reduced heal; multiple holders give the normal heal. Breaking, stealing or countering frost shields no longer drops floor pickups.
- **Empowered aliens:** a frost-shielded alien moves faster and hits harder, scaling with its shield, up to +50% speed and +50% damage at 90 (`empowerFullIce`, `empowerSpeed`, `empowerDamage`). This applies to attacks on you and Ruby.
- **Look:** a short cyan transfer joins the donor to its recipient. Frost shields use the shared hexagonal painter; empowered aliens retain their pale square aura and rising streaks. There are no collectible shield shards.

## Phase 3: freezing lines

Phase 3 keeps everything from phase 2 and 48 frozen tiles. When a grant or recall fires (not during its warning), every line it casts freezes the floor tiles it crosses for 1.95 seconds (`lineIceTicks`). This includes stolen grants and recalls blocked by Absolute Zero; blocking the shield transfer does not stop the frozen path. Frost Bloom transfers create no path. Paths follow the exact world-space endpoints of the rendered beam, including moving targets and short diagonal tile crossings, and skip walls and both endpoint tiles. This excludes the shield holder’s tile for recalls as well as grants. If both endpoints are on the same tile, no path is created. Existing frozen ground at either endpoint is not removed. A path tile freezes you for 0.4 seconds (`lineFreezeMult`: 24 ticks, one-third of the normal freeze). Overlapping ordinary frozen tiles or enemy-created ice retain their normal 72-tick freeze. Absolute Zero still protects you from freezing inside its field.

## C: Absolute Zero

C casts Absolute Zero, stopping time in a field reaching 7 tiles from where you cast it (`fieldRadius`) for 0.75 seconds (`fieldTicks`), with a 2.6-second cooldown (`cooldown`).

- Her aliens inside freeze in place, and every attack they had started is cancelled (a crouch, a slam wind-up, a pounce in mid-air drops where it is). Hailer shells landing inside fizzle, and new ones are not aimed there.
- Casting is allowed while frozen and immediately clears your freeze. Frozen tiles cannot freeze you while you stand inside. A cast blocked by cooldown or paused gameplay does not thaw you.
- A grant landing on a marked alien inside the field comes to you instead, as shield worth twice the grant (90, or 180 from a Hulk; `fieldShieldShare`), with the same 20% damage to her. A caught grant also strips the frost shield of every alien inside the field: not given to you and no damage to her.
- A recall cannot pull any frost shield inside the field. Her aliens' frost shield there is stripped instead (not given to you, no damage to her), and yours is kept if you stand in it. Countering a recall this way heals you for 20% of the frost shield the field kept (`counterHealShare`), and Ruby for two-thirds of that amount (13⅓% of protected frost shield).
- A successful counter (a caught grant or a countered recall) also deals 8 damage (`counterDamage`) to every alien inside the field, after its frost shield is stripped. A caught Grant releases four compact cyan corners and ice chips around the player, with a lighter shake than Recall. A blocked Recall snaps four violet seal corners inward, then breaks into a white-mint flash, diagonal light bursts, spinning ice fragments and staggered rising healing crosses. [Grant counter](visual-reference/saturn-grant-counter.png) and [Recall counter](visual-reference/saturn-recall-counter.png).
- Time it as the cyan or violet rings close: the target square glows while a cast would still catch the event.
- Look: a pale clock face with twelve hour blocks, a hand swept backward, frames rippling inward, frozen motes and a cold wash; a bright square shockwave as it opens. Frozen aliens show a dashed white frame, and cancelled attacks a fading white cross. The HUD hourglass flips once on each cast. Sounds: the freeze recording with a high Saturn Guard layer on cast; the primal-skill ready recording when it recharges.

## F: Saturn Guard

The ordinary Saturn Guard: you and Ruby get a shield of at least its usual amount, with its normal appearance. It is not her frost shield and cannot be recalled.

## Blizzard and frozen floor

- Your shield is capped at 200 here (`shieldCap`), from every source including Saturn Guard. Taken frost shield beyond the cap is lost, though it still damages her.

- A constant blizzard deals 4 damage per second to you only (`blizzardDamage`), never to Ruby or her aliens, so keeping a shield up matters: unshielded, it takes your whole HP in 25 seconds. While you hold any shield it drains the shield instead and does not chill you; without one you also get the usual Warden slow (movement and attack charge).
- Frozen tiles across the map (32 in phase 1, 40 in phase 2, 48 in phase 3; `iceCount`) move every 6 seconds in phase 1 and every 4 seconds from phase 2 (`iceInterval`) after a 1-second warning, with no extra tiles in her chamber. Neither these tiles nor the phase 3 line paths ever land on a teleport pad; only alien attacks (Hailer shells, Hulk slams) can freeze a pad. Stepping on one freezes you for 1.2 seconds and halves your shield; a triggered tile melts. A freeze plays the freeze recording.

## Her aliens

She spawns one every 3 seconds, up to 16 units, and from phase 2 one every 2 seconds, up to 22 (`spawnInterval`, `population`): 30% Frostbiter, 25% Hailer (at most three), 15% Glacier Hulk (at most two) and 30% Normal. Their own HP is low, but her large grants make a shielded alien far tougher, so taking or breaking her frost shield pays more than racing them down. They target placed Ruby only when she is more than two tiles closer than you. A Wave or bomb shove cancels a crouch or wind-up.

| Alien | HP | Behaviour |
| --- | ---: | --- |
| Frostbiter (`frostbiter`) | 12 | Walks at 1.4. Within 4 tiles it crouches for 0.5s (a growl; your tile is marked in rose), then pounces onto that tile. Landing hits for 14, strips all your shield before damage (including all held Warden frost shield) and knocks you back two tiles; placed Ruby there takes 10. 2s cooldown |
| Hailer (`sleet_mortar`) | 12 | Slow (0.55). It chases you and stops 6 tiles away, one tile short of Absolute Zero's reach, without backing off if you close in. Within 9 tiles it lobs three shells over cover at your tile and two tiles either side, across its line of fire (a launch and falling-shell sound). Each target square closes over 1s; a landing deals 10 (Ruby 7) and freezes that tile for 2.4s. Every 4s |
| Glacier Hulk (`glacier_hulk`) | 40 | Walks at 1.3; her favourite for grants. Within 2 tiles it raises its fists for 0.75s (a charge sound; the 5×5 area is marked in rose), then slams: 18 damage and a two-tile shove (Ruby 12). The floor around it freezes for 1.6s if the slam hit you, but only 0.4s if it missed. 3.5s cooldown |

## Look

The frozen ring station keeps its icy palette (distinct cyan Alpha, glacier-blue Beta, light-blue Delta and white Gamma rooms), parallax ring and floe backdrop (with a sparse twinkling starfield and the distant ringed planet in the star map's icy cyan bands, with two small orbiting moons), dense blue crystal cover and level-1 blizzard snow and edge tint. Alien models:

- **Frostbiter:** a low ice wolf-block with a wide jaw of white fangs, two slit eyes (white while crouching) and swept crystal spines; it squashes as it crouches and stretches in the leap.
- **Hailer:** a squat packed-snow turret with an upward barrel that kicks when it fires and a pale shell showing just before.
- **Glacier Hulk:** a massive glacier block with seams, pale eyes and two fists it raises before a slam.

Her frost shield uses the shared hexagonal shield painter. Grant beams are cyan, beams of frost shield coming to you white, recall beams violet. Breaking frost shields throws six cosmetic square fragments; a backlash flashes a rose square with white cracks on her.

## Rule sheet

The rule sheet has short descriptions grouped under General Rules & Skills, Enemies, Phase 2+ (Frost Bloom, empowered aliens and Frost Trail) and Phase 3 (freezing lines). Bold warm-gold opening guidance highlights breaking or stealing the boss's frost shield and blocking recalls with Absolute Zero. Cards describe effects without tactical instructions The Marked Targets card uses the same grant-mark painter as gameplay: a snowflake, dotted cyan beam from the Warden, travelling motes and a closing cyan square, in contrast to Recall’s violet diamond. [Shared grant mark reference](visual-reference/saturn-guide-grant-mark.png). Hailer’s card shows its three-shell launch, impacts and frozen tiles; Frost Bloom shows a transfer between shield holders. [Guide attack and Bloom previews](visual-reference/saturn-guide-attacks.png).

## God controls

Phase 1/2/3 (summons her if needed, sets that phase at full HP and marks new targets), Zero Ready (recharges C), Grant Now and Recall Now, plus the standard challenge controls.

## Checks

`node --test tests/saturn.test.cjs` covers direct-damage reduction, shatter damage, marking and grant sizes, taking a dead target's frost shield, the Absolute Zero field (redirect, freezing aliens, cancelled attacks, fizzling shells, freeze immunity), recall and backlash, recalling your frost shield, the blizzard, all three aliens and the win. It also covers Frost Bloom (timing, nearest targets, shield conservation, no instant chains and recall holder counts), empowered aliens and phase 3 path expiry. `node scripts/preview-saturn.cjs docs/ruby-star/visual-reference` renders [marked targets](visual-reference/saturn.png), [a grant landing](visual-reference/saturn-grant.png), [a recall](visual-reference/saturn-recall.png), [the Absolute Zero field](visual-reference/saturn-field.png), [alien attacks](visual-reference/saturn-attacks.png), [Frost Bloom and empowered aliens](visual-reference/saturn-phase-2.png) and [alien models](visual-reference/saturn-enemies.png).
