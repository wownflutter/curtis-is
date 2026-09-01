// Read dimensions only: never recompress or modify the original assets.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const content=JSON.parse(fs.readFileSync('app/data/original.json','utf8'));
const sources=new Set();
function walk(n){if(!n||typeof n==='string')return;if(n.tag==='img'&&n.props.src?.startsWith('/'))sources.add(n.props.src);n.children?.forEach(walk);}
walk(content.home);content.projects.forEach(p=>p.tree.forEach(walk));
const sizes={};
for(const src of sources){
  if(!/\.(png|jpe?g|gif|webp)$/i.test(src))continue;
  const output=execFileSync('sips',['-g','pixelWidth','-g','pixelHeight',`public${src}`],{encoding:'utf8'});
  const width=Number(output.match(/pixelWidth: (\d+)/)?.[1]);
  const height=Number(output.match(/pixelHeight: (\d+)/)?.[1]);
  if(width&&height)sizes[src]={width,height};else throw Error(`Cannot measure ${src}`);
}
fs.writeFileSync('app/data/media-sizes.json',JSON.stringify(sizes,null,2)+'\n');
console.log(`Reserved dimensions for ${Object.keys(sizes).length} images.`);
