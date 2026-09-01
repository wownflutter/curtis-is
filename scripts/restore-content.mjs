/** Retain the original DOM hierarchy, copy and media; React owns interactions. */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
const reference = path.resolve('../source-reference');
const assets = new Map();
const aliases = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', autoplay: 'autoPlay', playsinline: 'playsInline', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen', srcset: 'srcSet', colspan: 'colSpan', rowspan: 'rowSpan' };
const booleans = new Set(['muted', 'autoplay', 'playsinline', 'loop', 'controls', 'allowfullscreen', 'required', 'disabled']);
function asset(value) {
  if (!/^(\.\/)?images\//.test(value)) return value.replace(/^work-(\d+)\.html$/, '/work-$1');
  const file = decodeURIComponent(value.replace(/^(\.\/)?images\//, ''));
  const folder = fs.existsSync(path.join('public/portfolio', file)) ? 'portfolio' : 'case-studies';
  const destination = `/${folder}/${file}`;
  assets.set(destination, `https://www.curtis.is/images/${file.split('/').map(encodeURIComponent).join('/')}`);
  return destination;
}
function convert(node) {
  if (node.type === 'text') return node.data;
  if (node.type !== 'tag' || ['script', 'style', 'link', 'meta', 'noscript'].includes(node.name)) return null;
  const props = {};
  for (const [key, value] of Object.entries(node.attribs || {})) {
    if (/^on/i.test(key) || !/^[a-zA-Z][a-zA-Z0-9:_-]*$/.test(key) || key.includes(':')) continue;
    if (key === 'style') {
      props.style = Object.fromEntries(value.split(';').filter(x => x.includes(':')).map(x => {
        const index = x.indexOf(':');
        return [x.slice(0, index).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), x.slice(index + 1).trim()];
      }));
    } else if (key === 'value' && node.name !== 'button') props.defaultValue = value;
    else props[aliases[key] || key] = booleans.has(key) ? true : ['src', 'href', 'poster'].includes(key) ? asset(value) : value;
  }
  if (node.name === 'a' && props.target === '_blank') props.rel = 'noopener noreferrer';
  if (node.name === 'img') { props.alt ??= ''; props.decoding = 'async'; }
  if (node.name === 'video') props.preload = 'metadata';
  return { tag: node.name, props, children: (node.children || []).map(convert).filter(x => x !== null) };
}
const home = cheerio.load(fs.readFileSync(path.join(reference, 'index.html'), 'utf8'));
const projects = Array.from({length:10}, (_, i) => {
  const slug = `work-${i+1}`;
  const $ = cheerio.load(fs.readFileSync(path.join(reference, `${slug}.html`), 'utf8'));
  return { slug, title: home(`#${slug} h6`).text().trim(), browserTitle: $('title').text().trim(), css: $('style').map((_, el) => $(el).text()).get().join('\n'), tree: $('body').contents().toArray().map(convert).filter(x => x !== null) };
});
fs.writeFileSync('app/data/original.json', JSON.stringify({home:convert(home('#page')[0]),projects}, null, 2)+'\n');
fs.mkdirSync('public/original/css', {recursive:true});
fs.copyFileSync(path.join(reference, 'css', 'bootstrap.css'), path.join('public/original/css', 'bootstrap.css'));
const originalCss=fs.readFileSync(path.join(reference,'css','styles.css'),'utf8');
// Browsers ignored these three legacy syntax mistakes; normalize them for PostCSS.
fs.writeFileSync('public/original/css/styles.css',originalCss.replaceAll('font color:','color:').replace(/\n\}\s*$/,''));
fs.writeFileSync('scripts/asset-manifest.json', JSON.stringify(Object.fromEntries(assets),null,2)+'\n');
console.log(`Migrated ${projects.length} complete case studies and ${assets.size} asset references.`);
