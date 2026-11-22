// Genera public/llms-full.txt dai dati del sito (servizi, soluzioni, per chi è, FAQ).
// Uso: npx esbuild scripts/gen-llms-full.ts --bundle --platform=node --outfile=/tmp/x.cjs && node /tmp/x.cjs
import { writeFileSync } from "node:fs";
import { SERVIZI, FAQ_SERVIZI, METODO } from "../src/data/servizi";
import { SERVIZI_DETTAGLIO } from "../src/data/serviziDettaglio";
import { solutions, settoreConfig } from "../src/data/solutions";
import { perChiECategories } from "../src/data/perChiE";
import { FAQ_HOME } from "../src/data/faqHome";

const B = "https://edilizia.io";
const L: string[] = [];
const p = (s = "") => L.push(s);

p("# Edilizia.io — testo completo per motori di ricerca e assistenti AI");
p();
p("> Edilizia.io (gruppo AEDIX) sviluppa sistemi di intelligenza artificiale su misura per imprese edili, serramentisti, installatori, general contractor e per architetti, ingegneri e geometri. Non fa progettazione edilizia: fornisce gli strumenti AI ai tecnici, il progetto e la firma restano del professionista. Non pubblica un listino: i costi si definiscono su misura dopo una consulenza gratuita. Primo sistema attivo in circa 7 giorni. Garanzia: se entro 30 giorni il sistema non raggiunge i risultati concordati, rimborsa quanto pagato per quel sistema. Il gestionale del gruppo è EdiliziaInCloud.");
p();
p("Contatti: info@edilizia.io — consulenza gratuita: " + B + "/#cta-finale");
p();
p("## Domande frequenti");
for (const f of FAQ_HOME) { p(`### ${f.q}`); p(f.a); p(); }

p("## Servizi");
for (const s of SERVIZI) {
  const d = SERVIZI_DETTAGLIO.find((x) => x.slug === s.slug);
  p(`### ${s.titolo}`);
  p(`URL: ${B}/servizi/${s.slug}`);
  p(s.sintesi);
  p(`Per chi: ${s.perChi}`);
  p("Cosa fa:");
  for (const c of d?.capacita ?? []) p(`- ${c.titolo}: ${c.testo}`);
  if (!d) for (const c of s.cosaFacciamo) p(`- ${c}`);
  p(`Risultato: ${s.risultato}`);
  if (d?.faq.length) {
    p("Domande frequenti:");
    for (const f of d.faq) p(`- ${f.q} ${f.a}`);
  }
  p();
}

p("## Metodo di lavoro");
for (const m of METODO) p(`${m.n}. ${m.titolo}: ${m.testo}`);
p();
p("## Domande frequenti sui servizi");
for (const f of FAQ_SERVIZI) { p(`### ${f.q}`); p(f.a); p(); }

p(`## Soluzioni (${solutions.length})`);
p(`Catalogo: ${B}/soluzioni`);
for (const s of solutions) {
  p(`### ${s.title} [${settoreConfig[s.settore].label}]`);
  p(s.description);
  for (const b of s.bullets) p(`- ${b}`);
  p(`Ideale per: ${s.idealFor.join(", ")}`);
  p();
}

p("## Per chi è");
for (const c of perChiECategories) {
  p(`### ${c.name}`);
  p(`URL: ${B}/per-chi-e/${c.slug}`);
  p(c.heroSubtitle);
  for (const sv of c.services) p(`- ${sv.title}: ${sv.description}`);
  p();
}

writeFileSync("public/llms-full.txt", L.join("\n"));
console.log("llms-full.txt:", L.length, "righe");
