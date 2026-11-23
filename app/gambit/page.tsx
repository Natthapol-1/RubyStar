import { notFound } from 'next/navigation';
import RubyStarGame from '@/game/RubyStarGame';
// Star Gambit is still in development: release builds answer this route with the 404 page.
export default function Page(){if(process.env.NODE_ENV==='production')notFound();return <RubyStarGame mode="gambit"/>;}
