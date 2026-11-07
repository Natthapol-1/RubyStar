import type {BossType,EnemyType} from './constants';
// Short description, plus the kill bonus (if any) shown on its own line as "Killing buff: ...".
export const aliens: { type: EnemyType; name: string; description: string; reward?: string }[] = [
  { type: 'normal', name: 'Normal', description: 'Chases you or Ruby.' },
  { type: 'armored', name: 'Armored', description: 'Tough. Its hits knock you back.', reward: 'A small shield.' },
  { type: 'fast', name: 'Runner', description: 'Fast and fragile. Its hits knock you back.', reward: 'A speed burst.' },
  { type: 'bomber', name: 'Bomber', description: 'Explodes up close or when killed, knocking you back.' },
  { type: 'sniper', name: 'Sniper', description: 'Charges a long-range shot.', reward: 'Your hits chain lightning for 5s.' },
  { type: 'healer', name: 'Healer', description: 'Heals nearby aliens.', reward: 'Heals you.' },
  { type: 'charger', name: 'Charger', description: 'Marks a lane, then rushes. Dodge sideways.', reward: 'Extra energy.' },
  { type: 'ghost', name: 'Ghost', description: 'Moves through walls. Its hits knock you back.', reward: 'Heals Ruby.' },
  { type: 'splitter', name: 'Splitter', description: 'Splits in two when killed.' },
  { type: 'mini_splitter', name: 'Mini Splitter', description: 'Small and quick.' },
  { type: 'shielder', name: 'Shielder', description: 'Shields another alien.', reward: 'Shields Ruby.' },
  { type: 'lancer', name: 'Lancer', description: 'Fires a beam along a shown line. Step aside.', reward: 'Your lasers stun for 5s.' },
  { type: 'energy_leech', name: 'Leech', description: 'Steals your energy up close.', reward: 'Returns the stolen energy.' },
  { type: 'shooter', name: 'Shooter', description: 'Fires slow shots that stun you. They fly until they hit a wall.', reward: 'Your bullets stun and deal +30% damage for 5s.' },
  { type: 'enchanter', name: 'Enchanter', description: 'Makes nearby enemies faster and stronger.', reward: '+20% damage for 5s.' },
  { type: 'bleeder', name: 'Bleeder', description: 'Its hit stops your healing for a few seconds.', reward: 'Regenerate HP for 5s.' },
  { type: 'snatcher', name: 'Snatcher', description: 'Steals a placed Ruby and runs off with her.', reward: 'Ruby comes back with a shield.' },
  { type: 'impostor', name: 'Impostor', description: 'Looks like a boss but never attacks.', reward: 'A decoy that draws aliens.' },
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

