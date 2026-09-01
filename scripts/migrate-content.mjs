import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const reference = path.resolve('../source-reference');
const output = path.resolve('app/data/projects.json');
const assetRoot = path.resolve('public/case-studies');
const clean = (value = '') => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const projects = [];

for (let index = 1; index <= 10; index += 1) {
  const slug = `work-${index}`;
  const $ = cheerio.load(fs.readFileSync(path.join(reference, `${slug}.html`), 'utf8'));
  const heroNode = $('#project-header img').first();
  const blocks = [];
  $('#project-details').find('h2, h3, h4, p, img, video').each((_, node) => {
    const element = $(node);
    if (node.tagName === 'img') {
      const source = (element.attr('src') || '').replace(/^\.\/images\//, '');
      if (source && fs.existsSync(path.join(assetRoot, source))) blocks.push({ type: 'image', source, alt: clean(element.attr('alt')) });
      return;
    }
    if (node.tagName === 'video') {
      const source = (element.attr('src') || element.find('source').attr('src') || '').replace(/^\.\/images\//, '');
      if (source && fs.existsSync(path.join(assetRoot, source))) blocks.push({ type: 'video', source });
      return;
    }
    const text = clean(element.text());
    if (!text || text === clean(element.parent().text()) && element.parents('p').length) return;
    blocks.push({ type: node.tagName.startsWith('h') ? 'heading' : 'paragraph', text });
  });
  projects.push({
    slug,
    browserTitle: clean($('title').text()),
    title: clean($('#project-title').first().text()) || clean($('h2').first().text()),
    hero: (heroNode.attr('src') || '').replace(/^\.\/images\//, ''),
    heroAlt: clean(heroNode.attr('alt')),
    blocks,
  });
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(projects, null, 2)}\n`);
