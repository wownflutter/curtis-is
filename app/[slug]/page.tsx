import { notFound } from 'next/navigation';
import { Portfolio } from '@/components/portfolio';
import original from '@/app/data/original.json';
export function generateStaticParams() { return original.projects.map(({slug}) => ({slug})); }
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }) {
  const {slug} = await params;
  return {title: `${original.projects.find(p => p.slug === slug)?.title || 'Portfolio'} — curtis.is`};
}
export default async function ProjectPage({params}: {params:Promise<{slug:string}>}) {
  const {slug} = await params;
  if (!original.projects.some(p=>p.slug === slug)) notFound();
  return <Portfolio initialSlug={slug} />;
}
