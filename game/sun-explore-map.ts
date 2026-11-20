import { TILE_SIZE } from './constants';

export const WORLD_SCALE = 2;
export const WORLD_WIDTH = 6400;
export const WORLD_HEIGHT = 4060;
export type Point = { x: number; y: number };
type Rect = Point & { w: number; h: number };
const tile = TILE_SIZE / WORLD_SCALE;
const edge = (value: number) => Math.round(value / tile) * tile;
export const tileCenter = (value: number) => Math.floor(value / tile) * tile + tile / 2;
const onTile = <T extends Point>(p: T) => ({ ...p, x: tileCenter(p.x), y: tileCenter(p.y) });
const tileRect = <T extends Rect>(r: T) => ({
  ...r, x: edge(r.x), y: edge(r.y),
  w: Math.max(tile, edge(r.x + r.w) - edge(r.x)), h: Math.max(tile, edge(r.y + r.h) - edge(r.y)),
});

export const AREAS = ([
  { name: 'Royal Solar Forge', x: 50, y: 175, w: 730, h: 772, color: '#f98145', surface: 'forge' },
  { name: 'North Reservoir', x: 844, y: 50, w: 1110, h: 430, color: '#92dbde', surface: 'reservoir' },
  { name: 'Sunbridge', x: 860, y: 557, w: 660, h: 455, color: '#ffc97e', surface: 'bridge' },
  { name: 'Ward Four', x: 1570, y: 444, w: 1510, h: 650, color: '#f2a2a4', surface: 'ward' },
  { name: 'Abandoned Ash Tunnel', x: 686, y: 1110, w: 1040, h: 780, color: '#dfa575', surface: 'ash' },
] as const).map(tileRect);

export const PASSAGES: Rect[] = [
  { x: 760, y: 675, w: 145, h: 114 },
  { x: 1119, y: 450, w: 126, h: 132 },
  { x: 1430, y: 675, w: 168, h: 114 },
  { x: 1108, y: 995, w: 132, h: 136 },
  { x: 1530, y: 322, w: 457, h: 72 },
  { x: 1909, y: 366, w: 78, h: 111 },
  { x: 383, y: 912, w: 89, h: 320 },
  { x: 433, y: 1149, w: 288, h: 83 },
  { x: 1452, y: 1202, w: 332, h: 82 },
  { x: 1702, y: 1068, w: 82, h: 169 },
  { x: 756, y: 484, w: 161, h: 75 },
  { x: 854, y: 453, w: 63, h: 80 },
  { x: 1710, y: 1650, w: 790, h: 76 },
  { x: 2430, y: 1075, w: 70, h: 585 },
].map(tileRect);

