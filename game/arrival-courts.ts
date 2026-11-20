import type { TrialBody } from './trials';

// '.' floor, '#' cover, space open scenery. Each court is framed on the
// same 16-column stage so the renderer can use the regular world tile art.
export const ARRIVAL_COURTS = {
  // Stepped ruin with a broad central stair and flanking monuments.
  venus: [
    '    ##....##    ',
    '  ###......###  ',
    '  #..........#  ',
    ' #..#......#..# ',
    ' #............# ',
    ' ##..........## ',
    '    ........    ',
    '    ........    ',
    '    ........    ',
  ],
  // An irregular clearing broken by mossy outcrops and roots.
  gaia: [
    '   ###.......#  ',
    '  ##..........# ',
    ' #............##',
    ' #..#.......### ',
    ' ##............ ',
    '  #...........# ',
    ' ##.........##  ',
    ' #..........#   ',
    '  ###.....##    ',
  ],
  // Crystal jaws framing an open cavern mouth.
  moon: [
    '     #....#     ',
    '    #......#    ',
    '  ##........##  ',
    ' ##..........## ',
    '##............##',
    '#..............#',
    '##............##',
    '  #.........##  ',
    '    #......#    ',
  ],
  // Storm station with engine nacelles and narrow maintenance aisles.
  jupiter: [
    '    ##....##    ',
    '##............##',
    '#..............#',
    '#.##........##.#',
    '................',
    '#.##........##.#',
    '#..............#',
    '##............##',
    '    ##....##    ',
  ],
  // Glacial shelf with a fractured edge and exposed dark water.
  saturn: [
    '       ...##    ',
    '    ........##  ',
    '  ##..........# ',
    ' ##............#',
    ' #...........## ',
    '##.........##   ',
    '#..........#    ',
    '##.........##   ',
    '   ....###      ',
  ],
  // Reef ledges shelter a deep channel, open on opposing sides.
  neptune: [
    '####.......     ',
    '###.........    ',
    '##............  ',
    '#....#........  ',
    ' .............. ',
    '  ........#....#',
    '  ............##',
    '    .........###',
    '     .......####',
  ],
  // Processional aisle and small side chapels.
  sirius: [
    '  ##........##  ',
    '  #..........#  ',
    '###..........###',
    ' ..#........#.. ',
    '   ..........   ',
    ' ..#........#.. ',
    '###..........###',
    '   ..........   ',
    '    ........    ',
  ],
  // Paired platforms connected across a visible central seam.
  binary: [
    '##.....  .....##',
    '#..............#',
    '#..............#',
    ' ......  ...... ',
    '##............##',
    '##............##',
    ' ......  ...... ',
    '#..............#',
    '##.....  .....##',
  ],
  // Broken platform pulled toward the maw, with detached debris.
  singularity: [
    '  #    ...  #   ',
    '     #......#   ',
    ' #  #.........  ',
    '   #..........# ',
    '    ..........##',
    '   #........... ',
    '  #.........##  ',
    ' ##........#   #',
    '   ###...#      ',
  ],
} satisfies Record<Exclude<TrialBody, 'sun'>, readonly string[]>;
