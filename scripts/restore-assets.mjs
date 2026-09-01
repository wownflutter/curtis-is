import fs from 'node:fs/promises';
import path from 'node:path';
const manifest = JSON.parse(await fs.readFile('scripts/asset-manifest.json', 'utf8'));
Object.assign(manifest, {
  '/original/images/awestruck.jpg':'https://www.curtis.is/images/awestruck.jpg',
  '/original/css/font-awesome.min.css':'https://www.curtis.is/css/font-awesome.min.css',
  ...Object.fromEntries(['arrow-left.svg','arrow-right.svg','close-project.svg'].map(x=>[`/original/images/works/${x}`,`https://www.curtis.is/images/works/${x}`])),
  ...Object.fromEntries(['woff','ttf','svg','eot'].map(x=>[`/original/font/fontawesome-webfont.${x}`,`https://www.curtis.is/font/fontawesome-webfont.${x}`])),
});
const missing=[];
for (const [destination, url] of Object.entries(manifest)) {
  const local=path.join('public', destination);
  try { await fs.access(local); continue; } catch {}
  try {
    const response=await fetch(url);
    if(!response.ok || response.headers.get('content-type')?.includes('text/html')) throw Error(`HTTP ${response.status}`);
    await fs.mkdir(path.dirname(local),{recursive:true});
    await fs.writeFile(local,Buffer.from(await response.arrayBuffer()));
    console.log(`Restored ${destination}`);
  } catch(e) { missing.push({destination,url,error:String(e)}); }
}
await fs.writeFile('scripts/missing-assets.json',JSON.stringify(missing,null,2)+'\n');
console.log(`${missing.length} unresolved assets`,missing);
// Remove an Internet Explorer-only star hack rejected by modern CSS minifiers.
const fa=await fs.readFile('public/original/css/font-awesome.min.css','utf8');
await fs.writeFile('public/original/css/font-awesome.min.css',fa.replace(/\*[a-z-]+:[^;}]+;/g,''));
