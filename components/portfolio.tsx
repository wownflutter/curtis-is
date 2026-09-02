'use client';
/* oxlint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, next/no-img-element -- delegated events preserve the original nested markup; original media must remain byte-for-byte unchanged. */

import { createElement, useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
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
const content = original as unknown as {home:ContentNode;projects:{slug:string;title:string;tree:ContentNode[]}[]};
const voidTags = new Set(['img','input','br','hr','source','wbr','embed','area','col']);

function textContent(node:ContentNode):string {
  return typeof node==='string' ? node : node.children.map(textContent).join('');
}

/** Give label paragraphs preceding lists one shared style. */
function renderChildren(children:ContentNode[], key:string):ReactNode[] {
  return children.map((child,index)=>{
    const next=children.slice(index+1).find(node=>typeof node!=='string' || node.trim()!=='');
    if(typeof child!=='string' && child.tag==='p' && textContent(child).trim().endsWith(':') &&
      next && typeof next!=='string' && (next.tag==='ul' || next.tag==='ol')) {
      const className=typeof child.props.className==='string' ? child.props.className : '';
      child={...child,props:{...child.props,className:`${className} list-introduction`}};
    }
    return render(child,`${key}.${index}`);
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
  if(node.props.className==='mission-statement') {
    return <h2 key={key} className="mission-statement">
      <span>Design leader.</span>
      <span>Team builder.</span>
      <span>User evangelist.</span>
    </h2>;
  }
  if(node.props.id==='project-title' && node.children[0]==='The Jasper IoT Control Center -') {
    return <div key={key} className="project-heading-group">
      <h2 id="project-title">The Jasper IoT Control Center</h2>
      <p className="project-deck">Rediscovered, redesigned and relaunched leading to <span className="project-outcome">1.48B acquisition</span></p>
    </div>;
  }
  if(node.tag==='h1' && node.children.includes('curtis.is creating user-friendly experiences for innovative products.')) {
    return <h1 key={key} className="hero-headline">
      <span>curtis.is creating <span className="keep-together">user-friendly</span> experiences</span>{' '}
      <span>for innovative products.</span>
    </h1>;
  }
  const props: Record<string,unknown> = {...node.props, key};
  const id=typeof props.id==='string'?props.id:'';
  if(node.tag==='ul')props.role='list';
  if(node.children.some(child=>typeof child!=='string' && child.props.className==='mission-statement')) {
    props.className=`${props.className||''} process-introduction`;
  }
  if(node.tag==='p' && node.children.some(child=>typeof child==='string' && child.startsWith('I design intuitive, scalable experiences'))) {
    props.className=`${typeof props.className==='string'?props.className:''} portfolio-summary`;
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
  if (tag === 'img') { const {key:unusedKey,...attributes}=props; return <MediaImage key={key} attributes={attributes} />; }
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
  const index=content.projects.findIndex(p=>p.slug===slug);
  const previous=content.projects[(index+9)%10];
  const next=content.projects[(index+1)%10];

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
