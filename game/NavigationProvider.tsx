'use client';
import { createContext, useCallback, useContext, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from './LoadingScreen';

type Router = ReturnType<typeof useRouter>;
const NavigationContext = createContext<Router | null>(null);

export function useLoadingRouter(): Router {
 const router = useContext(NavigationContext);
 if (!router) throw new Error('NavigationProvider is missing');
 return router;
}

export default function NavigationProvider({ children }: { children: React.ReactNode }) {
 const router = useRouter();
 const [queued, setQueued] = useState(false);
 const [pending, startTransition] = useTransition();
 const scheduled = useRef(false);
 const navigate = useCallback((action: () => void) => {
  if (scheduled.current) return;
  scheduled.current = true;
  setQueued(true);
  // Let the loading overlay paint before fetching/evaluating a cold route or mounting its game.
  requestAnimationFrame(() => requestAnimationFrame(() => {
   scheduled.current = false;
   startTransition(() => { action(); setQueued(false); });
  }));
 }, []);
 const loadingRouter = useMemo<Router>(() => ({
  ...router,
  push: (href, options) => navigate(() => router.push(href, options)),
  replace: (href, options) => navigate(() => router.replace(href, options)),
  back: () => navigate(() => router.back()),
  forward: () => navigate(() => router.forward()),
 }), [router, navigate]);
 return <NavigationContext.Provider value={loadingRouter}>{children}{(queued || pending) && <LoadingScreen/>}</NavigationContext.Provider>;
}
