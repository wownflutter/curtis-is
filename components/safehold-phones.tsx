'use client';
import {useEffect,useRef} from 'react';
import './safehold-phones.css';

const phones=[
  {cls:'outL',depth:.35,src:'/case-studies/sh-phone-splash.webp',alt:'SafeHold splash screen'},
  {cls:'outR',depth:.35,src:'/case-studies/sh-phone-statements.webp',alt:'SafeHold statements screen'},
  {cls:'midL',depth:.7,src:'/case-studies/sh-phone-welcome.webp',alt:'SafeHold sign-in screen'},
  {cls:'midR',depth:.7,src:'/case-studies/sh-phone-filing.webp',alt:'SafeHold filing status screen'},
  {cls:'lead',depth:1.2,src:'/case-studies/sh-phone-dash.webp',alt:'SafeHold dashboard screen'},
];

/** Five app screens in a depth fan: fly in once when scrolled to, then float and follow the cursor. */
export function SafeholdPhones(){
  const rootRef=useRef<HTMLDivElement>(null);
  const rigRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=rootRef.current;
    if(!root)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced){root.dataset.in='true';return;}
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){root.dataset.in='true';observer.disconnect();}
    },{threshold:.25});
    observer.observe(root);
    return ()=>observer.disconnect();
  },[]);
  function move(nx:number,ny:number){
    const root=rootRef.current,rig=rigRef.current;
    if(!root||!rig)return;
    rig.style.transform=`rotateY(${nx*7}deg) rotateX(${-ny*4}deg)`;
    root.querySelectorAll<HTMLElement>('.safehold-px').forEach(layer=>{
      const depth=parseFloat(layer.dataset.depth||'1');
      layer.style.setProperty('--px',`${nx*-14*depth}px`);
      layer.style.setProperty('--py',`${ny*-8*depth}px`);
    });
  }
  return <div ref={rootRef} className="safehold-phones" data-in="false"
    onMouseMove={event=>{
      const box=event.currentTarget.getBoundingClientRect();
      move(((event.clientX-box.left)/box.width)*2-1,((event.clientY-box.top)/box.height)*2-1);
    }}
    onMouseLeave={()=>move(0,0)}>
    <div className="safehold-stage"><div ref={rigRef} className="safehold-rig">
      {phones.map(phone=><div key={phone.cls} className={`safehold-phone ${phone.cls}`}>
        <div className="safehold-px" data-depth={phone.depth}><div className="safehold-float">
          <img src={phone.src} alt={phone.alt} width={645} height={1347} decoding="async" loading="lazy" />
        </div></div>
      </div>)}
    </div></div>
  </div>;
}
