'use client';
/* oxlint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/media-has-caption, next/no-img-element -- delegated events preserve the original nested markup; the embedded animation videos contain no audio track. */

import { createElement, useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { Globe2, Hammer, Handshake } from 'lucide-react';
import original from '@/app/data/original.json';
import mediaSizes from '@/app/data/media-sizes.json';

const imageSizes:Record<string,{width:number;height:number}>=mediaSizes;
function MediaImage({attributes}:{attributes:Record<string,unknown>}) {
  const [arrived,setArrived]=useState(false);
  const ref=useRef<HTMLImageElement>(null);
  useEffect(()=>{if(ref.current?.complete)setArrived(true);},[]);
  const src=typeof attributes.src==='string'?attributes.src:'';
  return createElement('img',{...imageSizes[src],...attributes,ref,
    className:`${typeof attributes.className==='string'?attributes.className:''} quiet-media ${arrived?'media-arrived':''}`,
    onLoad:()=>setArrived(true),onError:()=>setArrived(true)});
}

type ContentNode = string | {tag:string; props:Record<string,unknown>; children:ContentNode[]};

function videoSource(children:ContentNode[]):string {
  const source=children.find((child):child is Exclude<ContentNode,string>=>typeof child!=='string' && child.tag==='source');
  return typeof source?.props.src==='string' ? source.props.src : '';
}

function MediaVideo({attributes,nodeChildren,keyName}:{attributes:Record<string,unknown>;nodeChildren:ContentNode[];keyName:string}) {
  const ref=useRef<HTMLVideoElement>(null);
  const cursorRef=useRef<HTMLSpanElement>(null);
  const glanceRef=useRef<HTMLSpanElement>(null);
  const source=videoSource(nodeChildren);
  const isExplorer=source==='/case-studies/explorer-animation.mp4';
  const isTrackonomy=source.startsWith('/case-studies/tr-') && source.endsWith('.mp4');
  const isDesignSystem=source==='/case-studies/cont-ds.mp4';
  const poster=source==='/case-studies/explorer-animation.mp4'
    ? '/case-studies/explorer-animation-poster.webp'
    : undefined;
  const renderedChildren=(isExplorer || isTrackonomy || isDesignSystem) ? nodeChildren.map(child=>
    typeof child!=='string' && child.tag==='source'
      ? {...child,props:{...child.props,src:`${source}?v=${isExplorer?'7':'2'}`}}
      : child
  ) : nodeChildren;

  useEffect(()=>{
    const video=ref.current;
    if(!video)return;
    const cursor=cursorRef.current;
    const glance=glanceRef.current;
    let syncFrame=0;
    let warmed=false;
    const warm=()=>{
      if(warmed)return;
      warmed=true;
      video.preload='auto';
      video.load();
    };
    const preloader=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)) {
        warm();
        preloader.disconnect();
      }
    },{rootMargin:(isTrackonomy || isDesignSystem)?'1800px 0px':'1000px 0px',threshold:0});
    const player=new IntersectionObserver(entries=>{
      const visible=entries.some(entry=>entry.isIntersecting);
      if(visible && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        warm();
        void video.play().catch(()=>{});
      } else {
        video.pause();
      }
    },{threshold:0.05});
    preloader.observe(video);
    player.observe(video);
    const syncCursor=()=>{
      [cursor,glance].forEach(element=>{
        if(!element)return;
        element.style.animationDelay=`-${video.currentTime}s`;
        element.style.animationPlayState='paused';
      });
      if(!video.paused)syncFrame=requestAnimationFrame(syncCursor);
    };
    const startCursorSync=()=>{
      cancelAnimationFrame(syncFrame);
      syncCursor();
    };
    video.addEventListener('play',startCursorSync);
    video.addEventListener('seeked',syncCursor);
    video.addEventListener('pause',syncCursor);
    syncCursor();
    return ()=>{
      preloader.disconnect();
      player.disconnect();
      video.removeEventListener('play',startCursorSync);
      video.removeEventListener('seeked',syncCursor);
      video.removeEventListener('pause',syncCursor);
      cancelAnimationFrame(syncFrame);
      video.pause();
    };
  },[source,isTrackonomy,isDesignSystem]);

  const video=<video {...attributes} ref={ref} autoPlay={false} preload="metadata" poster={poster}>
    {renderChildren(renderedChildren,keyName)}
  </video>;
  if(!isExplorer)return video;
  return <span className="explorer-video-stage">
    {video}
    <span ref={cursorRef} className="explorer-demo-cursor" aria-hidden="true">
      <svg viewBox="0 0 24 28" focusable="false">
        <path d="M2 1.5v21.4l5.7-5.4 4.1 8.8 4-1.9-4.1-8.5h8.1L2 1.5Z" />
      </svg>
    </span>
    <span ref={glanceRef} className="explorer-at-a-glance" aria-hidden="true">
      <span className="explorer-at-a-glance-title">
        <svg viewBox="0 0 28 28" focusable="false">
          <rect x="3.5" y="4" width="21" height="15" rx="2" />
          <path d="M10 24h8M14 19v5" />
        </svg>
        <strong>Scheduler App</strong>
      </span>
      <span className="explorer-at-a-glance-grid">
        <span>Language</span><b>Java</b>
        <span>Issues</span><b>14</b>
        <span>Incidents</span><b>3</b>
      </span>
    </span>
  </span>;
}

