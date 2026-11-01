'use client';
import {useEffect,useRef} from 'react';
import {Radio,Network,PanelsTopLeft,ScanSearch,BellRing,Truck,Hospital,Thermometer,Package,TriangleAlert,MapPin,ClipboardList,MapPinned,Navigation} from 'lucide-react';
import './telemetry-use-cases.css';

export function TelemetryUseCases(){
 const rootRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const root=rootRef.current;
  if(!root)return;
  const button=root.querySelector<HTMLButtonElement>('#case-replay')!;
  const events=Array.from(root.querySelectorAll<HTMLElement>('.event'));
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animations:Animation[]=[];
  let timer:ReturnType<typeof setTimeout>|undefined;
  function play(){
   clearTimeout(timer);
   animations.forEach(a=>a.cancel());animations=[];
   button.disabled=true;
   events.forEach(event=>event.classList.remove('active'));
   events.forEach(event=>{
    const delay=Number(event.dataset.step)*750;
    const animation=event.querySelector('p')!.animate([{opacity:.25},{opacity:1}],{duration:1100,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
    animations.push(animation);
    const step=Number(event.dataset.step);
    const iconFrames=step===4
      ?[{transform:'rotate(0deg)'},{transform:'rotate(-12deg)',offset:.25},{transform:'rotate(10deg)',offset:.5},{transform:'rotate(-6deg)',offset:.75},{transform:'rotate(0deg)'}]
      :step===1
        ?[{transform:'scale(1)',opacity:.4},{transform:'scale(1.15)',opacity:1,offset:.5},{transform:'scale(1)',opacity:1}]
        :[{transform:'scale(.85)',opacity:.35},{transform:'scale(1.08)',opacity:1,offset:.65},{transform:'scale(1)',opacity:1}];
    animations.push(event.querySelector('.event-icon')!.animate(iconFrames,{duration:1100,delay,easing:'ease-in-out',fill:'both'}));
    animation.finished.then(()=>event.classList.add('active')).catch(()=>{});
   });
   timer=setTimeout(()=>{button.disabled=false;},4500);
  }
  button.addEventListener('click',play);
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(e=>e.isIntersecting)){if(!reduced)play();observer.disconnect();}
  },{threshold:.35});
  observer.observe(root.querySelector('.case-surface')!);
  return ()=>{observer.disconnect();clearTimeout(timer);button.removeEventListener('click',play);animations.forEach(a=>a.cancel());};
 },[]);
 return (<div id="telemetry-cases" ref={rootRef}>
 <section className="case-surface" aria-label="One telemetry model supporting logistics and healthcare">
  <header><span className="eyebrow">ONE SHARED TELEMETRY MODEL</span><h2>Different environments. The same path to action.</h2></header>
  <div className="case-grid">
   <div className="stage-head"><span>01</span><Radio aria-hidden="true" /><h3>Sensor</h3></div>
   <div className="stage-head"><span>02</span><Network aria-hidden="true" /><h3>Network</h3></div>
   <div className="stage-head product"><span>03</span><PanelsTopLeft aria-hidden="true" /><h3>Web &amp; mobile</h3></div>
   <div className="stage-head product"><span>04</span><ScanSearch aria-hidden="true" /><h3>Asset intelligence</h3></div>
   <div className="stage-head product"><span>05</span><BellRing aria-hidden="true" /><h3>Action</h3></div>
   <div className="case-label logistics"><Truck aria-hidden="true" /><strong>Logistics</strong><span>Protect a shipment’s condition</span></div>
   <div className="event logistics" data-step="0"><span className="mobile-stage">Sensor</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="thermometer"></i></span><p>Temperature rises</p></div></div>
   <div className="event logistics" data-step="1"><span className="mobile-stage">Network</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="radio"></i></span><p>Reading received</p></div></div>
   <div className="event logistics product" data-step="2"><span className="mobile-stage">Web &amp; mobile</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="package"></i></span><p>Linked to a shipment</p></div></div>
   <div className="event logistics product" data-step="3"><span className="mobile-stage">Asset intelligence</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="triangle-alert"></i></span><p>Condition risk identified</p></div></div>
   <div className="event logistics product" data-step="4"><span className="mobile-stage">Action</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="bell-ring"></i></span><p>Cargo team alerted</p></div></div>
   <div className="case-label healthcare"><Hospital aria-hidden="true" /><strong>Healthcare</strong><span>Find equipment when it is needed</span></div>
   <div className="event healthcare" data-step="0"><span className="mobile-stage">Sensor</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="map-pin"></i></span><p>Equipment changes location</p></div></div>
   <div className="event healthcare" data-step="1"><span className="mobile-stage">Network</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="radio"></i></span><p>Location update received</p></div></div>
   <div className="event healthcare product" data-step="2"><span className="mobile-stage">Web &amp; mobile</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="clipboard-list"></i></span><p>Linked to the equipment record</p></div></div>
   <div className="event healthcare product" data-step="3"><span className="mobile-stage">Asset intelligence</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="map-pinned"></i></span><p>Current location shown</p></div></div>
   <div className="event healthcare product" data-step="4"><span className="mobile-stage">Action</span><div className="event-content"><span className="event-icon" aria-hidden="true"><i data-lucide="navigation"></i></span><p>Staff locate the equipment</p></div></div>
  </div>
 </section>
 <div className="case-controls"><button className="btn" type="button" id="case-replay">Replay sequence</button></div>
</div>);
}
