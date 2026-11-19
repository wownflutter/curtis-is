'use client';
/* oxlint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/media-has-caption, next/no-img-element -- delegated events preserve the original nested markup; the embedded animation videos contain no audio track. */

import { createElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type MouseEvent, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { ScrambleHeading } from './scramble-heading';
import { TelemetryUseCases } from './telemetry-use-cases';
import { Globe2, Hammer, Handshake, Play } from 'lucide-react';
import original from '@/app/data/original.json';
import mediaSizes from '@/app/data/media-sizes.json';

const imageSizes:Record<string,{width:number;height:number}>=mediaSizes;

function IncidentWalkthrough() {
  const frame=useRef<HTMLIFrameElement>(null);
  useEffect(()=>{
    const element=frame.current;
    if(!element)return;
    let visible=false;
    const notify=()=>element.contentWindow?.postMessage({type:'incident-tour-visibility',visible},window.location.origin);
    const resize=new ResizeObserver(()=>{
      const width=element.getBoundingClientRect().width;
      element.style.height=`${Math.ceil(width*(width<=500?1:.625)+64)}px`;
    });
    const observer=new IntersectionObserver(entries=>{
      visible=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.35);
      notify();
    },{threshold:[0,.35]});
    const ready=(event:MessageEvent)=>{
      if(event.source===element.contentWindow&&event.origin===window.location.origin&&event.data?.type==='incident-tour-ready')notify();
    };
    window.addEventListener('message',ready);
    resize.observe(element);
    observer.observe(element);
    return ()=>{resize.disconnect();observer.disconnect();window.removeEventListener('message',ready);};
  },[]);
  return <figure className="motion-prototype-stage">
    <figcaption className="motion-prototype-caption">
      <span className="motion-caption-eyebrow"><Play aria-hidden="true" fill="currentColor" />Investigate / Motion demo</span>
    </figcaption>
    <iframe ref={frame} src="/case-studies/incident-walkthrough-v3.html?v=tooltip-type-2" title="Incident investigation walkthrough" loading="eager" style={{display:'block',width:'100%',height:640,border:0}} />
  </figure>;
}

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

const designSystemSequences:Record<string,number[]>={
  '/case-studies/cont-ds.mp4':[0,1.48868,8.72201,15.9553],
  '/case-studies/tr-ds.mp4':[0,2.43893,5.53893,8.37227],
  '/case-studies/or-ds.mp4':[0,3],
};

