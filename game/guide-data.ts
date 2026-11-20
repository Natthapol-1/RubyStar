import type {BossType,EnemyType} from './constants';
// Short description, plus the kill bonus (if any) shown on its own line as "Killing buff: ...".
export const aliens: { type: EnemyType; name: string; description: string; reward?: string }[] = [
  { type: 'normal', name: 'Normal', description: 'Chases you or Ruby.' },
  { type: 'armored', name: 'Armored', description: 'Tanky. Its hits knock you back.', reward: 'A small shield.' },
  { type: 'healer', name: 'Healer', description: 'Heals nearby aliens.', reward: 'Heals you.' },
  { type: 'fast', name: 'Runner', description: 'Fast and fragile. Its hits knock you back.', reward: 'A speed burst.' },
  { type: 'charger', name: 'Charger', description: 'Rushes in a straight line.', reward: 'Lots of extra energy.' },
  { type: 'sniper', name: 'Sniper', description: 'Charges a long-range shot.', reward: 'Your hits chain lightning for 5s.' },
  { type: 'ghost', name: 'Ghost', description: 'Moves through walls. Its hits knock you back.', reward: 'Heals Ruby.' },
  { type: 'shielder', name: 'Shielder', description: 'Shields another alien.', reward: 'Shields Ruby.' },
  { type: 'energy_leech', name: 'Leech', description: 'Steals your energy up close.', reward: 'Returns the stolen energy.' },
  { type: 'bomber', name: 'Bomber', description: 'Explodes up close or when killed, knocking you back.' },
  { type: 'splitter', name: 'Splitter', description: 'Splits in two when killed.' },
  { type: 'mini_splitter', name: 'Mini Splitter', description: 'Small and quick.' },
  { type: 'lancer', name: 'Lancer', description: 'Fires a beam along a shown line.', reward: 'Your lasers stun for 5s.' },
  { type: 'dropper', name: 'Dropper', description: 'Drops a weight from afar, knocking you back.', reward: 'Larger, stronger Waves with extra knockback and faster recharge for 5s.' },
  { type: 'shooter', name: 'Shooter', description: 'Fires slow shots that stun you.', reward: 'Your bullets stun and deal +30% damage for 5s.' },
  { type: 'reflector', name: 'Reflector', description: 'Reflects bullets and lasers. Waves, stuns, pushes and slows lower its mirror.', reward: 'Ruby copies your attacks for 5s.' },
  { type: 'trapper', name: 'Trapper', description: 'Plants mines that explode when you step on them.', reward: 'Your bullets explode for 5s.' },
  { type: 'snatcher', name: 'Snatcher', description: 'Steals a placed Ruby and runs off with it.', reward: 'Ruby comes back with a shield.' },
  { type: 'enchanter', name: 'Enchanter', description: 'Makes nearby enemies faster and stronger.', reward: '+25% damage and extra speed for 5s.' },
  { type: 'bleeder', name: 'Bleeder', description: 'Its hit stops your healing for a few seconds.', reward: 'Regenerate HP for 5s.' },
  { type: 'impostor', name: 'Impostor', description: 'Impersonates a boss but never attacks.', reward: 'A decoy that draws aliens.' },
  { type: 'blinker', name: 'Blinker', description: 'Killing it teleports you to a random place.' },
  { type: 'jammer', name: 'Jammer', description: 'Blocks teleporting while you are inside its interference field.', reward: 'Your next teleport releases a larger Wave and is ready again at once.' },
  { type: 'spook', name: 'Spook', description: 'Dies in one hit and briefly blocks your view.' },
  { type: 'grappler', name: 'Grappler', description: 'Fires a dodgeable hook that pulls you close.', reward: 'Immune to crowd control for 5s.' },
  { type: 'queen_echo', name: 'Queen Echo', description: 'Keeps shooting until killed.' },
];

export const bosses: Record<BossType, { description: string; skill: string }> = {
  fiery_king: {
    description: 'Grows stronger and faster over time. Keep hitting him to stop his arena blast.',
    skill: 'Burns all enemies. Kills give no energy.',
  },
  splitter_queen: {
    description: 'Teleports and leaves shooting copies. Kill her to clear them.',
    skill: 'A decoy draws attacks.',
  },
  storm_reaper: {
    description: 'Fast movement. Hunts you and seals hallways.',
    skill: 'Lightning damages and briefly slows nearby enemies.',
  },
  devourer: {
    description: 'Eats aliens to grow. Splits into copies when killed or ignored.',
    skill: 'Pulls enemies in and damages them.',
  },
  frost_warden: {
    description: 'Teleports to your chamber. Slows you, freezes tiles, and grants shield to allies.',
    skill: 'Shields you and Ruby.',
  },
  blind_prayer: {
    description: 'Reverses your controls and moves Ruby to another chamber. Blasts you back when cornered.',
    skill: 'Longer power boost. Refreshes abilities.',
  },
  sea_chanter: {
    description: 'Heals aliens. Dives when hurt. During a dive, hitting other aliens heals her. Hit her to stop the healing and deal extra damage.',
    skill: 'Heals you and Ruby. Pushes enemies away.',
  },
  thorn_weaver: {
    description: 'Casts slowing, poisonous thorns at you from anywhere. Grows a bigger field when you get close.',
    skill: 'A field that slows and damages enemies.',
  },
  aegis_sentinel: {
    description: 'Its shield reflects damage. Break both totems to break its shield and expose the core.',
    skill: 'Cuts damage to you and Ruby. Reflects attacks.',
  },
  astral_twins: {
    description: 'One fights close, one shoots from afar. Kill both within 12s or the fallen one revives.',
    skill: 'A twin by Ruby copies your attacks.',
  },
};

