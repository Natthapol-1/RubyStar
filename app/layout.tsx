import type { Metadata } from 'next';
import './globals.css';
import DisableContextMenu from '@/components/DisableContextMenu';
export const metadata:Metadata={title:'Ruby Star',description:'Protect Ruby. Survive the stars. A neon survival game with celestial boss challenges.',appleWebApp:{capable:true,title:'Ruby Star',statusBarStyle:'black-translucent'}};
export const viewport={width:'device-width',initialScale:1,maximumScale:1,userScalable:false};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning><DisableContextMenu/>{children}</body></html>;}
