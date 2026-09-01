import { readFile, writeFile, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist-pages/', root);
const { projects } = JSON.parse(await readFile(new URL('app/data/original.json', root), 'utf8'));
const template = await readFile(new URL('index.html', output), 'utf8');
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const seen = new Set();

for (const { slug, title } of projects) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || seen.has(slug)) {
    throw new Error(`Invalid or duplicate project route: ${slug}`);
  }
  seen.add(slug);
  const directory = new URL(`${slug}/`, output);
  await mkdir(directory, { recursive: true });
  const html = template.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)} — curtis.is</title>`);
  await writeFile(new URL('index.html', directory), html);
}

// Unknown URLs retain an HTTP 404; known projects have their own real documents.
await writeFile(new URL('404.html', output), template);
await writeFile(new URL('.nojekyll', output), '');
console.log(`Generated ${seen.size} project pages for GitHub Pages.`);
