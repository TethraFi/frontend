// src/app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import { Providers } from './providers';
import { SidebarProvider } from './contexts/SidebarContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tethra DEX',
  description: 'Decentralized Exchange with Advanced Trading Features',
  openGraph: {
    title: 'Tethra DEX',
    description: 'Decentralized Exchange with Advanced Trading Features',
    url: 'https://tethradex.vercel.app',
    siteName: 'Tethra DEX',
    images: [
      {
        url: '/images/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'Tethra DEX Banner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tethra DEX',
    description: 'Decentralized Exchange with Advanced Trading Features',
    images: ['/images/og-banner.png'],
    creator: '@tethradex',
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://tethradex.vercel.app/api/frame/image?view=main',
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:post_url': 'https://tethradex.vercel.app/api/frame',
    'fc:frame:button:1': '📊 Chart',
    'fc:frame:button:1:action': 'post',
    'fc:frame:button:1:target': 'https://tethradex.vercel.app/api/frame?action=chart',
    'fc:frame:button:2': '🔗 Connect',
    'fc:frame:button:2:action': 'post',
    'fc:frame:button:2:target': 'https://tethradex.vercel.app/api/frame?action=connect',
    'fc:frame:button:3': '💰 Claim USDC',
    'fc:frame:button:3:action': 'post',
    'fc:frame:button:3:target': 'https://tethradex.vercel.app/api/frame?action=claim',
    'fc:frame:button:4': '🪙 Coins',
    'fc:frame:button:4:action': 'post',
    'fc:frame:button:4:target': 'https://tethradex.vercel.app/api/frame?action=coins',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 0.5,
  maximumScale: 3,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <head>
        <link rel="icon" href="/images/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}