function MediaVideo({attributes,nodeChildren,keyName}:{attributes:Record<string,unknown>;nodeChildren:ContentNode[];keyName:string}) {
  const ref=useRef<HTMLVideoElement>(null);
  const cursorRef=useRef<HTMLSpanElement>(null);
  const glanceRef=useRef<HTMLSpanElement>(null);
  const sequenceRef=useRef<HTMLSpanElement>(null);
  const source=videoSource(nodeChildren);
  const isExplorer=source==='/case-studies/explorer-animation.mp4';
  const isRemediation=source==='/case-studies/cont-ai-review.mp4';
  const isMl=source==='/case-studies/or-ml-recommendation.mp4';
  const showPlayback=(isRemediation || source.startsWith('/case-studies/tr-') || source==='/case-studies/uh-nlp.mp4' || source==='/case-studies/or-ml-recommendation.mp4') && source.endsWith('.mp4');
  const pausedByViewer=useRef(false);
  const [playback,setPlayback]=useState({playing:false,waiting:false,ended:false,time:0,duration:0});
  useEffect(()=>{
    const player=ref.current;
    if(!player || !showPlayback)return;
    const update=()=>setPlayback({playing:!player.paused,waiting:false,ended:player.ended,time:player.currentTime,duration:Number.isFinite(player.duration)?player.duration:0});
    const waiting=()=>setPlayback(previous=>({...previous,waiting:true}));
    const events=['playing','pause','timeupdate','loadedmetadata','seeked','ended'];
    events.forEach(event=>player.addEventListener(event,update));
    player.addEventListener('waiting',waiting);
    update();
    return ()=>{
      events.forEach(event=>player.removeEventListener(event,update));
      player.removeEventListener('waiting',waiting);
    };
  },[source,showPlayback]);
  const formatTime=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;

  const isTrackonomy=source.startsWith('/case-studies/tr-') && source.endsWith('.mp4');
  const motionDescriptions:Record<string,string>={
    '/case-studies/cont-ai-review.mp4':'Review the evidence, refine the suggested code, and approve a pull request for code review.',
    '/case-studies/tr-activity-stream.mp4':'AI detects an anomaly, opens a support ticket, and drafts a message for the triage and support team.',
    '/case-studies/tr-fma-animation.mp4':'Location guidance narrows to a precise search, supported by sound and haptic feedback.',
    '/case-studies/tr-insights-animation.mp4':'A search scopes the shipment map to a hub, and a tooltip summarizes that hub’s shipments by risk level.',
    '/case-studies/or-ml-recommendation.mp4':'The ML recommendation opens with the factors behind the ranking. The analyst accepts it, the case is assigned, and the next finding opens.',
    '/case-studies/uh-nlp.mp4':'A care professional’s spoken asset request connects to inventory location and tracking through an NLP/MCP context layer.',
  };
  const motionDescription=motionDescriptions[source];
  const motionHeadings:Record<string,{label:string;title:string}>={
    '/case-studies/cont-ai-review.mp4':{label:'Review',title:'Review the fix before it becomes a pull request.'},
    '/case-studies/tr-activity-stream.mp4':{label:'Respond',title:'Turn an anomaly into coordinated action.'},
    '/case-studies/tr-fma-animation.mp4':{label:'Find',title:'From nearby to precisely located.'},
    '/case-studies/tr-insights-animation.mp4':{label:'Insights',title:'From a search to risk in context.'},
    '/case-studies/or-ml-recommendation.mp4':{label:'Decide',title:'Accept a recommendation in one step.'},
    '/case-studies/uh-nlp.mp4':{label:'Ask',title:'Find an asset without typing.'},
  };
  const motionHeading=motionHeadings[source];
  const sequenceChapters=designSystemSequences[source];
  const isDesignSystem=Boolean(sequenceChapters);
  const poster=source==='/case-studies/explorer-animation.mp4'
    ? '/case-studies/explorer-animation-poster.webp'
    : isRemediation ? '/case-studies/cont-ai-review-poster.webp?v=sql-reviewed-1' : source==='/case-studies/or-ml-recommendation.mp4' ? '/case-studies/or-ml-recommendation-poster.webp' : undefined;
  const renderedChildren=(isRemediation || isExplorer || isTrackonomy || isDesignSystem || isMl) ? nodeChildren.map(child=>
    typeof child!=='string' && child.tag==='source'
      ? {...child,props:{...child.props,src:`${source}?v=${isRemediation?'sql-reviewed-1':isExplorer?'7':source==='/case-studies/or-ds.mp4'?'8':'4'}`}}
      : child
  ) : nodeChildren;

  useEffect(()=>{
    const video=ref.current;
    if(!video)return;
    const cursor=cursorRef.current;
    const glance=glanceRef.current;
    const sequence=sequenceRef.current;
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
    },{rootMargin:(isRemediation || isTrackonomy || isDesignSystem)?'1800px 0px':'1000px 0px',threshold:0});
    const player=new IntersectionObserver(entries=>{
      const visible=entries.some(entry=>entry.isIntersecting && ((!isRemediation && !isMl) || entry.intersectionRatio>=(isMl?.5:.35)));
      if(visible && !pausedByViewer.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        warm();
        void video.play().catch(()=>{});
      } else {
        video.pause();
      }
    },{threshold:isRemediation?[0,.35]:isMl?[0,.5]:0.05});
    preloader.observe(video);
    player.observe(video);
    const syncCursor=()=>{
      [cursor,glance].forEach(element=>{
        if(!element)return;
        element.style.animationDelay=`-${video.currentTime}s`;
        element.style.animationPlayState='paused';
      });
      if(sequence) {
        const duration=Number.isFinite(video.duration) ? video.duration : 17.51;
        const active=Math.max(0,sequenceChapters.findLastIndex(time=>video.currentTime>=time));
        sequence.querySelectorAll<HTMLButtonElement>('button').forEach((segment,index)=>{
          const start=sequenceChapters[index];
          const end=sequenceChapters[index+1] ?? duration;
          const progress=index<active ? 1 : index>active ? 0 : Math.min(1,Math.max(0,(video.currentTime-start)/(end-start)));
          segment.style.setProperty('--segment-progress',String(progress));
          segment.setAttribute('aria-pressed',String(index===active));
        });
      }
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
  },[source,isRemediation,isTrackonomy,isDesignSystem,sequenceChapters]);

  const video=<video {...attributes} ref={ref} autoPlay={false} preload="metadata" poster={poster}>
    {renderChildren(renderedChildren,keyName)}
  </video>;
  const playbackControls=showPlayback?<div className="motion-playback motion-video-controls" aria-label="Video playback controls">
    <div className="motion-playback-track" role="progressbar" aria-label="Video progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(playback.duration?playback.time/playback.duration*100:0)}>
      <span style={{width:`${playback.duration?playback.time/playback.duration*100:0}%`}} />
    </div>
    <div className="motion-playback-meta">
      <button type="button" onClick={()=>{
        const player=ref.current;
        if(!player)return;
        if(player.paused){pausedByViewer.current=false;if(player.ended)player.currentTime=0;void player.play().catch(()=>{});}
        else{pausedByViewer.current=true;player.pause();}
      }}>{playback.playing?'Pause':playback.ended?'Replay':'Play'}</button>
      <span className="motion-playback-time">{formatTime(playback.time)} / {formatTime(playback.duration)}</span>
      {playback.waiting&&<span role="status">Buffering</span>}
    </div>
  </div>:null;
  if(motionDescription)return <figure className={`motion-prototype-stage${isRemediation?' motion-prototype-dark remediation-motion':''}`}>
    <figcaption className="motion-prototype-caption">
      <span className="motion-caption-eyebrow"><Play aria-hidden="true" fill="currentColor" />{motionHeading.label} / Motion demo</span>
      <strong className="motion-caption-title">{motionHeading.title}</strong>
      <span className="motion-caption-description">{motionDescription}</span>
    </figcaption>
    {video}
    {playbackControls}
  </figure>;
  const isOrDs=source==='/case-studies/or-ds.mp4';
  if(isDesignSystem)return <div>
    {isOrDs&&<div className="motion-prototype-caption">
      <span className="motion-caption-eyebrow"><Play aria-hidden="true" fill="currentColor" />Design system / Motion demo</span>
      <strong className="motion-caption-title">Design system samples</strong>
      <span className="motion-caption-description">Components and symbols from the Open Raven Figma library.</span>
    </div>}
    <div className="design-system-video-stage">
    {video}
    <span ref={sequenceRef} className="design-system-sequence-rail" aria-label="Design system sequence navigation">
      {sequenceChapters.map((time,index)=><button
        key={time}
        type="button"
        aria-label={`Show design system screen ${index+1}`}
        aria-pressed={index===0}
        onClick={()=>{
          const player=ref.current;
          if(!player)return;
          player.currentTime=time;
          void player.play().catch(()=>{});
        }}
      />)}
    </span>
    </div>
    {playbackControls}
  </div>;
  if(!isExplorer)return showPlayback?<div className="motion-prototype-stage">{video}{playbackControls}</div>:video;
  return <figure className="motion-prototype-stage motion-prototype-dark">
    <figcaption className="motion-prototype-caption">
      <span className="motion-caption-eyebrow"><Play aria-hidden="true" fill="currentColor" />Explore / Motion demo</span>
      <strong className="motion-caption-title">See risk in context.</strong>
      <span className="motion-caption-description">Explorer maps risk across applications, servers, APIs, and databases, then reveals an asset’s security posture.</span>
    </figcaption>
    <span className="explorer-video-stage">
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
  </span>

  </figure>;
}

