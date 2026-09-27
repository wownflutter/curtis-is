import type { Metadata } from 'next';
import { Portfolio } from '@/components/portfolio';

export const metadata: Metadata = {
  title: 'Signal concept — curtis.is',
  description: 'Curtis Hall turns real-world signals into experiences people and agents can understand and act on.',
};

export default function SignalConceptPage() {
  return <Portfolio variant="signal" />;
}