const content = original as unknown as {home:ContentNode;projects:{slug:string;title:string;tree:ContentNode[]}[]};
const voidTags = new Set(['img','input','br','hr','source','wbr','embed','area','col']);

function collectProjectSlugs(node:ContentNode, slugs:string[]=[]):string[] {
  if(typeof node==='string') return slugs;
  const id=typeof node.props.id==='string'?node.props.id:'';
  if(node.props.className==='work' && /^work-\d+$/.test(id)) slugs.push(id);
  node.children.forEach(child=>collectProjectSlugs(child,slugs));
  return slugs;
}

const homepageProjectSlugs=collectProjectSlugs(content.home);
const orderedProjects=homepageProjectSlugs
  .map(slug=>content.projects.find(project=>project.slug===slug))
  .filter((project):project is (typeof content.projects)[number]=>Boolean(project));

const careerProofs = [
  { title:'Founding Designer', lead:'5×', body:'Cyderes, Contrast Security, Opsis Health, Trackonomy, and Jasper. Built each design function from zero.', icon:Hammer },
  { title:'Exit', lead:'$1.48B', body:'Jasper, where I was founding designer, acquired by Cisco. Continued at Cisco for four years as a design executive leading the IoT product design team.', icon:Handshake },
  { title:'Scale', lead:'Fortune 500', body:'Platforms used by 800+ enterprise customers across cybersecurity, IoT, logistics, and healthcare—including UPS and Koch Industries.', icon:Globe2 },
];

function CareerProofStrip({keyName}:{keyName:string}) {
  return <div key={keyName} className="row rowbottom career-proof-strip">
    {careerProofs.map(({title,lead,body,icon:Icon})=><article className="col-sm-3 career-proof" key={title}>
      <div className="career-proof-icon"><Icon aria-hidden="true" strokeWidth={1.2}/></div>
      <h3>{title}</h3>
      <p className="principles"><strong>{lead}</strong> · {body}</p>
    </article>)}
  </div>;
}

function textContent(node:ContentNode):string {
  return typeof node==='string' ? node : node.children.map(textContent).join('');
}

function LegacyBeforeSnapshot({keyName}:{keyName:string}) {
  return <section key={keyName} className="legacy-snapshot" aria-labelledby={`${keyName}-title`}>
    <header className="legacy-snapshot-heading">
      <div>
        <p className="legacy-snapshot-kicker">Before · Contrast Classic</p>
        <h3 id={`${keyName}-title`} className="class-one">What I inherited</h3>
      </div>
      <p className="legacy-snapshot-summary">A fragmented dashboard and dense vulnerability inventory that made risk difficult to prioritize and action.</p>
    </header>
    <div className="legacy-snapshot-stage">
      <a className="legacy-shot legacy-shot-primary" href="/case-studies/classic contrast dashboard.png" data-lightbox aria-label="Open the legacy Contrast dashboard">
        <span className="legacy-shot-label">Legacy dashboard</span>
        <MediaImage attributes={{src:'/case-studies/classic contrast dashboard.png',alt:'Contrast Classic dashboard',decoding:'async'}} />
      </a>
      <a className="legacy-shot legacy-shot-secondary" href="/case-studies/classic contrast vuln list.png" data-lightbox aria-label="Open the legacy vulnerabilities inventory">
        <span className="legacy-shot-label">Legacy inventory</span>
        <MediaImage attributes={{src:'/case-studies/classic contrast vuln list.png',alt:'Contrast Classic vulnerabilities inventory',decoding:'async'}} />
      </a>
      <span className="legacy-annotation legacy-annotation-one">Weak hierarchy</span>
      <span className="legacy-annotation legacy-annotation-two">Disconnected workflows</span>
      <span className="legacy-annotation legacy-annotation-three">High information density</span>
    </div>
  </section>;
}

