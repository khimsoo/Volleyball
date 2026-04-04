import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VolleyTrainer — Coach Dashboard',
  description: 'Professional volleyball performance and training management platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-950 text-white antialiased">{children}</body>
    </html>
  );
}
