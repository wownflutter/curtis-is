import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'curtis.is — Product Design Leadership',
  description: 'Curtis Hall designs intuitive, scalable product experiences for AI, enterprise, healthcare, and connected products.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="no-touch"><body>{children}</body></html>;
}
