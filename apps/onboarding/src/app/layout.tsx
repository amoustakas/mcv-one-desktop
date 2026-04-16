import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCV — Welcome',
  description: 'Meet the specialists running the MCV ecosystem. Your dedicated team starts here.',
  openGraph: {
    title: 'MCV — Welcome',
    description: 'Your first conversation with the team that runs the MCV ecosystem.',
    url: 'https://onboarding.mcv.one',
    siteName: 'MCV',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