const content = original as unknown as {home:ContentNode;projects:{slug:string;title:string;tree:ContentNode[]}[]};
const voidTags = new Set(['img','input','br','hr','source','wbr','embed','area','col']);

function nestedWorkId(node:ContentNode):string {
  if(typeof node==='string') return '';
  const id=typeof node.props.id==='string'?node.props.id:'';
  if(node.props.className==='work' && /^work-\d+$/.test(id)) return id;
  for(const child of node.children) {
    const childId=nestedWorkId(child);
    if(childId) return childId;
  }
  return '';
}

function buildSignalHome(node:ContentNode,projectBase:''|'/signal'):ContentNode {
  if(typeof node==='string') return node;
  if(node.props.className==='portfolio-summary') {
    return {...node,children:[
      {
        tag:'span',
        props:{className:'portfolio-summary-thought'},
        children:['My work connects research, product strategy, and design to turn complex systems into products people adopt, trust, and pay for.'],
      },
    ]};
  }
  const props=node.props.className==='work' && typeof node.props.id==='string' && /^work-\d+$/.test(node.props.id)
    ? {...node.props,'data-project-base':projectBase}
    : node.props;
  const children=node.children.map(child=>buildSignalHome(child,projectBase));
  if(node.props.id==='work-container') {
    const trackonomyIndex=children.findIndex(child=>nestedWorkId(child)==='work-1');
    const contrastIndex=children.findIndex(child=>nestedWorkId(child)==='work-2');
    if(trackonomyIndex>=0 && contrastIndex>=0 && contrastIndex>trackonomyIndex) {
      [children[trackonomyIndex],children[contrastIndex]]=[children[contrastIndex],children[trackonomyIndex]];
    }
  }
  return {...node,props,children};
}

const signalHome=buildSignalHome(content.home,'/signal');
const signalHomeAtRoot=buildSignalHome(content.home,'');

function collectProjectSlugs(node:ContentNode, slugs:string[]=[]):string[] {
  if(typeof node==='string') return slugs;
  const id=typeof node.props.id==='string'?node.props.id:'';
  if(node.props.className==='work' && /^work-\d+$/.test(id)) slugs.push(id);
  node.children.forEach(child=>collectProjectSlugs(child,slugs));
  return slugs;
}

const homepageProjectSlugs=collectProjectSlugs(signalHomeAtRoot);
const orderedProjects=homepageProjectSlugs
  .map(slug=>content.projects.find(project=>project.slug===slug))
  .filter((project):project is (typeof content.projects)[number]=>Boolean(project));

const projectCaptions: Record<string, {domain:string;name:string;description:string}> = {
  "work-1": {
    "domain": "IoT & Asset Intelligence",
    "name": "Trackonomy",
    "description": "Sensor insights and agent-driven operations for logistics, fleet management, healthcare, and industry."
  },
  "work-2": {
    "domain": "Cybersecurity & AI",
    "name": "Contrast Security",
    "description": "Giving security teams clearer visibility into threats and helping them coordinate remediation through agentic workflows."
  },
  "work-3": {
    "domain": "Enterprise IoT",
    "name": "Jasper / Cisco",
    "description": "Connected-device management for 50+ telecom operators, powered by machine learning, predictive insights, and recommendations."
  },
  "work-4": {
    "domain": "Cloud Security",
    "name": "Open Raven",
    "description": "Helping teams discover, understand, and protect sensitive cloud data."
  },
  "work-5": {
    "domain": "Healthcare & AI",
    "name": "Opsis Health",
    "description": "AI trained to analyze food’s nutritional components and estimate portions, helping people understand what they eat."
  },
  "work-6": {
    "domain": "IoT & Mobile",
    "name": "Jasper Mobile",
    "description": "Giving telecom operators and their enterprise customers mobile access to usage, alerts, and performance insights."
  },
  "work-7": {
    "domain": "Enterprise IoT",
    "name": "Cisco Marketplace",
    "description": "Helping enterprise customers discover and adopt connected-service add-ons."
  },
  "work-8": {
    "domain": "IoT & Tablet",
    "name": "Jasper for iPad",
    "description": "Bringing customer usage and performance insights to a larger mobile workspace."
  },
  "work-9": {
    "domain": "Fintech & Mobility",
    "name": "Rideshare Finances",
    "description": "Helping rideshare drivers compare hourly earnings, taxable income, and take-home pay to make informed spending decisions."
  },
  "work-10": {
    "domain": "Logistics & IoT",
    "name": "Cisco Fleet Tracking",
    "description": "Helping fleet operators improve energy efficiency and optimize delivery times through clearer visibility into vehicle location and performance."
  }
};

const careerProofs = [
  { title:'Teams & Practice', lead:'', body:'Built design teams across cybersecurity, IoT, logistics, and healthcare.', icon:Hammer },
  { title:'Jasper → Cisco', lead:'', body:'Founding designer at Jasper. After its acquisition, led IoT product design at Cisco.', icon:Handshake },
  { title:'Enterprise Reach', lead:'', body:'Platforms used by 800+ enterprise customers, including UPS and Koch Industries.', icon:Globe2 },
];

function CareerProofStrip({keyName}:{keyName:string}) {
  return <div key={keyName} className="row rowbottom career-proof-strip">
    {careerProofs.map(({title,lead,body,icon:Icon})=><article className="col-sm-3 career-proof" key={title}>
      <div className="career-proof-icon"><Icon aria-hidden="true" strokeWidth={1.2}/></div>
      <h3>{title}</h3>
      <p className="principles">{lead && <><strong>{lead}</strong><span className="proof-separator">: </span></>}{body}</p>
    </article>)}
  </div>;
}

function textContent(node:ContentNode):string {
  return typeof node==='string' ? node : node.children.map(textContent).join('');
}

