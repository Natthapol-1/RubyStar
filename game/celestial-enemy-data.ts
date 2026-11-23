import type { EnemyType } from './constants';
import type { TrialBody } from './trials';

export interface CelestialEnemyEntry { id:string; map:TrialBody; type?:EnemyType; name:string; description:string; variant?:'golden'|'copy'; portrait?:'shark' }

export const celestialEnemies:readonly CelestialEnemyEntry[] = [
  {
    "id": "sun-cinder_wisp",
    "map": "sun",
    "type": "cinder_wisp",
    "name": "Cinder Wisp",
    "description": "Raises heat while alive."
  },
  {
    "id": "sun-emberling",
    "map": "sun",
    "type": "emberling",
    "name": "Emberling",
    "description": "Armored while burning. Water extinguishes and stops it."
  },
  {
    "id": "sun-flare_spitter",
    "map": "sun",
    "type": "flare_spitter",
    "name": "Flare Spitter",
    "description": "Spits three spreading fireballs that leave burning ground."
  },
  {
    "id": "sun-scorch_sapper",
    "map": "sun",
    "type": "scorch_sapper",
    "name": "Scorch Sapper",
    "description": "Drains cooling stations, blocks charging and raises heat."
  },
  {
    "id": "neptune-stinger",
    "map": "neptune",
    "type": "stinger",
    "name": "Stinger",
    "description": "Its bite poisons you."
  },
  {
    "id": "neptune-pufferfish",
    "map": "neptune",
    "type": "pufferfish",
    "name": "Pufferfish",
    "description": "Swells and bursts, knocking you back."
  },
  {
    "id": "neptune-jellyfish",
    "map": "neptune",
    "type": "jellyfish",
    "name": "Jellyfish",
    "description": "Defeating it during a dive reveals an echo."
  },
  {
    "id": "gaia-angry_mushroom",
    "map": "gaia",
    "type": "angry_mushroom",
    "name": "Ragecap",
    "description": "Fast, with a knockback attack. Spreads vines."
  },
  {
    "id": "gaia-sporeling",
    "map": "gaia",
    "type": "sporeling",
    "name": "Sporeling",
    "description": "Shoots slowing spores that burst into vines."
  },
  {
    "id": "gaia-vine_crawler",
    "map": "gaia",
    "type": "vine_crawler",
    "name": "Vine Crawler",
    "description": "Spreads vines as it moves."
  },
  {
    "id": "gaia-blossom",
    "map": "gaia",
    "type": "blossom",
    "name": "Blossom",
    "description": "Heals the boss and bursts to push you away."
  },
  {
    "id": "moon-mirror_mite",
    "map": "moon",
    "type": "mirror_mite",
    "name": "Mirror Mite",
    "description": "Defeating it heals you and helps locate the Queen."
  },
  {
    "id": "moon-moon_shade",
    "map": "moon",
    "type": "moon_shade",
    "name": "Shade",
    "description": "Attacks and pushes Ruby."
  },
  {
    "id": "moon-moon_hound",
    "map": "moon",
    "type": "moon_hound",
    "name": "Crystal Hound",
    "description": "Fast, with a knockback attack."
  },
  {
    "id": "moon-moon_mimic",
    "map": "moon",
    "type": "moon_mimic",
    "name": "Mimic",
    "description": "Disguises itself as an illusion and never attacks."
  },
  {
    "id": "venus-sand_scarab",
    "map": "venus",
    "type": "sand_scarab",
    "name": "Sand Scarab",
    "description": "Chases and bites you or Ruby."
  },
  {
    "id": "venus-dune_worm",
    "map": "venus",
    "type": "dune_worm",
    "name": "Dune Worm",
    "description": "Burrows after you and erupts with a knockback bite."
  },
  {
    "id": "venus-sand_scorpion",
    "map": "venus",
    "type": "sand_scorpion",
    "name": "Sand Scorpion",
    "description": "Hides underground, then strikes nearby players."
  },
  {
    "id": "saturn-frostbiter",
    "map": "saturn",
    "type": "frostbiter",
    "name": "Frostbiter",
    "description": "Leaps onto a marked tile, strips shields and knocks you back."
  },
  {
    "id": "saturn-sleet_mortar",
    "map": "saturn",
    "type": "sleet_mortar",
    "name": "Hailer",
    "description": "Bombards marked tiles and leaves ice."
  },
  {
    "id": "saturn-glacier_hulk",
    "map": "saturn",
    "type": "glacier_hulk",
    "name": "Glacier Hulk",
    "description": "Slams and freezes nearby ground."
  },
  {
    "id": "binary-lodestone",
    "map": "binary",
    "type": "lodestone",
    "name": "Lodestone",
    "description": "Pulls or pushes you and lunges."
  },
  {
    "id": "binary-pulsar",
    "map": "binary",
    "type": "pulsar",
    "name": "Pulsar",
    "description": "Leaves a magnetic field that explodes when it dies."
  },
  {
    "id": "binary-grounder",
    "map": "binary",
    "type": "grounder",
    "name": "Grounder",
    "description": "Nearby twins cannot be pushed or pulled."
  },
  {
    "id": "sirius-zealot",
    "map": "sirius",
    "type": "zealot",
    "name": "Zealot",
    "description": "Dashes in a straight line and knocks you far back."
  },
  {
    "id": "sirius-bellringer",
    "map": "sirius",
    "type": "bellringer",
    "name": "Bellringer",
    "description": "Its bell hurts you and pushes you away."
  },
  {
    "id": "sirius-mason",
    "map": "sirius",
    "type": "mason",
    "name": "Mason",
    "description": "Raises a stone wall in your path."
  },
  {
    "id": "sirius-penitent",
    "map": "sirius",
    "type": "penitent",
    "name": "Penitent",
    "description": "Follows and erases your trail."
  },
  {
    "id": "singularity-lost_soul",
    "map": "singularity",
    "type": "lost_soul",
    "name": "Soul",
    "description": "Swarm food. Dies in one hit and heals you."
  },
  {
    "id": "singularity-soulless",
    "map": "singularity",
    "type": "soulless",
    "name": "Soulless",
    "description": "Lunges, swipes and knocks you back."
  },
  {
    "id": "singularity-toxic_soulless",
    "map": "singularity",
    "type": "toxic_soulless",
    "name": "Contaminated Soulless",
    "description": "A Soulless that leaves a gas trail as it walks."
  },
  {
    "id": "neptune-shark",
    "map": "neptune",
    "portrait": "shark",
    "name": "Shark",
    "description": "Charges along a warned lane and knocks you aside."
  },
  {
    "id": "singularity-golden-soul",
    "map": "singularity",
    "type": "lost_soul",
    "variant": "golden",
    "name": "Golden Soul",
    "description": "Fills a Devourer’s stacks when eaten."
  }
];
