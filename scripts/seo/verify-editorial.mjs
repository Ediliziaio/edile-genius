import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const refreshed = {
  'agenti-vocali-ai-edilizia': '2025-06-15',
  'intelligenza-artificiale-serramenti': '2025-06-10',
  'automazione-preventivi-edilizia': '2025-06-05',
};
const blogUrls = [...fs.readFileSync('public/sitemap.xml', 'utf8').matchAll(/<loc>(https:\/\/edilizia.io\/blog\/[^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(blogUrls.length, 17);
const results = [];
const relatedSelections = new Set();
for (const url of blogUrls) {
  const slug = url.split('/').pop();
  const html = fs.readFileSync(path.join('dist/blog', slug + '.html'), 'utf8');
  const nodes = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((match) => {
    const value = JSON.parse(match[1]); return value['@graph'] || [value];
  });
  const article = nodes.find((node) => node['@type'] === 'Article');
  assert.ok(article, slug + ' article schema');
  const image = typeof article.image === 'string' ? article.image : article.image.url;
  assert.ok(image.startsWith('https://edilizia.io/'), slug + ' absolute article image');
  assert.ok(fs.existsSync(path.join('dist', new URL(image).pathname)), slug + ' image exists');
  assert.ok(/<meta[^>]*property="og:image"[^>]*content="https:\/\/edilizia.io\//.test(html), slug + ' absolute OG image');
  const relatedHtml = html.slice(html.indexOf('Articoli correlati'));
  const related = [...relatedHtml.matchAll(/href="\/blog\/([^"#?]+)"/g)].map((match) => match[1]);
  assert.equal(related.length, 3, slug + ' three related links');
  assert.equal(new Set(related).size, 3, slug + ' unique related links');
  assert.ok(!related.includes(slug), slug + ' no self link in related posts');
  for (const link of related) assert.ok(fs.existsSync(path.join('dist/blog', link + '.html')), link + ' related page exists');
  relatedSelections.add(related.join(','));
  if (refreshed[slug]) {
    assert.ok(article.wordCount >= 2000, slug + ' minimum body words');
    assert.equal(article.datePublished, refreshed[slug], slug + ' original date preserved');
    assert.equal(article.dateModified, '2026-11-23', slug + ' substantive revision date');
    assert.ok(html.includes('datetime="2026-11-23"'), slug + ' visible revision date');
    assert.ok(html.includes('1440w') && html.includes('480w'), slug + ' responsive cover');
    assert.equal(article.image.width, 1440);
    assert.equal(article.image.height, 900);
    const body = [...html.matchAll(/<section[^>]*id="section-\d+"[^>]*>([\s\S]*?)<\/section>/g)].map((match) => match[1]).join(' ');
    assert.ok(!/Osservatorio Edilizia Digitale|medie reali di 340|\+87%|Triplicare i Preventivi/.test(body), slug + ' superseded claims removed');
    results.push({ slug, bodyWords: article.wordCount, related });
  }
}
assert.ok(relatedSelections.size > 3, 'Related posts vary by subject across the blog');
const estimatesHtml = fs.readFileSync('dist/blog/automazione-preventivi-edilizia.html', 'utf8');
assert.ok(estimatesHtml.includes('id="quote-time-heading"'));
assert.ok(estimatesHtml.replace(/<!--[\s\S]*?-->/g, '').includes('15 ore/mese in meno'));
for (const field of ['count', 'before', 'trial']) assert.ok(estimatesHtml.includes('id="quote-time-' + field + '"'));
console.log(JSON.stringify({ result: 'PASS', blogPages: blogUrls.length, distinctRelatedSelections: relatedSelections.size, refreshed: results }, null, 2));
