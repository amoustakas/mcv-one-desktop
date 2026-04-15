import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCV Capital Launchpad',
  description: 'Open protocol for capital formation. Equity, token, and hybrid raises on the MCV Capital standard.',
  openGraph: {
    title: 'MCV Capital Launchpad',
    description: 'The new standard for capital formation.',
    url: 'https://launchpad.mcv.one',
    siteName: 'MCV Capital',
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