/** Give label paragraphs preceding lists one shared style. */
function renderChildren(children:ContentNode[], key:string):ReactNode[] {
  const legacyStart=children.findIndex(child=>typeof child!=='string' && child.tag==='h3' && textContent(child).includes('platform experience I inherited'));
  const legacyEnd=legacyStart<0 ? -1 : children.findIndex((child,index)=>index>legacyStart && typeof child!=='string' && child.tag==='h3');
  return children.flatMap((child,index)=>{
    if(index===legacyStart)return [<LegacyBeforeSnapshot key={`${key}.legacy`} keyName={`${key}-legacy`} />];
    if(legacyStart>=0 && index>legacyStart && (legacyEnd<0 || index<legacyEnd))return [];
    const next=children.slice(index+1).find(node=>typeof node!=='string' || node.trim()!=='');
    if(typeof child!=='string' && child.tag==='p' && textContent(child).trim().endsWith(':') &&
      next && typeof next!=='string' && (next.tag==='ul' || next.tag==='ol')) {
      const className=typeof child.props.className==='string' ? child.props.className : '';
      child={...child,props:{...child.props,className:`${className} list-introduction`}};
    }
    return [render(child,`${key}.${index}`)];
  });
}

function PortfolioFooter() {
  return <footer id="contacts" className="portfolio-footer">
    <div className="portfolio-footer-inner">
      <p>© {new Date().getFullYear()} Curtis Hall</p>
      <nav aria-label="Footer">
        <a href="mailto:wownflutter@gmail.com">Email</a>
        <a href="https://www.linkedin.com/in/curtbydesign/">LinkedIn</a>
      </nav>
    </div>
  </footer>;
}

/** Build ordinary React elements, preserving the authored content hierarchy.
 * No injected HTML, legacy scripts, jQuery, or client-side Next router.
 */
function render(node:ContentNode, key:string):ReactNode {
  if (typeof node === 'string') return node;
  if(node.props.className==='row rowbottom') return <CareerProofStrip keyName={key} />;
  if(node.props.className==='mission-statement') {
    return <h2 key={key} className="mission-statement">
      <span>Design leader.</span>
      <span>Team builder.</span>
      <span>5x founding designer.</span>
    </h2>;
  }
  if(node.props.id==='project-title' && node.children[0]==='The Jasper IoT Control Center -') {
    return <div key={key} className="project-heading-group">
      <h2 id="project-title">The Jasper IoT Control Center</h2>
      <p className="project-deck">Rediscovered, redesigned and relaunched leading to <span className="project-outcome">1.48B acquisition</span></p>
    </div>;
  }
  const props: Record<string,unknown> = {...node.props, key};
  const id=typeof props.id==='string'?props.id:'';
  if(node.tag==='ul')props.role='list';
  if(node.children.some(child=>typeof child!=='string' && child.props.className==='mission-statement')) {
    props.className=`${props.className||''} process-introduction`;
  }
  if(id==='contacts' || id==='feeds')return null;
  if(node.tag==='footer')return <PortfolioFooter key={key} />;
  if(node.tag==='li' && node.children.some(child=>typeof child!=='string' && child.props.href==='#feeds'))return null;
  let tag = node.tag;
  if (/^work-\d+$/.test(id) && props.className === 'work') {
    tag = 'a'; props.href = `/${id}`;
    props['aria-label'] = content.projects.find(p=>p.slug === id)?.title;
  }
  if (props.id === 'menu-mobile') { tag='button'; props.type='button'; props['aria-label']='Toggle navigation'; }
  if (['name','email','message'].includes(String(props.id))) {props['aria-label']=props.placeholder; props.required=true;}
  if (props.id === 'email') props.inputMode='email';
  if (tag === 'a' && props.href === '#team') props['aria-label'] ??= 'Explore my process';
  if (tag === 'a' && String(props.href).includes('linkedin')) props['aria-label']='LinkedIn';
  if (tag === 'a' && String(props.href).includes('twitter.com')) props['aria-label']='Twitter';
  if (tag === 'a' && String(props.href).includes('medium.com')) props['aria-label']='Medium';
  if (tag === 'textarea') { props.defaultValue=node.children.filter(x=>typeof x==='string').join(''); return createElement(tag,props); }
  if (tag === 'img') { const {key:_unusedKey,...attributes}=props; return <MediaImage key={key} attributes={attributes} />; }
  if (tag === 'video') { const {key:_unusedKey,...attributes}=props; return <MediaVideo key={key} keyName={key} attributes={attributes} nodeChildren={node.children} />; }
  return voidTags.has(tag) ? createElement(tag, props) : createElement(tag, props, renderChildren(node.children,key));
}

