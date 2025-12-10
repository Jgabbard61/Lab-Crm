
import type { Metadata } from 'next';
// ✅ BUILD FIX: Commented out Google Fonts to prevent build failures when network is unavailable
// import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'Patient CRM - Clinical Laboratory Management',
  description: 'Comprehensive Patient CRM system for clinical medical laboratory with PCR and Genetic testing',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Patient CRM - Clinical Laboratory Management',
    description: 'Comprehensive Patient CRM system for clinical medical laboratory',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
