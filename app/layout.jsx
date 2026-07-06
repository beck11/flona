import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

// Editorial serif for display type, quiet grotesque for body copy.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Flona Kimia — Official',
  description:
    'Flona Kimia — artist and vocalist. A cinematic scroll journey through light, music and story.',
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  // Lets the stage extend under notches/home bars; safe-area insets in the
  // CSS keep the controls clear of them.
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