export function Portfolio({initialSlug=null}:{initialSlug?:string|null}) {
  const [slug,setSlug]=useState<string|null>(initialSlug);
  const [menuOpen,setMenuOpen]=useState(false);
  const [navVisible,setNavVisible]=useState(false);
  const [lightbox,setLightbox]=useState<{src:string;alt:string}|null>(null);
  const savedScroll=useRef(0);
  const lastCard=useRef<HTMLAnchorElement|null>(null);
  const closeButton=useRef<HTMLButtonElement>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const transitioning=useRef(false);
  const surface=useRef<HTMLDivElement>(null);
  const cancelScroll=useRef<(()=>void)|null>(null);
  useEffect(()=>()=>cancelScroll.current?.(),[]);
  const project=content.projects.find(p=>p.slug===slug);
  const index=orderedProjects.findIndex(p=>p.slug===slug);
  const previous=orderedProjects[(index-1+orderedProjects.length)%orderedProjects.length];
  const next=orderedProjects[(index+1)%orderedProjects.length];

  useEffect(()=>{
    const update=()=>setNavVisible(window.scrollY >= window.innerHeight-60);
    window.addEventListener('scroll',update,{passive:true}); update();
    const pop=()=>{const pathSlug=location.pathname.replace(/^\/+|\/+$/g,'');setSlug(content.projects.some(p=>p.slug===pathSlug)?pathSlug:null);};
    window.addEventListener('popstate',pop);
    return ()=>{window.removeEventListener('scroll',update);window.removeEventListener('popstate',pop);};
  },[]);
  useEffect(()=>{
    if (project) {window.scrollTo({top:0,behavior:'instant'}); closeButton.current?.focus({preventScroll:true});}
    else {window.scrollTo({top:savedScroll.current,behavior:'instant'}); lastCard.current?.focus({preventScroll:true});}
    document.title=project?`${project.title} — curtis.is`:'curtis.is : Product Design | Interaction | User Experience | Mobile Design | Saas | Motion';
  },[project]);
  useEffect(()=>{if(lightbox)dialog.current?.showModal();else dialog.current?.close();},[lightbox]);
  async function navigate(target:string|null) {
    if(transitioning.current)return;
    cancelScroll.current?.();
    const element=surface.current;
    const animate=element && typeof element.animate==='function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const update=()=>{
      history.pushState(null,'',target?`/${target}`:'/#apps');
      flushSync(()=>{setSlug(target); setLightbox(null); setMenuOpen(false);});
      // Change scroll while the surface is invisible, never during its reveal.
      window.scrollTo({top:target?0:savedScroll.current,behavior:'instant'});
    };
    if(!animate){update();return;}
    transitioning.current=true;
    let animation:Animation|null=null;
    try {
      animation=element.animate([{opacity:1},{opacity:0}],{duration:220,easing:'ease-in',fill:'forwards'});
      await animation.finished.catch(()=>{});
      update();
      animation.cancel();
      animation=element.animate([{opacity:0},{opacity:1}],{duration:360,easing:'ease-out',fill:'both'});
      await animation.finished.catch(()=>{});
    } finally {
      animation?.cancel();
      transitioning.current=false;
    }
  }
  function scrollToSection(destination:HTMLElement) {
    cancelScroll.current?.();
    const start=window.scrollY;
    const margin=parseFloat(getComputedStyle(destination).scrollMarginTop)||0;
    const end=Math.max(0,Math.min(start+destination.getBoundingClientRect().top-margin,document.documentElement.scrollHeight-window.innerHeight));
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){window.scrollTo({top:end,behavior:'instant'});return;}
    let frame=0;
    const began=performance.now();
    const cancel=()=>{
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel',cancel);
      window.removeEventListener('touchstart',cancel);
      window.removeEventListener('keydown',cancel);
    };
    cancelScroll.current=cancel;
    window.addEventListener('wheel',cancel,{passive:true});
    window.addEventListener('touchstart',cancel,{passive:true});
    window.addEventListener('keydown',cancel);
    const step=(now:number)=>{
      const t=Math.min((now-began)/1000,1);
      const eased=t*t*(3-2*t);
      window.scrollTo({top:start+(end-start)*eased,behavior:'instant'});
      if(t<1)frame=requestAnimationFrame(step);else cancel();
    };
    frame=requestAnimationFrame(step);
  }
  function onClick(event:MouseEvent<HTMLDivElement>) {
    const target=event.target as HTMLElement;
    if(target.closest('#menu-mobile')) {setMenuOpen(x=>!x);return;}
    const anchor=target.closest('a') as HTMLAnchorElement|null;
    if(!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href=anchor.getAttribute('href') || '';
    if((anchor.closest('#explore') || anchor.closest('#top-navigation')) && href.startsWith('#')) {
      const destination=document.getElementById(href.slice(1));
      if(destination) {
        event.preventDefault();
        history.pushState(null,'',href);
        scrollToSection(destination);
        setMenuOpen(false);
        return;
      }
    }
    if(/^\/work-\d+$/.test(href)) {
      event.preventDefault();
      if(!slug){savedScroll.current=window.scrollY;lastCard.current=anchor;}
      navigate(href.slice(1));
    } else if(anchor.getAttribute('rel')?.includes('lightbox') || anchor.dataset.lightbox) {
      event.preventDefault();setLightbox({src:href,alt:anchor.querySelector('img')?.alt||'Project image'});
    } else if(href.startsWith('#')) setMenuOpen(false);
  }
  return <div ref={surface} className={`portfolio-root ${menuOpen?'menu-open':''} ${navVisible?'nav-visible':''}`} onClick={onClick} onKeyDown={e=>{if(e.key==='Escape'&&!lightbox&&slug)navigate(null);}}>
    <div className="home-surface" hidden={Boolean(project)}>{render(content.home,'home')}
    </div>
    {project&&<div id="project-page" className="project-visible">
      <nav id="project-top-bar" aria-label="Project navigation">
        <button id="previous-project" aria-label={`Previous project: ${previous.title}`} onClick={()=>navigate(previous.slug)} />
        <div id="previous-project-name"><h2>{previous.title}</h2></div>
        <button id="close-project" ref={closeButton} aria-label="Close project and return to work" onClick={()=>navigate(null)} />
        <button id="next-project" aria-label={`Next project: ${next.title}`} onClick={()=>navigate(next.slug)} />
        <div id="next-project-name"><h2>{next.title}</h2></div>
      </nav>
      <main id="project">{project.tree.map((node,i)=>render(node,`${slug}.${i}`))}</main>
    </div>}
    <dialog ref={dialog} className="image-lightbox" aria-label={lightbox?.alt||'Project image'} onCancel={()=>setLightbox(null)} onClick={e=>{if(e.target===e.currentTarget)setLightbox(null);}}>
      <button aria-label="Close image" onClick={()=>setLightbox(null)}>×</button>
      {lightbox&&<img src={lightbox.src} alt={lightbox.alt} />}
    </dialog>
  </div>;
}
