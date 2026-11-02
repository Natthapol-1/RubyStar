import type {BossType,EnemyType} from './constants';
export const aliens: { type: EnemyType; name: string; description: string }[] = [
  { type: 'frost_raider', name: 'Snowbowl', description: 'Rolls at you to steal your shield. Dodge sideways.' },
  { type: 'ice_caller', name: 'Frosticle', description: 'Marks your position, then drops an icicle. Leaves frozen floor.' },
  { type: 'rime_brute', name: 'Ice Cub', description: 'A fast ice cube. Close hits immediately shove you toward dangerous ice.' },
  { type: 'normal', name: 'Normal', description: 'Chases you or Ruby.' },
  { type: 'armored', name: 'Armored', description: 'Tough. Drops a shield.' },
  { type: 'fast', name: 'Runner', description: 'Fast and fragile. Extra energy.' },
  { type: 'bomber', name: 'Bomber', description: 'Explodes up close or on death.' },
  { type: 'sniper', name: 'Sniper', description: 'Charges a long shot. Drops chain lightning.' },
  { type: 'healer', name: 'Healer', description: 'Heals aliens. Kill it to heal.' },
  { type: 'charger', name: 'Charger', description: 'Marks a lane, then rushes. Dodge sideways. Drops a speed burst.' },
  { type: 'ghost', name: 'Ghost', description: 'Moves through walls. Kill it to heal Ruby.' },
  { type: 'splitter', name: 'Splitter', description: 'Splits in two on death.' },
  { type: 'mini_splitter', name: 'Mini Splitter', description: 'Small and quick.' },
  { type: 'shielder', name: 'Shielder', description: 'Shields another alien. Drops a Ruby shield.' },
  { type: 'energy_leech', name: 'Energy Leech', description: 'Steals energy up close. Kill it to get it back.' },
  { type: 'queen_echo', name: 'Queen Echo', description: 'Keeps shooting until killed.' },
];

export const bosses: Record<BossType, { description: string; skill: string }> = {
  fiery_king: {
    description: 'Grows stronger over time. Keep hitting him to stop his arena blast.',
    skill: 'Burns all enemies. Kills give no energy.',
  },
  splitter_queen: {
    description: 'Teleports and leaves shooting copies. Kill her to clear them.',
    skill: 'A decoy draws attacks.',
  },
  storm_reaper: {
    description: 'Hunts you and seals hallways. Keep moving.',
    skill: 'Lightning damages and briefly slows nearby enemies.',
  },
  devourer: {
    description: 'Eats aliens to grow. Splits into copies when killed or ignored. Kill every copy.',
    skill: 'Pulls enemies in and damages them.',
  },
  frost_warden: {
    description: 'Slows you, freezes tiles and shields aliens from meteors.',
    skill: 'Shields you and Ruby.',
  },
  blind_prayer: {
    description: 'Reverses your controls, moves Ruby and blasts you back when cornered.',
    skill: 'Longer power boost. Refreshes abilities.',
  },
  sea_chanter: {
    description: 'Heals aliens. Dives when hurt; hitting other aliens then heals her. Hit her underwater for extra damage.',
    skill: 'Heals you and Ruby. Pushes enemies away.',
  },
  thorn_weaver: {
    description: 'Leaves slowing, poisonous thorns. Grows a bigger field when you get close.',
    skill: 'A field that slows and damages enemies.',
  },
  aegis_sentinel: {
    description: 'Break both pylons to expose its core. Its shield reflects damage.',
    skill: 'Cuts damage to you and Ruby. Reflects attacks.',
  },
  astral_twins: {
    description: 'One fights close, one shoots. Kill both within 12s or the fallen one revives.',
    skill: 'A twin by Ruby copies your attacks.',
  },
};

