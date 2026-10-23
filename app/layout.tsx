import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'BingoLink — Short links',
  description: 'Private short links and helpful informational articles.',
  // Ownership verification only. This meta tag does not serve ads on protected routes.
  other: { 'google-adsense-account': 'ca-pub-4307435753931604' },
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
