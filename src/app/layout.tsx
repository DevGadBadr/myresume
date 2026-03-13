import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gad Badr — Resume Editor',
  description: 'Interactive resume editor for Gad Badr Saad Sanad',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