function useLegacyAnnotationAnimation() {
  const stageRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const stage=stageRef.current;
    if(!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const animations=new Map<Element,Animation>();
    stage.querySelectorAll<HTMLElement>('.legacy-annotation').forEach((annotation,index)=>{
      const animation=annotation.animate([
        {transform:'translateY(30px)',opacity:0},
        {transform:'translateY(0)',opacity:1},
      ],{duration:5000,delay:index*700,easing:'cubic-bezier(.45,.05,.25,1)',fill:'both'});
      animation.pause();
      animation.currentTime=0;
      animations.set(annotation,animation);
    });
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting || entry.intersectionRatio<1)return;
        animations.get(entry.target)?.play();
        observer.unobserve(entry.target);
      });
    },{threshold:1,rootMargin:'0px 0px -100px 0px'});
    animations.forEach((_,annotation)=>observer.observe(annotation));
    return ()=>{observer.disconnect();animations.forEach(animation=>animation.cancel());};
  },[]);
  return stageRef;
}

const mapDemoCycle=11000;

/** Open Raven 3D map: a cursor explores the two hotspots (asset, then filter) and the sequence loops. */
function OpenRavenMapsDemo({attributes}:{attributes:Record<string,unknown>}) {
  const stageRef=useRef<HTMLElement>(null);
  const progressRef=useRef<HTMLSpanElement>(null);
  const timeRef=useRef<HTMLSpanElement>(null);
  const animationsRef=useRef<Animation[]>([]);
  const pausedByViewer=useRef(false);
  const [paused,setPaused]=useState(false);
  const formatClock=(milliseconds:number)=>`${Math.floor(milliseconds/60000)}:${String(Math.floor(milliseconds/1000)%60).padStart(2,'0')}`;
  useEffect(()=>{
    const stage=stageRef.current;
    if(!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const cursor=stage.querySelector<HTMLElement>('.or-map-cursor');
    const asset=stage.querySelector<HTMLElement>('.or-map-panel-asset');
    const filter=stage.querySelector<HTMLElement>('.or-map-panel-filter');
    if(!cursor || !asset || !filter)return;
    const at=(seconds:number)=>seconds*1000/mapDemoCycle;
    const entry={left:'96%',top:'66%'};
    const assetSpot={left:'39.2%',top:'48.5%'};
    const filterSpot={left:'75.8%',top:'4.2%'};
    const exit={left:'96%',top:'26%'};
    const travel='cubic-bezier(.45,.05,.25,1)';
    const timing:KeyframeAnimationOptions={duration:mapDemoCycle,iterations:Infinity,fill:'both'};
    // Each panel rests at 40% and 10px low, then rises to full while the cursor hovers its hotspot.
    const panelFrames=(riseStart:number,riseEnd:number,fallStart:number,fallEnd:number):Keyframe[]=>[
      {opacity:.4,transform:'translateY(10px)',offset:0},
      {opacity:.4,transform:'translateY(10px)',offset:at(riseStart),easing:'cubic-bezier(.2,.7,.2,1)'},
      {opacity:1,transform:'translateY(0)',offset:at(riseEnd)},
      {opacity:1,transform:'translateY(0)',offset:at(fallStart),easing:'ease-in-out'},
      {opacity:.4,transform:'translateY(10px)',offset:at(fallEnd)},
      {opacity:.4,transform:'translateY(10px)',offset:1},
    ];
    const cursorAnimation=cursor.animate([
      {...entry,opacity:0,offset:0,easing:'ease-out'},
      {...entry,opacity:1,offset:at(.5),easing:travel},
      {...assetSpot,opacity:1,offset:at(2)},
      {...assetSpot,opacity:1,offset:at(4.6),easing:travel},
      {...filterSpot,opacity:1,offset:at(6.2)},
      {...filterSpot,opacity:1,offset:at(9.2),easing:travel},
      {...exit,opacity:0,offset:at(10.4)},
      {...exit,opacity:0,offset:1},
    ],timing);
    const animations=[
      cursorAnimation,
      asset.animate(panelFrames(2,2.35,4.6,4.95),timing),
      filter.animate(panelFrames(6.2,6.55,9.2,9.55),timing),
    ];
    animationsRef.current=animations;
    animations.forEach(animation=>{animation.pause();animation.currentTime=0;});
    let frame=0;
    const tick=()=>{
      const elapsed=(Number(cursorAnimation.currentTime)||0)%mapDemoCycle;
      if(progressRef.current)progressRef.current.style.width=`${elapsed/mapDemoCycle*100}%`;
      if(timeRef.current)timeRef.current.textContent=`${formatClock(elapsed)} / ${formatClock(mapDemoCycle)}`;
      frame=requestAnimationFrame(tick);
    };
    tick();
    // Plays while the map is on screen (unless the viewer paused it); resets once it has scrolled away.
    const observer=new IntersectionObserver(entries=>{
      const observed=entries[entries.length-1];
      const rootHeight=observed.rootBounds?.height || window.innerHeight;
      const visible=observed.intersectionRatio>=.4 || observed.intersectionRect.height>=rootHeight*.5;
      if(visible){
        if(!pausedByViewer.current)animations.forEach(animation=>animation.play());
      }else if(observed.intersectionRatio<.05){
        animations.forEach(animation=>{animation.pause();if(!pausedByViewer.current)animation.currentTime=0;});
      }
    },{threshold:Array.from({length:21},(_,index)=>index/20)});
    observer.observe(stage);
    return ()=>{observer.disconnect();cancelAnimationFrame(frame);animations.forEach(animation=>animation.cancel());animationsRef.current=[];};
  },[]);
  const toggle=()=>{
    const next=!pausedByViewer.current;
    pausedByViewer.current=next;
    setPaused(next);
    animationsRef.current.forEach(animation=>{if(next)animation.pause();else animation.play();});
  };
  return <div className="or-map-demo">
    <figure ref={stageRef} className="or-map-demo-stage" aria-label="Open Raven 3D map: hovering an asset opens its details and hovering the filter icon opens Filter View">
      <MediaImage attributes={{...attributes,src:'/case-studies/or-maps-clean@2x.png'}} />
      <img className="or-map-panel or-map-panel-asset" src="/case-studies/or-map-asset-panel@2x.png" width={548} height={600} alt="Asset details: vpc-9412938740q9382, location US Oregon, encrypted, backed up, protected from public access" decoding="async" />
      <img className="or-map-panel or-map-panel-filter" src="/case-studies/or-map-filter-panel@2x.png" width={678} height={600} alt="Filter View with VPC to VPC, Security Groups and Data Stores, plus Locations, Asset Types and Security Configurations" decoding="async" />
      <img className="or-map-cursor" src="/case-studies/or-cursor@2x.png" alt="" aria-hidden="true" decoding="async" />
    </figure>
    <div className="motion-playback motion-video-controls" aria-label="Map demo playback controls">
      <div className="motion-playback-track" role="progressbar" aria-label="Sequence progress" aria-valuemin={0} aria-valuemax={100}>
        <span ref={progressRef} style={{width:'0%'}} />
      </div>
      <div className="motion-playback-meta">
        <button type="button" aria-pressed={paused} onClick={toggle}>{paused?'Play':'Pause'}</button>
        <span ref={timeRef} className="motion-playback-time">0:00 / {formatClock(mapDemoCycle)}</span>
      </div>
    </div>
  </div>;
}

function OpenRavenOperationsDemo({attributes}:{attributes:Record<string,unknown>}) {
  const stageRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    const stage=stageRef.current;
    if(!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const cursor=stage.querySelector<HTMLElement>('.or-cursor');
    const tooltip=stage.querySelector<HTMLElement>('.or-tooltip');
    if(!cursor || !tooltip)return;
    const travel=1800,tooltipDelay=travel+150;
    // The cursor slides in from the right edge and settles on the February bar.
    const move=cursor.animate([
      {left:'99%',top:'38%',opacity:0,offset:0},
      {opacity:1,offset:.15},
      {left:'88%',top:'34%',offset:.6},
      {left:'80.83%',top:'30.27%',opacity:1,offset:1},
    ],{duration:travel,easing:'cubic-bezier(.45,.05,.25,1)',fill:'both'});
    const reveal=tooltip.animate([
      {opacity:0,transform:'translateY(10px)'},
      {opacity:1,transform:'translateY(0)'},
    ],{duration:900,delay:tooltipDelay,easing:'cubic-bezier(.25,.1,.25,1)',fill:'both'});
    const animations=[move,reveal];
    animations.forEach(animation=>{animation.pause();animation.currentTime=0;});
    // Replays every time the screenshot scrolls back into view; resets once it is mostly out of view.
    // "In view" = half the figure is visible, or it fills most of the window (for figures taller than the window).
    let inView=false;
    const observer=new IntersectionObserver(entries=>{
      const entry=entries[entries.length-1];
      const rootHeight=entry.rootBounds?.height || window.innerHeight;
      const visible=entry.intersectionRatio>=.5 || entry.intersectionRect.height>=rootHeight*.6;
      if(visible && !inView){
        inView=true;
        animations.forEach(animation=>{animation.currentTime=0;animation.play();});
      }else if(!visible && entry.intersectionRatio<.1 && inView){
        inView=false;
        animations.forEach(animation=>{animation.pause();animation.currentTime=0;});
      }
    },{threshold:Array.from({length:21},(_,index)=>index/20)});
    observer.observe(stage);
    return ()=>{observer.disconnect();animations.forEach(animation=>animation.cancel());};
  },[]);
  return <figure ref={stageRef} className="or-operations-demo" aria-label="Open Raven operations overview with an incident tooltip">
    <MediaImage attributes={{...attributes,src:'/case-studies/or-operations-clean@2x.png'}} />
    <div className="or-tooltip">
      <p className="or-tooltip-title">1-7 Feb</p>
      <dl className="or-tooltip-stats">
        <div style={{'--dot':'#333333'} as CSSProperties}><dt>Closed</dt><dd>512</dd></div>
        <div style={{'--dot':'#b7debf'} as CSSProperties}><dt>In Progress</dt><dd>114</dd></div>
        <div style={{'--dot':'#98dbf9'} as CSSProperties}><dt>New</dt><dd>87</dd></div>
      </dl>
    </div>
    <img className="or-cursor" src="/case-studies/or-cursor@2x.png" alt="" aria-hidden="true" decoding="async" />
  </figure>;
}

