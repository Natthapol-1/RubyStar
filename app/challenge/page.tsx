import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import StarMap from '@/game/StarMap';

async function readLore(world: 'Sun' | 'Moon' | 'Saturn' | 'Gaia' | 'Venus' | 'Binary Star' | 'Neptune' | 'Sirius' | 'Singularity' | 'Jupiter', fileStem = world.toUpperCase()) {
  const story = await readFile(join(process.cwd(), 'docs/ruby-star', `${fileStem}-LORE.md`), 'utf8');
  const [title, ...chapters] = story.trim().split(/\r?\n## /);
  return {
    world,
    title: title.replace(/^# /, '').trim(),
    chapters: chapters.map(chapter => {
      const [title, ...paragraphs] = chapter.trim().split(/(?:\r?\n){2,}/);
      return { title, paragraphs };
    }),
  };
}

export default async function Page() {
  const [sun, moon, saturn, gaia, venus, binary, neptune, sirius, singularity, jupiter] = await Promise.all([
    readLore('Sun'), readLore('Moon'), readLore('Saturn'), readLore('Gaia'), readLore('Venus'),
    readLore('Binary Star', 'BINARY'), readLore('Neptune'), readLore('Sirius'), readLore('Singularity'), readLore('Jupiter'),
  ]);
  return <StarMap loreByWorld={{ sun, moon, saturn, gaia, venus, binary, neptune, sirius, singularity, jupiter }} />;
}
