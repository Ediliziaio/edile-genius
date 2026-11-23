import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const urls=[...fs.readFileSync('public/sitemap.xml','utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const titles=new Set();
for(const url of urls){
 const u=new URL(url); const file=path.join('dist',u.pathname==='/'?'index.html':u.pathname+'.html'); const html=fs.readFileSync(file,'utf8');
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,url+' h1');
 assert.ok(html.includes('href="'+url+'"'),url+' canonical');
 const title=html.match(/<title[^>]*>(.*?)<\/title>/)?.[1];assert.ok(title,url+' title');assert.ok(!titles.has(title),url+' duplicate title');titles.add(title);
 assert.ok(!/<meta[^>]*name="robots"[^>]*content="noindex/.test(html),url+' noindex');
 for(const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))JSON.parse(match[1]);
}
for(const slug of ['confrontare-offerte-fornitori-ai-edilizia','rapportini-cantiere-voce-ai','computo-metrico-ai-prezzari-controlli','render-ai-ristrutturazione-foto-progetto']){
 const content=fs.readFileSync('src/content/blog/'+slug+'.md','utf8'); const words=content.replace(/^##.*$/gm,'').replace(/<[^>]+>/g,'').split(/\s+/).filter(Boolean).length;
 assert.ok(words>=2000,slug+' minimum words'); const html=fs.readFileSync('dist/blog/'+slug+'.html','utf8');
 assert.ok(html.includes('mainEntityOfPage'),slug+' article schema'); assert.ok(html.includes('FAQPage'),slug+' visible FAQ schema'); assert.ok(html.includes('https://edilizia.io/blog/covers/'),slug+' original image');
 assert.ok(html.includes('eic_public_route_change')===false,'No manual route events embedded in page');
}
const index=fs.readFileSync('index.html','utf8');assert.ok(!index.includes('facebook.com/tr'));assert.ok(!index.includes('fbq(\'init\''));assert.ok(!index.includes('gtag(\'config\''));
console.log(JSON.stringify({sitemapUrls:urls.length,uniqueTitles:titles.size,newArticles:4,minWords:2000,result:'PASS'}));
