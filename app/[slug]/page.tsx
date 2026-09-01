import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CaseStudy } from '@/components/case-study';
import projects from '@/app/data/projects.json';

export function generateStaticParams() { return projects.map((project) => ({ slug: project.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};
  return { title: `${project.browserTitle} — curtis.is`, description: project.title };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  return <CaseStudy project={project as Parameters<typeof CaseStudy>[0]['project']} />;
}
