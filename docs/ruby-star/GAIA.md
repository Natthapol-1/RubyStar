# Gaia challenge

[Overview](README.md) · [Gameplay](GAMEPLAY.md#modes-and-lobby) · [Neptune](NEPTUNE.md)

Regular alien spawns use the [shared challenge pool](ENEMIES.md#shared-challenge-alien-pool): Ghost, Bomber and Lancer join after 60 seconds, with Shooter rare. The map’s themed enemies keep their own replacement chances and phase rules.

The second full Celestial Challenge (`/challenge/gaia`): a territory fight against the Thorn Weaver over an overgrowing station. Neptune is about finding things; Gaia is about clearing and holding ground. Everything shared by challenges (stage 0, guardian-only boss, recharging celestial skill, win on defeat) is in [Gameplay](GAMEPLAY.md). Values live in `constants.ts` as `GAIA_*`. Logic is `gaia.ts` (`state.gaia`, with short hooks in `engine.ts`), art is `gaia-art.ts`, and the rule sheet is `GaiaGuide.tsx`.

Gaia’s book button beside Begin Challenge opens [The Surprise Party for a Rock](GAIA-LORE.md), the story of Pip and an unexpected village celebration.

## Overgrowth

- Every floor tile has a growth level: 0 clean, 1 moss, 2 vines, 3 thicket. Walls and pads never grow.
- **Vines** slow you to 0.6×. She heals 0.95185546875% of the phase per second while standing on them.
- **Thicket** slows you to 0.45× and deals 1 damage per second. She heals 1.9037109375% per second on it and takes only 75% damage there.
- **Spreading:**
  - **Her trail:** tiles within 2 of her grow +1 every 1.5s, up to vines.
  - **Creep:** every 3s, vines have a 15% chance to spread moss into a clean neighbour, and moss beside vines can thicken. Capped at 120 upgrades per pass.
  - **Vine crawlers:** they thicken the tiles they walk on.
- **Clearing:**
  - Lasers and bullets take 1 level off each tile they hit.
  - Waves and bombs clear their whole radius.
  - Gaia's Roots (your challenge skill, F; 25s field here instead of 30s, returns 35s after a cast) clears its whole field when cast (any level), removes her active thorn-field tiles inside it the same way Sunfire does, and stops growth inside it while it lasts.
  - Meteors **scorch** their whole room: growth goes to 0 and nothing regrows for 10s.
  - **Clearing heal:** every growth level your attacks or Gaia's Roots cut heals you and Ruby 0.1 HP each (`GAIA_CLEAR_HEAL`), with no cap, so a wave, bomb or Gaia's Roots cast through thick growth can heal a lot at once (up to max HP). It is paid once per tick with at most one heal effect per second and follows normal healing rules (the Bleeder curse blocks your share). Meteor scorch and Sunfire burns do not heal.
- **Ruby:** placed Ruby keeps every tile within 2 (Chebyshev distance) clean. If every floor tile in the ring at distance 3 reaches vines, the ring closes and squeezes Ruby for 3 per second. The ring is outlined orange at 80% coverage and red when closed. Carried Ruby has no ward.
- **Minimap:** vine and thicket tiles show green, so you can see which rooms are feeding her. Healing blossoms show as pulsing pink flower icons, and she has the regular map’s green boss marker, with a dark backing and white ring so she stays visible over vines.

## Sunfire (C)

- **Charging:** every growth level you clear with an attack adds 0.8262 charge, up to 100. Breaking a seed pod adds 6.885. Scorching does not charge it.
- **Firing:** press C at any charge of 10 or more.
- **Partial charge:** an instant burst around you. Its radius grows from 2 to 7 tiles with the charge. It scorches tiles, removes active thorn-field tiles inside the same radius, burns aliens and her plants inside it, and costs her up to 12% of the phase, scaled by the charge.
- **Full charge:**
  - C opens the minimap room picker (like Neptune's Ocean’s Chorus; Esc or C cancels and keeps the charge). The chosen room glows gold for a 3s wind-up, then burns: scorched, active thorn-field tiles cleared, aliens and plants destroyed.
  - Like the Ocean’s Chorus it can be dodged: **you and placed Ruby take 50 each only if still inside** the burning room.
  - She takes 12% of the phase (360) if she is in that room, ignoring her armor.
  - It also draws a Sunstone into the chamber if it has fewer than two.
- **Thorn clearing:** only tiles inside the burst or selected chamber are removed; a field crossing the edge remains hazardous outside it. Fully burned fields disappear. Cleared tiles stay removed for that field’s lifetime, and rendering, player contact and Ruby damage use the same remaining footprint. Clearing a field grants no extra healing or Sunfire charge.
- **The choice:** a small burst early for safety, or wait for the big hit.

## Sunstones

- There are 8 gold crystal tiles, 2 per room at the start. They sit on interior floor away from walls and pads, and never overgrow.
- **Fields:** when one of her thorn fields lands on a lit stone (aimed or proximity), the field burns away harmlessly and she takes 4.95% of the phase (`GAIA_STONE_SELF_DAMAGE`). Each successful burn also heals you and Ruby for 1% of your respective maximum HP (1 HP each, `GAIA_STONE_HEAL`), capped at full health, using the normal healing effects and restrictions.
- **After one hit:** each stone takes one hit, then shatters and flies (1s, visible arc) to a random spot in a different room, at least 4 tiles from you. It relights 1s after landing. The minimap shows lit stones as gold dots.

## Phases

She has 9000 HP in three 3000-HP phases on a three-segment guardian bar (phase 3 left, phase 1 right). The name line reads THORN WEAVER · PHASE n. Below it a THORN FIELD countdown bar in her colour drains over her cast cooldown, reaches empty when the warning tiles of her next aimed field appear, stays empty through the warning and refills when the field lands. Damage cannot push her past phase 1 or 2: a hit stops at the phase floor, and on the next update the next phase starts at once with full phase HP (her blossoms die, thorn fields clear and the PHASE banner shows; there is no pause or immune window). Phase 3 ends when its HP runs out.

1. **Phase 1:** her usual Thorn Weaver behaviour, except that when she is not fleeing she walks to the best vine or thicket tile within 8 (thicket preferred) and lingers there to heal (aimed fields, cast faster here: every 1.5s after one lands instead of 4s; the proximity field, keeping her distance) plus her growth trail.
   - **Seed pods** (6 HP) land at a random spot at least 5 tiles from you every 15s. They swell for 8s, then burst into a 3-tile radius of thicket.
2. **Phases 2 and 3:** the same, with pods every 18s, plus:
   - **Blossoms** (12 HP, at most 4): one is planted every 18s on overgrowth near her (at 4, the oldest withers to make room), never within 2 of a Sunstone. Each heals her 0.6% of the phase per second, and every 3s fires pollen at you within 7 tiles (4 damage, 0.7× speed for 1s). On cleared ground they wilt, losing 2 HP per second. Breaking one yourself costs her 8% of the phase and heals you 15 (wilting does neither).
     - **Pulse:** every 8s (the first 3–7s after planting), a blossom bursts at once if you are within 6 tiles (`blossomPulseHits`); there is no wind-up or warning. If you are out of reach it checks again every 0.5s. Stepped pink rings spread out and you take 3 damage and are pushed 4 tiles away with the normal knockback (carrying, Ursa Major and crowd-control immunity apply). Ruby is not hit. Tuning: `GAIA_BLOSSOM_PULSE`.
     - Entering phase 2 or 3 plants one blossom at once.
   - **Root snares** every 4.5s: a red crack under you (roots never target Ruby). After 1s it erupts for 6. If you are still on it, you are rooted in place for 1.5s.
3. **Phase 3 extras:**
   - **Twin fields:** each aimed cast also drops a second field 4 tiles from you toward your nearest lit Sunstone, blocking the way there (skipped if it would cover a stone or a wall). Both erupt together.
   - **Drifting stones:** every 4s each lit Sunstone hops 2 tiles in a random direction, staying on open floor in its room (another direction is tried if cover blocks the way).

## World rules

- **Lifeblooms (help):** friendly mint flowers sprout on random tiles at least 4 from you: every 25s in phase 1 (at most 1), every 15s in phase 2 (at most 2), every 6s in phase 3 (at most 3). Any hit breaks one and heals you and Ruby 25 each; unbroken ones fade after 15s. They are not enemies: they never block healing at Ruby and auto-aimed bullets ignore them. Shown on the minimap as mint crosses.
- **No space events.** Meteors still fall: they deal 10% of the phase (300) in every phase, ignoring her armor and thicket, and scorch their room.
- **Aliens spawn more:** about 1.7× as often (every 1.8s at stage 0 instead of 3s), with 3 more allowed alive at once.
- **Aliens:** half of normal alien spawns are replaced by Gaia aliens: 40% of those are Ragecaps and 30% each sporelings and vine crawlers.
  - **Sporelings** (5 HP, speed 0.9) stop within 8 tiles with a clear line of sight, wind up for 36 ticks and fire one dodgeable violet spore at 4.5 pixels/tick (112-tick lifetime, 10.5-tile travel limit), with a 120-tick cooldown. Shots fly straight without homing, deal 5 player / 4 Ruby damage, and slow a directly hit player to 0.5× for 90 ticks without stunning. This uses its own timer; it takes precedence over the weaker blossom-hit slow rather than multiplying it. On a unit, wall or range-limit impact they burst into vines within 1.5 tiles (`GAIA_SPORE_SHOT`); walls, Ruby’s ward, Sunstones, scorching and Gaia’s Roots still prevent growth normally. Wall impacts grow around the last open tile. Their existing on-death 2-tile cloud lasts 4s, slows to 0.7×, poisons for 2 damage every half-second, and grows vines. The projectile burst adds no poison cloud.
  - **Vine crawlers** (8 HP) roam without attacking and thicken the ground they walk on.
  - **Ragecaps** (14 HP, very fast 3, melee 3, 2 to Ruby): a hit knocks you back two tiles along its main direction, with a small shake. They leave vines where they run, like crawlers.
- **Pollen drift:** after a 30s gap, a yellow haze fills one room for 8s. Inside it you walk at 0.75× and your laser range is halved, and the vines there creep 1.5× as fast (an extra creep pass between the usual ones).
- **His thorn fields hurt more:** standing in one costs 3 every 0.75s (1 elsewhere), on top of the usual poison. A field erupting on a placed Ruby cuts it for 3 (you take 12); after that Ruby takes a small 1 every 0.75s while inside (no poison).
- **God panel extras:** Full Sunfire, Skill Ready, and Phase 1/2/3 buttons.

## Look

Stone cover mixes lightly mossed masonry, broader moss patches and occasional heavily overgrown faces. Moss forms chunky rectangular mats and stepped hanging patches; some stones retain mostly exposed grey faces. A few mossy blocks carry small flowers with four square petals, a solid pale centre and a short block stem, in muted pink, gold or lavender. Short and tall grass grows on wall faces or rooted on exposed wall tops, using two chunky rectangular fronds with stepped blades in muted woodland greens, matching the simple construction of Neptune kelp. The same blocky construction appears as sparse short 6–9px and taller 13–18px floor tufts at low contrast; wall grass is more frequent and clearer. All decorative foliage uses subdued colours and sparse placement so spawned vines and thickets remain the stronger gameplay cue; it stays separate from functional overgrowth tiles. Current source-rendered [stone variation](visual-reference/gaia-moss-cover.png) and [battlefield](visual-reference/gaia.png) come from `node scripts/preview-gaia.cjs docs/ruby-star/visual-reference`.

- **Theme:** forest. Green and gold room colours and a dark mossy floor with faint detail kept quiet under the vines: soft clumps of moss, olive, teal-green and earth tones, thin right-angle root veins etched into some tiles, a few fallen leaves, pebbles, rare tiny flowers and sparse blocky grass. A wind sweep, a soft pale-green band of light like the Moon's sheen, rolls across the floor in world space, clipped to floor tiles. Only on the tiles it is crossing, a subtle texture of short grass blades fades in and out with it; grass tufts it passes lean and brighten. Cover blocks are mossy stone (`drawGaiaStone`): two or three grey-green stones of mixed sizes with dark mortar, a light top-left bevel and shaded lower edges, occasional stepped cracks, moss creeping over the top edge and natural worn stone edges only where a block meets open floor: pale grey-green tops and left sides, dark shaded lower and right faces, with no luminous chamber-colour frame; some also carry small leafy sprigs. Fireflies drift over the station. Behind it is a dusky forest backdrop: a pale stepped moon with a soft halo, two far stepped ridges, three parallax tree lines with hanging vines and small glowing mushroom clusters on the nearest trees, light shafts, low drifting mist, pollen and blinking fireflies. Tree height follows continuous camera parallax, with no short vertical wrap; trunks extend below the viewport.
- **Overgrowth tiles:**
  - Kept plain: a flat green wash that darkens with each level, plus one simple motif. Moss is a faint tint with two dots.
  - Vines are one straight 6px vine (horizontal or vertical per tile) with a leaf.
  - Thicket is a darker wash with a crossed vine and two pale thorns. No wiggle or extra detail.
  - Scorched tiles are dark ash with embers.
- **Sunstones:** a gold block crystal with a soft pulse; dim grey-gold with a filling ring while relighting. The minimap uses a gold diamond (a rotated solid square) with a pale inset core; relighting stones use dim mineral colours.
- **Rooted in place:** when a snare catches you, four blocky roots burst up from the tile, curl over and grip with a vine band, trembling, then sink back as the hold ends. While a closed ring squeezes Ruby, the roots hold it with a red band.
- **Sunfire:** a partial burst is a gold flash with expanding square rings. A full charge shows a gold column with a SUNFIRE countdown, then a sun beam and ring shockwaves.

## Rule sheet

The rule sheet uses short descriptions and calls all floor growth vines. Warm-gold opening guidance highlights clearing vines, charging Sunfire and baiting thorn fields onto Sunstones. Sections: General Rules & Skills, Enemies, Phase 2+ (blossoms and root snares) and Phase 3 (separate twin-field and drifting-Sunstone cards). Sporeling and Vine Crawler have separate cards. Sunstones and Twin Fields show the actual warning and falling seeds. Root Snare visibly catches and holds the player using the real root-bind painter. Sunfire shows both partial and full-charge chamber strikes. Sporeling shows its windup, travelling violet shot, slowing hit and vine burst. Input labels stay outside the images. [Card animation reference](visual-reference/challenge-rule-attacks.png).

While Sunfire charge is full, the viewport edges bloom into a rich green/gold garland: expanded corner vines with finer branching shoots, softly swaying flat rectangular leaves, sixteen simple cream/gold cross-shaped flowers, and 84 drifting pollen lights with occasional loose leaves. The corner arrangements preserve the original light, open floral motif. Twenty-two loose block-built leaves drift and turn across the full viewport on a gentle breeze, with translucent colors and pale veins; they share the overlay fade. The centre remains clear; the whole overlay eases in over 0.5 seconds when charge becomes full and eases out over 0.5 seconds when charge is spent or a chamber strike starts. Vines, flowers and particles share the same smooth fade, which pauses with gameplay. [Full-charge bloom](visual-reference/gaia-sunfire-ready.png).

A Sunstone touching the boss field releases a clean blocky pulse at the contact tile: three layers of separated gold/cream cardinal bands, tiered square-petal backs, short green inset rails, four diagonal block-built petal clusters and eight sparse light streaks. The whole bloom is drawn at 2× size, with 48 small leaves and cream/gold petals bursting outward and gently turning, plus a brief square seed-heart flash. The centre stays open after a brief square flash. The cardinal fronts sit 8% closer to the centre with shorter bands, and diagonal petal clusters are wider. The 36-tick pulse (`GAIA_STONE_BLOOM_TICKS`) fades 20% more slowly and uses only rectangular geometry; the gold damage link to the Weaver remains as a thin, quiet beam. [Sunstone pulse](visual-reference/gaia-sunstone-bloom.png).

The full Sunfire layers Ocean’s Chorus's stretched fall cue with the supplied reverse whoosh. Both begin at the start of the 3-second wind-up; the whoosh plays at normal speed to match the falling cue's duration. Both Sunfire bursts use the Sunstone bloom’s clean blocky floral construction: layered gold/cream cardinal bands with tiered square-petal backs, wider diagonal petals, green leaf accents and a small seed-heart flash. Sunfire uses a saturated gold/amber palette than Sunstones, with cream crests and muted golden-olive leaves. Partial casts scale the wave to their charged radius over 36 ticks and burst 48 leaves and petals. Full impacts use the original chamber-sized flower burst in the current gold palette: a single bloom with separated cardinal fronts, diagonal petals and 64 leaves/petals. Its fronts expand over 84 ticks toward 66% of the chamber’s shorter dimension, while petal details retain their size. The main flower keeps its readable chamber-sized proportions. Both layers launch together: a second, unrotated lower wave draws underneath at 55% opacity, carrying 48 leaves/petals across the arena over 84 ticks to 25% beyond the farthest map corner, while the upper flower remains chamber-sized. This follow-up is visual only; there is no rotated inner blast. These replace the old square impact rings and broad impact column; the wind-up remains unchanged. Damage and scorching remain confined to the chosen room. References: [full Sunfire](visual-reference/gaia-sunfire-impact.png) and [partial Sunfire](visual-reference/gaia-sunfire-partial.png).
