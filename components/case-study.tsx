'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Block = { type: 'heading' | 'paragraph' | 'image' | 'video'; text?: string; source?: string; alt?: string };
type Project = { slug: string; title: string; hero: string; heroAlt: string; blocks: Block[] };

export function CaseStudy({ project }: { project: Project }) {
  const [lightbox, setLightbox] = useState<{ source: string; alt: string } | null>(null);
  useEffect(() => {
    if (!lightbox) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setLightbox(null);
    document.addEventListener('keydown', close);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = ''; };
  }, [lightbox]);

  return (
    <main className="case-study">
      <nav className="case-nav"><Link href="/#work"><ArrowLeft size={17} /> All work</Link><span>curtis.is</span></nav>
      <header className="case-hero">
        <div><p className="eyebrow">Selected product design work</p><h1>{project.title}</h1></div>
        <button className="hero-media" onClick={() => setLightbox({ source: project.hero, alt: project.heroAlt })} aria-label="Enlarge project image">
          <Image src={`/case-studies/${project.hero}`} fill sizes="100vw" alt={project.heroAlt || ''} priority />
        </button>
      </header>
      <article className="case-content">
        {project.blocks.map((block, index) => {
          if (block.type === 'heading') return <h2 key={index}>{block.text}</h2>;
          if (block.type === 'paragraph') return <p key={index}>{block.text}</p>;
          if (block.type === 'video') return <video className="case-video" key={index} src={`/case-studies/${block.source}`} controls playsInline />;
          if (block.type === 'image') return (
            <button className="case-image" key={index} onClick={() => setLightbox({ source: block.source!, alt: block.alt || '' })} aria-label={`Enlarge ${block.alt || 'project image'}`}>
              <Image src={`/case-studies/${block.source}`} width={1600} height={1000} sizes="(max-width: 900px) 100vw, 1100px" alt={block.alt || ''} />
            </button>
          );
          return null;
        })}
      </article>
      <div className="case-footer"><Link href="/#work"><ArrowLeft size={17} /> Back to all projects</Link></div>
      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Expanded project image" onClick={() => setLightbox(null)}>
          <button aria-label="Close image"><X /></button>
          <Image src={`/case-studies/${lightbox.source}`} width={2200} height={1500} alt={lightbox.alt} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </main>
  );
}
