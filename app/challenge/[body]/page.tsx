import { notFound, redirect } from 'next/navigation';
import ChallengeEntry from '@/game/ChallengeEntry';
import { TRIALS, findTrial } from '@/game/trials';

export function generateStaticParams() { return TRIALS.map(trial => ({ body: trial.id })); }

// A challenge world. Locked (not yet built) challenges send you back to the star map.
export default async function CelestialTrialPage({ params }: { params: Promise<{ body: string }> }) {
  const { body } = await params;
  const trial = findTrial(body);
  if (!trial) notFound();
  if (!trial.ready) redirect('/challenge');
  return <ChallengeEntry key={trial.id} trial={trial} />;
}