function JasperLegacySnapshot({attributes}:{attributes:Record<string,unknown>}) {
  const stageRef=useLegacyAnnotationAnimation();
  return <figure className="jasper-legacy-snapshot" aria-label="Legacy Jasper screen with usability annotations">
    <MediaImage attributes={attributes} />
    <figcaption ref={stageRef} className="jasper-legacy-annotations">
      <span className="legacy-annotation jasper-nav-annotation">Crowded, role-agnostic navigation</span>
      <span className="legacy-annotation jasper-density-annotation">Dense data, weak visual hierarchy</span>
      <span className="legacy-annotation jasper-truncation-annotation">Truncated names hide key details</span>
    </figcaption>
  </figure>;
}

function LegacyBeforeSnapshot({keyName}:{keyName:string}) {
  const stageRef=useLegacyAnnotationAnimation();

  return <section key={keyName} className="legacy-snapshot" aria-labelledby={`${keyName}-title`}>
    <header className="legacy-snapshot-heading">
      <div>
        <p className="legacy-snapshot-kicker">Before: Contrast Classic</p>
        <h3 id={`${keyName}-title`} className="class-one">What I inherited</h3>
      </div>
      <p className="legacy-snapshot-summary">A fragmented dashboard and dense vulnerability inventory that made prioritization and remediation difficult.</p>
    </header>
    <div ref={stageRef} className="legacy-snapshot-stage">
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

type PersonaSlide={label:string;src:string;cutoff:number;alt?:string};

const contrastPersonas:PersonaSlide[] = [
  {label:'CISO',src:'/case-studies/cont-persona-ciso.png',cutoff:1175},
  {label:'SOC',src:'/case-studies/cont-persona-soc.png',cutoff:1140},
  {label:'Developer',src:'/case-studies/cont-persona-deveng.png',cutoff:1115},
];

const jasperPersonas:PersonaSlide[] = [
  {label:'Service Provider',src:'/case-studies/jasper-persona-cc-sp@2x.png',cutoff:1700,alt:'Service Provider persona: regional sales representative'},
  {label:'Billing Analyst',src:'/case-studies/cj-analytics-persona-luu@2x.png',cutoff:2500,alt:'Discovery interview with a telecom billing analyst'},
  {label:'Operations Manager',src:'/case-studies/cj-analytics-persona-humphrey@2x.png',cutoff:2500,alt:'Discovery interview with an operations manager'},
];

const personaSets:{id:string;theme:'dark'|'light';slides:PersonaSlide[];extra?:number}[] = [
  {id:'contrast',theme:'dark',slides:contrastPersonas},
  {id:'jasper',theme:'light',slides:jasperPersonas,extra:300},
];

function PersonaSlideshow({id,slides,theme,extra=0}:{id:string;slides:PersonaSlide[];theme:'dark'|'light';extra?:number}) {
  const [active,setActive]=useState(0);
  const [expanded,setExpanded]=useState<Record<number,boolean>>({});
  const sectionRef=useRef<HTMLElement>(null);
  const choicesRef=useRef<HTMLDivElement>(null);
  const [indicator,setIndicator]=useState({left:0,width:0});
  useLayoutEffect(()=>{
    const update=()=>{
      const button=choicesRef.current?.querySelectorAll('button')[active] as HTMLElement|undefined;
      if(button)setIndicator({left:button.offsetLeft,width:button.offsetWidth});
    };
    update();
    window.addEventListener('resize',update);
    document.fonts?.ready.then(update);
    return ()=>window.removeEventListener('resize',update);
  },[active]);
  const onChoiceKey=(event:React.KeyboardEvent)=>{
    const step=event.key==='ArrowRight' ? 1 : event.key==='ArrowLeft' ? -1 : 0;
    if(!step)return;
    event.preventDefault();
    const next=(active+step+slides.length)%slides.length;
    setActive(next);
    requestAnimationFrame(()=>(choicesRef.current?.querySelectorAll('button')[next] as HTMLElement|undefined)?.focus());
  };
  return <section ref={sectionRef} className={`persona-slideshow persona-slideshow-${theme}`} aria-label="Research personas" aria-roledescription="carousel">
    <div className="persona-controls">
      <div className="persona-choices" ref={choicesRef} onKeyDown={onChoiceKey} aria-label="Choose a persona">
        {slides.map((persona,index)=><button key={persona.label} type="button"
          aria-pressed={active===index} aria-controls={`${id}-persona-slide-${index}`}
          onClick={()=>setActive(index)}>{persona.label}</button>)}
        <span className="persona-indicator" aria-hidden="true" style={{transform:`translateX(${indicator.left}px)`,width:indicator.width}} />
      </div>
    </div>
    {slides.map((persona,index)=><figure key={persona.src} id={`${id}-persona-slide-${index}`}
      hidden={active!==index} role="group" aria-roledescription="slide" aria-label={`${index+1} of ${slides.length}: ${persona.label}`}>
      <div className={`persona-preview${extra && !expanded[index] ? ' persona-preview-extra' : ''}`} id={`${id}-persona-document-${index}`}
        style={expanded[index] ? {aspectRatio:'auto'} : extra
          ? {paddingBottom:`calc(${(persona.cutoff/imageSizes[persona.src].width*100).toFixed(4)}% + ${extra}px)`}
          : {aspectRatio:`${imageSizes[persona.src].width} / ${persona.cutoff}`}}>
        <MediaImage attributes={{src:persona.src,alt:`${persona.alt ?? `${persona.label} research persona`}${expanded[index]?', full document':', preview'}`,decoding:'async'}} />
      </div>
      <figcaption><span>{persona.label} {index+1} / {slides.length}</span>
        <button className="persona-expand" type="button" aria-expanded={Boolean(expanded[index])}
          aria-controls={`${id}-persona-document-${index}`} onClick={()=>{
            const collapsing=expanded[index];
            setExpanded(previous=>({...previous,[index]:!previous[index]}));
            if(collapsing)requestAnimationFrame(()=>sectionRef.current?.scrollIntoView({block:'start',behavior:'instant'}));
          }}>{expanded[index]?'Show less ↑':'Show full persona ↓'}</button>
      </figcaption>
    </figure>)}
  </section>;
}

/** Give label paragraphs preceding lists one shared style. */
function renderChildren(children:ContentNode[], key:string):ReactNode[] {
  const legacyStart=children.findIndex(child=>typeof child!=='string' && child.tag==='h3' && textContent(child).includes('platform experience I inherited'));
  const legacyEnd=legacyStart<0 ? -1 : children.findIndex((child,index)=>index>legacyStart && typeof child!=='string' && child.tag==='h3');
  const personaGroups=personaSets.flatMap(set=>{
    const indices=children.flatMap((child,index)=>typeof child!=='string' && child.tag==='div' &&
      child.children.some(node=>typeof node!=='string' && node.tag==='img' && set.slides.some(slide=>slide.src===node.props.src)) ? [index] : []);
    return indices.length===set.slides.length ? [{set,indices}] : [];
  });
  return children.flatMap((child,index)=>{
    const personaGroup=personaGroups.find(group=>group.indices.includes(index));
    if(personaGroup) {
      return index===personaGroup.indices[0] ? [<PersonaSlideshow key={`${key}.personas`} id={personaGroup.set.id} slides={personaGroup.set.slides} theme={personaGroup.set.theme} extra={personaGroup.set.extra} />] : [];
    }
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

function NextCaseStudy({project,position,total,routeBase}:{project:(typeof content.projects)[number];position:number;total:number;routeBase:''|'/signal'}) {
  const href=`${routeBase}/${project.slug}`;
  const displayTitle=project.title.replace(/\s*\([^)]*\)\s*$/,'');
  return <aside className="next-case-study" aria-label="Continue to the next case study">
    <a href={href} aria-label={`Next case study: ${project.title}`}>
      <span className="next-case-study-label">Next case study <span aria-hidden="true">{String(position).padStart(2,'0')} / {String(total).padStart(2,'0')}</span></span>
      <span className="next-case-study-title">{displayTitle}</span>
      <span className="next-case-study-arrow" aria-hidden="true">→</span>
    </a>
  </aside>;
}

const marketVeilWidths=[26.07,24.69,24.77,24.47];
/** The four environments brighten one after another, left to right, as the strip scrolls into view. */
function MarketBanner({src}:{src:string}) {
  const ref=useRef<HTMLElement>(null);
  useEffect(()=>{
    const root=ref.current;
    if(!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const veils=Array.from(root.querySelectorAll<HTMLElement>('.market-veil'));
    const labels=Array.from(root.querySelectorAll<HTMLElement>('figcaption span'));
    let animations:Animation[]=[];
    let playing=false;
    const stop=()=>{animations.forEach(animation=>animation.cancel());animations=[];};
    const play=()=>{
      stop();
      veils.forEach((veil,index)=>{
        const delay=500+index*450;
        animations.push(veil.animate([{opacity:1},{opacity:0}],{duration:900,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
        animations.push(labels[index].animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:900,delay:delay+250,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
      });
    };
    root.classList.add('market-armed');
        let eligible=false;
    let ready=false;
    const attempt=()=>{if(eligible && ready && !playing){playing=true;play();}};
    // A short beat after the page arrives, so the hero settles before the strip starts.
    const readyTimer=window.setTimeout(()=>{ready=true;attempt();},1200);
    // Light up once most of the strip is on screen; go back to muted only after it has fully left.
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.intersectionRatio>=.6)eligible=true;
        else if(!entry.isIntersecting){eligible=false;if(playing){playing=false;stop();}}
      });
      attempt();
    },{threshold:[0,.6,1],rootMargin:'0px 0px -8% 0px'});
    observer.observe(root);
    return ()=>{window.clearTimeout(readyTimer);observer.disconnect();stop();root.classList.remove('market-armed');};
  },[]);
  let left=0;
  return <figure ref={ref} className="trackonomy-market-banner">
    <MediaImage attributes={{src,alt:'Sensor placement across air cargo, healthcare, industrial equipment, and supply chain environments',decoding:'async'}} />
    <figcaption>{['Air cargo','Healthcare','Industrial equipment','Supply chain'].map(label=><span key={label}>{label}</span>)}</figcaption>
    <span className="market-veils" aria-hidden="true">{marketVeilWidths.map((width,index)=>{
      const style={left:`${left}%`,width:`${width}%`};left+=width;
      return <span key={index} className="market-veil" style={style} />;
    })}</span>
  </figure>;
}

/** Build ordinary React elements, preserving the authored content hierarchy.
 * No injected HTML, legacy scripts, jQuery, or client-side Next router.
 */
function render(node:ContentNode, key:string):ReactNode {
  if (typeof node === 'string') return node;
  if(node.props.className==='trackonomy-system') return <TelemetryUseCases key={key} />;
  if(node.props.className==='row rowbottom') return <CareerProofStrip keyName={key} />;
  if(node.props.className==='mission-statement') {
    return <h2 key={key} className="mission-statement">
      <span>Product design leader</span>
      <span>from zero-to-one</span>
      <span>to global scale</span>
    </h2>;
  }
  if(node.props.id==='project-title' && node.children[0]==='The Jasper IoT Control Center -') {
    return <div key={key} className="project-heading-group">
      <ScrambleHeading tag="h2" attributes={{id:'project-title'}}>The Jasper IoT Control Center</ScrambleHeading>
      <p className="project-deck">Redesigned and relaunched the IoT Control Center, then continued its evolution at Cisco</p>
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
    const projectBase=props['data-project-base']==='/signal'?'/signal':'';
    delete props['data-project-base'];
    tag = 'a'; props.href = `${projectBase}/${id}`;
    const caption=projectCaptions[id];
    if(caption) {
      return <a key={key} id={id} className="work captioned-work" href={`${projectBase}/${id}`}>
        <div className="project-card-image">{renderChildren(node.children.filter(child=>typeof child!=='string' && child.tag==='img'),`${key}-image`)}</div>
        <div className="project-card-caption">
          <span className="project-card-domain">{caption.domain}</span>
          <h3><span>{caption.name}</span><svg className="project-card-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></h3>
          <p>{caption.description}</p>
        </div>
      </a>;
    }
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
  if (tag === 'img' && props.src === '/case-studies/tr-categories-3.png') return <MarketBanner key={key} src={String(props.src)} />;
  if (tag === 'img' && props.src === '/case-studies/cont-incident-detail.png') return <IncidentWalkthrough key={key} />;
  if (tag === 'img' && props.src === '/case-studies/or-maps@2x.png') return <OpenRavenMapsDemo key={key} attributes={props} />;
  if (tag === 'img' && props.src === '/case-studies/or-operations@2x.png') return <OpenRavenOperationsDemo key={key} attributes={props} />;
  if (tag === 'img' && props.src === '/case-studies/jasper-legacy@2x.png') {
    return <JasperLegacySnapshot key={key} attributes={props} />;
  }
  if (tag === 'img') { const {key:_unusedKey,...attributes}=props; return <MediaImage key={key} attributes={attributes} />; }
  if (tag === 'video') { const {key:_unusedKey,...attributes}=props; return <MediaVideo key={key} keyName={key} attributes={attributes} nodeChildren={node.children} />; }
  if (id==='project-title' && /^h[1-6]$/.test(tag)) { const {key:_headingKey,...attributes}=props; return <ScrambleHeading key={key} tag={tag} attributes={attributes}>{renderChildren(node.children,key)}</ScrambleHeading>; }
  return voidTags.has(tag) ? createElement(tag, props) : createElement(tag, props, renderChildren(node.children,key));
}

export function Portfolio({initialSlug=null,variant='live',routeBase:routeBaseProp}:{initialSlug?:string|null;variant?:'live'|'signal';routeBase?:''|'/signal'}) {
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
  const isSignal=variant==='signal';
  const routeBase=routeBaseProp ?? (isSignal?'/signal':'');
  const homePath=routeBase || '/';
  const homeTree=isSignal ? (routeBase==='/signal'?signalHome:signalHomeAtRoot) : content.home;
  useEffect(()=>{
    const previousRestoration=history.scrollRestoration;
    history.scrollRestoration='manual';
    return ()=>{
      cancelScroll.current?.();
      history.scrollRestoration=previousRestoration;
    };
  },[]);
  const project=content.projects.find(p=>p.slug===slug);
  const index=orderedProjects.findIndex(p=>p.slug===slug);
  const next=orderedProjects[(index+1)%orderedProjects.length];

  useEffect(()=>{
    const update=()=>setNavVisible((document.getElementById('header')?.getBoundingClientRect().bottom ?? window.innerHeight)<=0);
    window.addEventListener('scroll',update,{passive:true}); update();
    const pop=()=>{
      const parts=location.pathname.split('/').filter(Boolean);
      const pathSlug=routeBase==='/signal' && parts[0]==='signal' ? parts[1] : parts[0];
      setSlug(content.projects.some(p=>p.slug===pathSlug)?pathSlug:null);
    };
    window.addEventListener('popstate',pop);
    return ()=>{window.removeEventListener('scroll',update);window.removeEventListener('popstate',pop);};
  },[routeBase]);
  useEffect(()=>{
    let frame=0;
    const positionHome=()=>{
      const hashTarget=location.hash ? document.getElementById(location.hash.slice(1)) : null;
      const returnTop=savedScroll.current || (hashTarget ? window.scrollY+hashTarget.getBoundingClientRect().top : 0);
      window.scrollTo({top:returnTop,behavior:'instant'});
    };
    if (project) {window.scrollTo({top:0,behavior:'instant'}); closeButton.current?.focus({preventScroll:true});}
    else {
      positionHome();
      frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(positionHome);});
      lastCard.current?.focus({preventScroll:true});
    }
    document.title=project
      ? `${project.title} — curtis.is`
      : isSignal && routeBase==='/signal'
        ? 'Signal concept — curtis.is'
        : 'curtis.is : Product Design | Interaction | User Experience | Mobile Design | Saas | Motion';
    return ()=>cancelAnimationFrame(frame);
  },[project,isSignal,routeBase]);
  useEffect(()=>{if(lightbox)dialog.current?.showModal();else dialog.current?.close();},[lightbox]);
  async function navigate(target:string|null) {
    if(transitioning.current)return;
    cancelScroll.current?.();
    const element=surface.current;
    const animate=element && typeof element.animate==='function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const update=()=>{
      history.pushState(null,'',target?`${routeBase}/${target}`:homePath);
      flushSync(()=>{setSlug(target); setLightbox(null); setMenuOpen(false);});
      // Change scroll while the surface is invisible, never during its reveal.
      const work=document.getElementById('apps');
      const returnTop=target ? 0 : (work ? window.scrollY+work.getBoundingClientRect().top : savedScroll.current);
      if(!target)savedScroll.current=returnTop;
      window.scrollTo({top:target?0:returnTop,behavior:'instant'});
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
    const destinationTop=()=>Math.max(0,Math.min(window.scrollY+destination.getBoundingClientRect().top-margin,document.documentElement.scrollHeight-window.innerHeight));
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){window.scrollTo({top:destinationTop(),behavior:'instant'});return;}
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
      const t=Math.min((now-began)/1100,1);
      const eased=1-Math.pow(1-t,4);
      const end=destinationTop();
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
    if(/^\/(?:signal\/)?work-\d+$/.test(href)) {
      event.preventDefault();
      if(!slug){savedScroll.current=window.scrollY;lastCard.current=anchor;}
      navigate(href.split('/').at(-1) || null);
    } else if(anchor.getAttribute('rel')?.includes('lightbox') || anchor.dataset.lightbox) {
      event.preventDefault();setLightbox({src:href,alt:anchor.querySelector('img')?.alt||'Project image'});
    } else if(href.startsWith('#')) setMenuOpen(false);
  }
  return <div ref={surface} className={`portfolio-root ${isSignal?'signal-concept':''} ${menuOpen?'menu-open':''} ${navVisible?'nav-visible':''}`} onClick={onClick} onKeyDown={e=>{if(e.key==='Escape'&&!lightbox&&slug)navigate(null);}}>
    <div className="home-surface" hidden={Boolean(project)}>{render(homeTree,'home')}
    </div>
    {project&&<div id="project-page" className={`project-visible ${project.slug === 'work-2' ? 'contrast-case-study' : 'light-case-study'}`}>
      <nav id="project-top-bar" aria-label="Project navigation">
        <button id="close-project" ref={closeButton} aria-label="Close project and return to work" onClick={()=>navigate(null)} />
      </nav>
      <main id="project">
        {project.tree.map((node,i)=>render(node,`${slug}.${i}`))}
        <NextCaseStudy project={next} position={(index+1)%orderedProjects.length+1} total={orderedProjects.length} routeBase={routeBase} />
      </main>
    </div>}
    <dialog ref={dialog} className="image-lightbox" aria-label={lightbox?.alt||'Project image'} onCancel={()=>setLightbox(null)} onClick={e=>{if(e.target===e.currentTarget)setLightbox(null);}}>
      <button aria-label="Close image" onClick={()=>setLightbox(null)}>×</button>
      {lightbox&&<img src={lightbox.src} alt={lightbox.alt} />}
    </dialog>
  </div>;
}