type StructureKind = 'forge' | 'tank' | 'house' | 'stack' | 'crate' | 'exchanger' | 'garden' | 'dock' | 'counter';
export const STRUCTURES = ([
  { kind:'forge', x: 200, y: 621, w: 297, h: 166 },
  { kind:'stack', x: 108, y: 500, w: 110, h: 94 },
  { kind:'exchanger', x: 353, y: 503, w: 215, h: 78 },
  { kind:'exchanger', x: 565, y: 804, w: 166, h: 93 },
  { kind:'crate', x: 133, y: 832, w: 105, h: 54 },
  { kind:'stack', x: 109, y: 656, w: 42, h: 85 },
  { kind:'tank', x: 886, y: 110, w: 210, h: 154 },
  { kind:'tank', x: 1288, y: 113, w: 226, h: 166 },
  { kind:'exchanger', x: 890, y: 349, w: 161, h: 78 },
  { kind:'exchanger', x: 1323, y: 345, w: 203, h: 93 },
  { kind:'dock', x: 1114, y: 599, w: 121, h: 106 },
  { kind:'garden', x: 927, y: 852, w: 135, h: 55 },
  { kind:'garden', x: 1281, y: 849, w: 136, h: 56 },
  { kind:'house', x: 1640, y: 504, w: 160, h: 114 },
  { kind:'house', x: 1826, y: 506, w: 161, h: 124 },
  { kind:'house', x: 2032, y: 498, w: 209, h: 121 },
  { kind:'house', x: 1618, y: 835, w: 170, h: 139 },
  { kind:'garden', x: 1880, y: 732, w: 143, h: 77 },
  { kind:'house', x: 1930, y: 879, w: 161, h: 149 },
  { kind:'house', x: 2116, y: 814, w: 153, h: 140 },
  { kind:'crate', x: 746, y: 1110, w: 103, h: 60 },
  { kind:'exchanger', x: 938, y: 1109, w: 199, h: 73 },
  { kind:'exchanger', x: 1223, y: 1286, w: 216, h: 71 },
  { kind:'stack', x: 753, y: 1286, w: 104, h: 66 },
  { kind:'forge', x: 126, y: 241, w: 318, h: 167 },
  { kind:'crate', x: 531, y: 247, w: 160, h: 96 },
  { kind:'stack', x: 580, y: 372, w: 108, h: 70 },
  { kind:'tank', x: 1605, y: 105, w: 277, h: 175 },
  { kind:'exchanger', x: 1660, y: 408, w: 165, h: 46 },
  { kind:'house', x: 2360, y: 498, w: 172, h: 137 },
  { kind:'house', x: 2575, y: 510, w: 179, h: 152 },
  { kind:'house', x: 2810, y: 493, w: 185, h: 150 },
  { kind:'garden', x: 2384, y: 741, w: 245, h: 93 },
  { kind:'garden', x: 2730, y: 747, w: 249, h: 88 },
  { kind:'house', x: 2555, y: 894, w: 180, h: 125 },
  { kind:'house', x: 2795, y: 872, w: 202, h: 147 },
  { kind:'crate', x: 761, y: 1460, w: 228, h: 99 },
  { kind:'stack', x: 1350, y: 1440, w: 260, h: 123 },
  { kind:'exchanger', x: 1000, y: 1600, w: 280, h: 127 },
  { kind:'stack', x: 733, y: 1730, w: 201, h: 90 },
  { kind:'crate', x: 1450, y: 1780, w: 160, h: 76 },
  { kind:'counter', x: 2470, y: 665, w: 122, h: 30 },
  { kind:'garden', x: 2980, y: 690, w: 65, h: 71 },
] satisfies (Rect & { kind: StructureKind })[]).map(tileRect);

export const START = { x: WORLD_SCALE * tileCenter(1175), y: WORLD_SCALE * tileCenter(753) };
export const SITES = ([
  { id: 'mara', name: 'Mara', x: 1010, y: 721, kind: 'person' },
  { id: 'crown', name: 'Paper Crown', x: 960, y: 798, kind: 'crown' },
  { id: 'statue', name: 'King’s Statue', x: 1344, y: 646, kind: 'statue' },
  { id: 'bell', name: 'Shift Bell', x: 1345, y: 770, kind: 'bell' },
  { id: 'memory', name: 'First Winter', x: 159, y: 609, kind: 'disc' },
  { id: 'register', name: 'Shift Register', x: 596, y: 561, kind: 'book' },
  { id: 'proposal', name: 'Council Notice', x: 681, y: 501, kind: 'paper' },
  { id: 'glove', name: 'Old Glove', x: 302, y: 857, kind: 'glove' },
  { id: 'lever', name: 'Shutdown Lever', x: 545, y: 652, kind: 'lever' },
  { id: 'blueprint', name: 'Blueprint', x: 878, y: 1150, kind: 'paper' },
  { id: 'pipes', name: 'Salvaged Pipes', x: 931, y: 1315, kind: 'pipe' },
  { id: 'socket', name: 'Ruby Socket', x: 1106, y: 1250, kind: 'socket' },
  { id: 'nest', name: 'Wisp Nest', x: 1358, y: 1136, kind: 'wisp' },
  { id: 'lyra', name: 'Lyra', x: 2180, y: 983, kind: 'person' },
  { id: 'tap', name: 'Last Heating Tap', x: 2227, y: 1001, kind: 'pipe' },
  { id: 'pell', name: 'Pell', x: 1810, y: 682, kind: 'person' },
  { id: 'tube', name: 'Speaking Tube', x: 2066, y: 706, kind: 'tube' },
  { id: 'king', name: 'Fiery King', x: 1171, y: 219, kind: 'king' },
  { id: 'tavi', name: 'Tavi', x: 1243, y: 252, kind: 'person' },
  { id: 'gauge', name: 'Reservoir Gauge', x: 1157, y: 319, kind: 'gauge' },
  { id: 'button', name: 'Button’s Spoon', x: 1450, y: 305, kind: 'spoon' },
  { id: 'petitions', name: 'Repair Petition', x: 1450, y: 951, kind: 'paper' },
  { id: 'volunteers', name: 'First Winter Roster', x: 483, y: 377, kind: 'book' },
  { id: 'coolantLog', name: 'Coolant Log', x: 1700, y: 298, kind: 'book' },
  { id: 'letter', name: 'Letter to Tavi', x: 2850, y: 850, kind: 'paper' },
  { id: 'jointNote', name: 'Pressure Test Log', x: 1320, y: 1740, kind: 'book' },
  { id: 'lunch', name: 'Lunch Counter', x: 2525, y: 713, kind: 'paper' },
  { id: 'cook', name: 'Bex', x: 2464, y: 710, kind: 'person' },
  { id: 'lunchGuest', name: 'Orrin', x: 2370, y: 697, kind: 'person' },
  { id: 'scarlet', name: 'Nemi', x: 2760, y: 703, kind: 'person' },
  { id: 'crimson', name: 'Rusk', x: 2830, y: 703, kind: 'person' },
  { id: 'lostFound', name: 'Lost and Found', x: 909, y: 934, kind: 'paper' },
  { id: 'toolRack', name: 'Borrowed Tools', x: 1494, y: 1615, kind: 'lever' },
  { id: 'archiveWinter', name: 'I · The First Winter', x: 111, y: 440, kind: 'book' },
  { id: 'archiveBridge', name: 'II · At the Gate', x: 1288, y: 955, kind: 'book' },
  { id: 'archiveReservoir', name: 'III · The Little Lights', x: 1820, y: 356, kind: 'book' },
  { id: 'archiveTunnel', name: 'IV · Six Hours', x: 1046, y: 1796, kind: 'book' },
  { id: 'archiveWard', name: 'V · Tomorrow', x: 2737, y: 1019, kind: 'book' },
] as const).map(onTile);

