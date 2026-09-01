'use client';
/* oxlint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, next/no-img-element -- delegated events preserve the original nested markup; original media must remain byte-for-byte unchanged. */

import { createElement, useEffect, useRef, useState, type ReactNode, type MouseEvent, type SyntheticEvent } from 'react';
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
const content = original as unknown as {home:ContentNode;projects:{slug:string;title:string;css:string;tree:ContentNode[]}[]};
const voidTags = new Set(['img','input','br','hr','source','wbr','embed','area','col']);

/** Build ordinary React elements, preserving the authored content hierarchy.
 * No injected HTML, legacy scripts, jQuery, or client-side Next router.
 */
function render(node:ContentNode, key:string):ReactNode {
  if (typeof node === 'string') return node;
  const props: Record<string,unknown> = {...node.props, key};
  const id=typeof props.id==='string'?props.id:'';
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
  return voidTags.has(tag) ? createElement(tag, props) : createElement(tag, props, node.children.map((child,i)=>render(child,`${key}.${i}`)));
}

export function Portfolio({initialSlug=null}:{initialSlug?:string|null}) {
  const [slug,setSlug]=useState<string|null>(initialSlug);
  const [menuOpen,setMenuOpen]=useState(false);
  const [navVisible,setNavVisible]=useState(false);
  const [lightbox,setLightbox]=useState<{src:string;alt:string}|null>(null);
  const [formMessage,setFormMessage]=useState('');
  const savedScroll=useRef(0);
  const lastCard=useRef<HTMLAnchorElement|null>(null);
  const closeButton=useRef<HTMLButtonElement>(null);
  const dialog=useRef<HTMLDialogElement>(null);
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
  function navigate(target:string|null) {
    history.pushState(null,'',target?`/${target}`:'/#apps');
    setSlug(target); setLightbox(null); setMenuOpen(false);
  }
  function onClick(event:MouseEvent<HTMLDivElement>) {
    const target=event.target as HTMLElement;
    if(target.closest('#menu-mobile')) {setMenuOpen(x=>!x);return;}
    const anchor=target.closest('a') as HTMLAnchorElement|null;
    if(!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href=anchor.getAttribute('href') || '';
    if(/^\/work-\d+$/.test(href)) {
      event.preventDefault();
      if(!slug){savedScroll.current=window.scrollY;lastCard.current=anchor;}
      navigate(href.slice(1));
    } else if(anchor.getAttribute('rel')?.includes('lightbox') || anchor.dataset.lightbox) {
      event.preventDefault();setLightbox({src:href,alt:anchor.querySelector('img')?.alt||'Project image'});
    } else if(href.startsWith('#')) setMenuOpen(false);
  }
  function onSubmit(event:SyntheticEvent<HTMLDivElement>) {
    event.preventDefault();
    const form=event.target as HTMLFormElement;
    if(!form.reportValidity())return;
    setFormMessage('The preview does not send messages yet. Please email curtis@curtis.is directly.');
  }
  return <div className={`portfolio-root ${menuOpen?'menu-open':''} ${navVisible?'nav-visible':''}`} onClick={onClick} onSubmit={onSubmit} onKeyDown={e=>{if(e.key==='Escape'&&!lightbox&&slug)navigate(null);}}>
    <div className="home-surface" hidden={Boolean(project)}>{render(content.home,'home')}
      {formMessage&&<output className="form-status">{formMessage}</output>}
    </div>
    {project&&<div id="project-page" className="project-visible">
      {project.css&&<style>{project.css}</style>}
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
