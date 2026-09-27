import { Portfolio } from '@/components/portfolio';
import original from '@/app/data/original.json';

export function generateStaticParams() {
  return original.projects.map(project=>({slug:project.slug}));
}

export default async function SignalProjectPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  return <Portfolio initialSlug={slug} variant="signal" />;
}
