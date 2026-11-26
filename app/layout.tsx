import type { Metadata, Viewport } from 'next';
import { Figtree, Marcellus } from 'next/font/google';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { WhatsAppFab } from '@/components/WhatsAppButton';
import './globals.css';

const display = Marcellus({ subsets: ['latin'], weight: '400', variable: '--display' });
const text = Figtree({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--text' });

export const metadata: Metadata = {
  title: { default: 'Joy World of Rice, Gurugram', template: '%s | Joy World of Rice' },
  description: 'Basmati, regional, golden sella and heritage rice from Gurugram. See every variety by its grain.',
  icons: { icon: '/logo.webp' },
};
export const viewport: Viewport = { themeColor: '#4B3832' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-scroll-behavior="smooth" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <body><Header /><main>{children}</main><Footer /><WhatsAppFab /></body>
    </html>
  );
}
