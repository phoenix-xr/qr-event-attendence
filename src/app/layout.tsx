import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AccessGate • QR Admin Check-In & Verification Suite',
  description: 'High-speed QR code ticket scanner, live registration verification, and attendee management panel.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