export type SiteId = typeof SITES[number]['id'];
export type Site = Omit<typeof SITES[number], 'x' | 'y'> & Point;
export const isDocument = (site: Site) => site.kind === 'paper' || site.kind === 'book';

export const TAVI_HOME = onTile({ x: 2145, y: 1009 });
export const COOLING_SCENE = { x: WORLD_SCALE * tileCenter(1203), y: WORLD_SCALE * tileCenter(306) };

export function nextSunTile(p: Point, direction: Point) {
  const x = p.x + direction.x * TILE_SIZE;
  const y = p.y + direction.y * TILE_SIZE;
  return [.25, .5, .75, 1].every(fraction =>
    walkable(p.x + (x - p.x) * fraction, p.y + (y - p.y) * fraction)) ? { x, y } : null;
}

const surfaces = [...AREAS, ...PASSAGES];
export const contains = (r: Rect, x: number, y: number) =>
  x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;

export function walkable(x: number, y: number) {
  const px = x / WORLD_SCALE, py = y / WORLD_SCALE;
  return surfaces.some(r => contains(r, px, py))
    && [[-5, -5], [5, -5], [-5, 5], [5, 5]].every(([dx, dy]) =>
      surfaces.some(r => contains(r, px + dx, py + dy))
      && !STRUCTURES.some(r => contains(r, px + dx, py + dy)));
}

// Project the same floor tiles the player can enter, including gaps around machinery.
export function sunMinimapPaths() {
  const size = TILE_SIZE / WORLD_SCALE;
  const paths = Array<string>(AREAS.length + 1).fill('');
  for (let y = 0; y < WORLD_HEIGHT / WORLD_SCALE; y += size) {
    let runStart = 0;
    let previous = -1;
    for (let x = 0; x <= WORLD_WIDTH / WORLD_SCALE + size; x += size) {
      const cx = x + size / 2, cy = y + size / 2;
      const area = walkable(cx * WORLD_SCALE, cy * WORLD_SCALE)
        ? AREAS.findIndex(r => contains(r, cx, cy)) + 1 : -1;
      if (area === previous) continue;
      if (previous >= 0) paths[previous] += `M${runStart} ${y}h${x - runStart}v${size}H${runStart}Z`;
      runStart = x;
      previous = area;
    }
  }
  return paths;
}

