'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CutscenePlayer from './CutscenePlayer';
import RubyStarGame from './RubyStarGame';
import { arrivalSeen, canEnter, challengeCleared, getProfile, markArrivalSeen } from './profile';
import { challengeArrival } from './challenge-arrival';
import type { Trial } from './trials';

export default function ChallengeEntry({ trial }: { trial: Trial }) {
  const router = useRouter();
  const arrival = useMemo(() => challengeArrival(trial), [trial]);
  const [stage, setStage] = useState<'checking' | 'arrival' | 'challenge'>('checking');

  useEffect(() => {
    if (!canEnter('trial', trial.boss)) {
      router.replace('/challenge' + window.location.search);
      return;
    }
    const seen = arrivalSeen(trial.id);
    const alreadyVisited = seen || challengeCleared(trial.boss) || !!getProfile().resumes[trial.id];
    if (alreadyVisited) {
      if (!seen) markArrivalSeen(trial.id);
      setStage('challenge');
    } else {
      setStage('arrival');
    }
  }, [router, trial]);

  const enter = useCallback(() => {
    markArrivalSeen(trial.id);
    setStage('challenge');
  }, [trial.id]);

  if (stage === 'arrival') {
    return <CutscenePlayer {...arrival} onDone={enter} />;
  }
  if (stage === 'challenge') return <RubyStarGame mode="trial" trialId={trial.id} />;
  return <main style={{ minHeight: '100dvh', background: '#000' }} />;
}
