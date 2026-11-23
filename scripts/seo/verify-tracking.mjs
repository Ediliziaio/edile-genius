import {JSDOM, VirtualConsole} from 'jsdom';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const files=['analytics-config.js','analytics-boundary.js','analytics-loader.js','analytics-consent.js'];
const source=Object.fromEntries(files.map(f=>[f,fs.readFileSync('public/'+f,'utf8')]));
const results=[];
function env(url='https://edilizia.io/',stored=null,storageFails=false){
 const dom=new JSDOM('<html><head></head><body><a href="/login">Accedi</a></body></html>',{url,runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 const w=dom.window;
 if(stored)w.localStorage.setItem('edilizia-io-consent-v1',JSON.stringify(stored));
 if(storageFails)w.Storage.prototype.setItem=()=>{throw Error('blocked');};
 for(const f of files)w.eval(source[f]);
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {w,d:w.document,dom,external(){return [...w.document.scripts].filter(s=>/^https:/.test(s.src));}};
}
const choice=(a,m=false,days=0)=>({v:1,necessary:true,analytics:a,marketing:m,decidedAt:new Date(Date.now()-days*86400000).toISOString()});
function run(name,fn){fn();results.push(name);}
run('No Google or Meta before a choice; accessible banner and equal refusal',()=>{const e=env();assert.equal(e.external().length,0);assert.equal(e.d.querySelectorAll('[role="dialog"] button').length,3);assert.equal(e.w.EICAnalytics.isTrackable(),false);e.dom.window.close();});
run('Refusal persists and requests no tracking scripts',()=>{const e=env();[...e.d.querySelectorAll('button')].find(x=>x.textContent==='Rifiuta').click();assert.equal(e.external().length,0);assert.equal(JSON.parse(e.w.localStorage.getItem('edilizia-io-consent-v1')).analytics,false);e.dom.window.close();});
run('Analytics-only opt-in starts one GTM and no Meta or standalone GA',()=>{const e=env('https://edilizia.io/blog',choice(true));assert.equal(e.external().length,1);assert.ok(e.external()[0].src.includes('id=GTM-5R542S6X'));e.w.EICAnalytics.updateConsent({analytics:true});e.w.eval(source['analytics-loader.js']);assert.equal(e.external().length,1);assert.equal(e.w.EICAnalytics.getState().googleConsent.ad_storage,'denied');assert.ok(!JSON.stringify(e.w.dataLayer).includes('page_view'));e.dom.window.close();});
run('Marketing is separate; existing pixel loaded once',()=>{const e=env('https://edilizia.io/',choice(false,true));assert.equal(e.external().length,1);assert.ok(e.external()[0].src.includes('fbevents.js'));assert.equal(e.w.EICAnalytics.isTrackable(),false);assert.ok(e.w.fbq.queue.some(x=>x[0]==='init'&&x[1]==='912028060826443'));e.dom.window.close();});
for(const route of ['/login','/signup','/app','/app/dashboard','/superadmin','/s/example','/reset-password','/accetta-invito','/unexpected','/?email=example%40example.invalid']){
 run('No tracking in '+route,()=>{const e=env('https://edilizia.io'+route,choice(true,true));assert.equal(e.external().length,0);assert.equal(e.d.querySelector('[role="dialog"]'),null);e.dom.window.close();});
}
for(const host of ['app.edilizia.io','admin.edilizia.io','ediliziaio.pages.dev','localhost']){
 run('No tracking on '+host,()=>{const e=env('https://'+host+'/',choice(true,true));assert.equal(e.external().length,0);e.dom.window.close();});
}
run('Expired and future consent fail closed',()=>{for(const c of [choice(true,true,183),choice(true,true,-1)]){const e=env('https://edilizia.io/',c);assert.equal(e.external().length,0);assert.ok(e.d.querySelector('[role="dialog"]'));e.dom.window.close();}});
run('Blocked storage cannot activate optional cookies',()=>{const e=env('https://edilizia.io/',null,true);[...e.d.querySelectorAll('button')].find(x=>x.textContent==='Accetta').click();assert.equal(e.external().length,0);assert.equal(e.w.EICAnalytics.isTrackable(),false);assert.ok(e.d.querySelector('[role="status"]').textContent);e.dom.window.close();});
run('Public to private navigation disables GA before entering the app',()=>{const e=env('https://edilizia.io/blog',choice(true));e.w.history.pushState({},'', '/login');assert.equal(e.w['ga-disable-G-B2D85PDZCZ'],true);assert.equal(e.w.EICAnalyticsBoundary.getState().transitioning,true);assert.equal(e.w.location.pathname,'/blog');e.dom.window.close();});
run('Page context removes all query parameters and fragments',()=>{const e=env('https://edilizia.io/blog?utm_source=example#section',choice(true));assert.equal(e.w.EICAnalytics.getPageContext().page_location,'https://edilizia.io/blog');assert.equal(e.w.EICAnalytics.getPageContext().page_title,'Edilizia.io');e.dom.window.close();});
run('Revocation disables measurement and removes analytics cookies',()=>{const e=env('https://edilizia.io/',choice(true));e.d.cookie='_ga=sample; path=/';e.w.EICAnalytics.updateConsent({analytics:false});assert.equal(e.w['ga-disable-G-B2D85PDZCZ'],true);assert.ok(!e.d.cookie.includes('_ga='));assert.equal(e.w.EICAnalytics.getState().reloadRequired,true);e.dom.window.close();});
console.log(JSON.stringify({tests:results.length,result:'PASS',cases:results},null,2));
