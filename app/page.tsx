'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Mail, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const principles = [
  ['icon-1.svg', 'Catalyst', 'Creating team synergy, strengthening brand awareness, and growing the skills of the people around me.'],
  ['icon-3.svg', 'User Evangelist', 'Making the user’s voice present in every product decision, from early discovery through adoption.'],
  ['icon-2.svg', 'Solver', 'Turning research, data, and market validation into thoughtful, proven product execution.'],
  ['icon-5.svg', 'North Star Guide', 'Defining an ambitious future state while aligning product, design, and business goals.'],
];

const projects = [
  { slug: 'work-1', image: 'card-tr-720x540@2x.png', title: 'IoT, Spatial Logistics and Healthcare through ML/AI', type: 'AI · IoT · Healthcare' },
  { slug: 'work-2', image: 'cards-cont@2x.png', title: 'AI Remediation for Cyber Attacks', type: 'AI · Cybersecurity' },
  { slug: 'work-3', image: 'card-refresh@2x.png', title: 'Jasper SaaS/Mobile', type: 'Design leadership · SaaS', note: 'Led to acquisition by Cisco' },
  { slug: 'work-4', image: 'cards-or-optimized@2x.png', title: 'Unique Visibility for Cloud Data', type: 'Cloud security · Platform' },
  { slug: 'work-5', image: 'cards-720x540-op@2x.png', title: 'AI-Supported Health & Nutrition', type: 'AI · Computer vision · Health' },
  { slug: 'work-6', image: 'work1-720x540.png', title: 'Jasper Mobile Status & Usage', type: 'Mobile · IoT' },
  { slug: 'work-7', image: 'card-cj-marketplace@2x.png', title: 'Cisco Marketplace for Third-Party Apps', type: 'Marketplace · Platform' },
  { slug: 'work-8', image: 'cards-jw-ipad-app-optimized.png', title: 'iPad Customer Management App', type: 'Tablet · Enterprise' },
  { slug: 'work-9', image: 'card-safehd-optimized.png', title: 'Rideshare Financial Management', type: 'Mobile · Fintech' },
  { slug: 'work-10', image: 'card-lbs@2x.png', title: 'Fleet Tracking & Location Services', type: 'IoT · Logistics' },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="curtis.is home">
          <Image src="/portfolio/logo_lettering2.svg" width={122} height={38} alt="curtis.is" priority />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#process">Process</a><a href="#work">Work</a><a href="#contact">Contact</a>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
      </header>

      {menuOpen && (
        <div className="menu-overlay" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="menu-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X /></button>
          {['process', 'work', 'contact'].map((item) => <a key={item} href={`#${item}`} onClick={() => setMenuOpen(false)}>{item}</a>)}
        </div>
      )}

      <section className="hero" id="top">
        <p className="eyebrow">Product design leadership · AI-enabled experiences</p>
        <h1>Design leader.<br />Team builder.<br /><span>User evangelist.</span></h1>
        <p className="hero-copy">I design intuitive, scalable experiences where AI and agent workflows support faster decisions, deeper insight, and more valuable outcomes.</p>
        <a className="explore-link" href="#process">Explore the work <ArrowDown size={17} /></a>
      </section>

      <section className="process-section" id="process">
        <div className="section-heading"><p className="eyebrow">How I lead</p><h2>Clarity for complex products.</h2></div>
        <div className="principles-grid">
          {principles.map(([icon, title, copy], index) => (
            <article className="principle" key={title}>
              <div className="principle-top"><Image src={`/portfolio/${icon}`} width={48} height={48} alt="" /><span>0{index + 1}</span></div>
              <h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="work-section" id="work">
        <div className="section-heading work-heading">
          <div><p className="eyebrow">Selected product design work</p><h2>Systems, services, and experiences.</h2></div>
          <p>Recent healthcare, medical, and scientific projects are available privately upon request.</p>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <Link className="project-card" href={`/${project.slug}`} key={project.slug}>
              <div className="project-image"><Image src={`/portfolio/${project.image}`} fill sizes="(max-width: 760px) 100vw, 50vw" alt="" /></div>
              <div className="project-meta"><p>{project.type}</p><ArrowUpRight size={19} /></div>
              <h3>{project.title}</h3>{project.note && <span className="project-note">{project.note}</span>}
            </Link>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <p className="eyebrow">Let’s make something valuable</p>
        <h2>Have a complex product challenge?</h2>
        <a href="mailto:curtis@curtis.is">curtis@curtis.is <Mail size={25} /></a>
      </section>

      <footer><span>curtis.is</span><p>Product Design · Interaction · User Experience</p><p>© {new Date().getFullYear()} Curtis Hall</p></footer>
    </main>
  );
}
