'use client';
import {useEffect,useRef} from 'react';
import {Radio,ArrowUpRight,Thermometer,BedSingle,Cross,MapPin,LocateFixed} from 'lucide-react';
import './telemetry-use-cases.css';

export function TelemetryUseCases(){
 const rootRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const root=rootRef.current;
  if(!root)return;
  const targets=Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animations:Animation[]=[];
  function play(){
   animations.forEach(animation=>animation.cancel());animations=[];
   targets.forEach(element=>{
    const action=element.classList.contains('scene-action');
    const pin=element.classList.contains('equipment-pin');
    animations.push(element.animate([
      {opacity:0,transform:pin?'scale(.75)':'translateY(8px)'},
      {opacity:1,transform:pin?'scale(1)':'translateY(0)'},
    ],{duration:1400,delay:action?1300:pin?650:350,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
   });
  }
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){if(!reduced)play();observer.disconnect();}
  },{threshold:.3});
  observer.observe(root.querySelector('.worlds')!);
  return ()=>{observer.disconnect();animations.forEach(animation=>animation.cancel());};
 },[]);
 return (<div id="telemetry-scenes" ref={rootRef}>
 <section className="story">
  <header><span className="overline">TRACKONOMY / CONNECTED ASSET INTELLIGENCE</span><h2>One sensor. A world of useful signals.</h2></header>
  <div className="origin"><div className="sensor"><span></span><Radio aria-hidden="true" /></div><div><strong>One shared telemetry model</strong><span>Location / Temperature / Vibration / Light &amp; dark</span></div></div>
  <div className="branches" aria-hidden="true"><span></span><span></span></div>
  <div className="worlds">
   <article className="world cargo">
    <div className="world-label"><span><small>01</small>Logistics</span><ArrowUpRight aria-hidden="true" /></div>
    <div className="scene shipment" role="img" aria-label="A sensor on a shipment detects a temperature change and prompts an alert to the cargo team.">
     <div className="global-globe" aria-hidden="true"><span className="longitude lon-one"></span><span className="longitude lon-two"></span><span className="latitude lat-one"></span><span className="latitude lat-two"></span><span className="equator"></span></div><span className="global-label">GLOBAL ASSET VISIBILITY</span><div className="route-line"></div><div className="route-point start"></div><div className="route-point end"></div>
     <span className="route-label">IN TRANSIT</span>
     <div className="parcel"><div className="parcel-top"></div><div className="parcel-front"><span className="parcel-label"><b></b><b></b><b></b><b></b><b></b><b></b></span><div className="parcel-sensor"><span></span></div></div><div className="parcel-side"></div></div>
     <div className="signal-reading reveal"><span className="reading-label"><Thermometer aria-hidden="true" />Condition change</span><svg viewBox="0 0 150 30" aria-label="Temperature trend rising"><path d="M0 25 L20 23 L40 24 L60 18 L80 19 L100 10 L120 12 L150 2" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg><strong>Temperature rising</strong></div>
     <div className="scene-action reveal"><span className="status-dot"></span>Cargo team alerted</div>
    </div>
    <div className="world-copy"><span className="small-label">LOCATION, CONDITION &amp; OPERATIONAL CONTEXT</span><h3>Operational awareness, wherever assets move.</h3><p>Track shipments and field equipment, understand changing conditions, and coordinate the next action.</p></div>
   </article>
   <article className="world care">
    <div className="world-label"><span><small>02</small>Healthcare</span><ArrowUpRight aria-hidden="true" /></div>
    <div className="scene hospital" role="img" aria-label="A hospital floor plan shows equipment location so staff can find it when needed.">
     <div className="floorplan"><div className="room room-a"><span>Rooms</span><BedSingle aria-hidden="true" /></div><div className="room room-b"><BedSingle aria-hidden="true" /></div><div className="room room-c"><span>Equipment</span></div><div className="room room-d"><span>Care team</span><Cross aria-hidden="true" /></div><div className="hall-path"></div><div className="staff-dot"></div><div className="equipment-pin reveal"><MapPin aria-hidden="true" /></div></div>
     <div className="location-reading reveal"><span className="reading-label"><LocateFixed aria-hidden="true" />Location updated</span><strong>Equipment located</strong><span>Floor-level context</span></div>
     <div className="scene-action reveal"><span className="status-dot"></span>Staff find the equipment</div>
    </div>
    <div className="world-copy"><span className="small-label">FROM LOCATION TO AVAILABILITY</span><h3>Find what care depends on.</h3><p>Turn equipment location into useful guidance for staff working on the floor.</p></div>
   </article>
  </div>
 </section>
</div>);
}
