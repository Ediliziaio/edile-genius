import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";

type FooterLink = string | { label: string; href: string };

const footerCols: { title: string; links: FooterLink[] }[] = [
  {
    title: "Servizi",
    links: [
      { label: "Automazione AI", href: "/servizi/automazione-ai" },
      { label: "Preventivazione AI", href: "/servizi/preventivazione-ai" },
      { label: "Render AI", href: "/servizi/render-ai" },
      { label: "Gare e appalti", href: "/servizi/gare-e-appalti-ai" },
      { label: "Sicurezza e conformità", href: "/servizi/sicurezza-e-conformita-ai" },
      { label: "AI per progettisti", href: "/servizi/ai-per-progettisti" },
      { label: "Cantiere e acquisti", href: "/servizi/cantiere-e-acquisti-ai" },
      { label: "Marketing AI", href: "/servizi/marketing-e-vendite-ai" },
      { label: "Controllo margini", href: "/servizi/controllo-e-analisi" },
      { label: "Sistemi su misura", href: "/servizi/progettazione-sistemi-ai" },
      { label: "Consulenza AI", href: "/servizi/consulenza-ai" },
      { label: "Formazione", href: "/servizi/formazione-e-affiancamento" },
    ],
  },
  {
    title: "Azienda",
    links: [
      { label: "Chi Siamo", href: "/chi-siamo" },
      { label: "Come Funziona", href: "/come-funziona" },
      { label: "Soluzioni", href: "/soluzioni" },
      { label: "Blog", href: "/blog" },
      { label: "Per Chi È", href: "/per-chi-e" },
      { label: "EdiliziaInCloud", href: "/edilizia-in-cloud" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-neutral-900 border-t border-neutral-800 pt-16 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 md:gap-10 mb-10">
          {/* Logo col */}
          <div className="space-y-4">
            <img src={logoWhite} alt="Edilizia.io" className="h-20 w-auto" />
            <p className="text-sm text-neutral-500 leading-relaxed">
              Sistemi di intelligenza artificiale per imprese edili, architetti, ingegneri e geometri.
            </p>
            <p className="font-mono text-[11px] text-neutral-600">
              © {new Date().getFullYear()} Edilizia.io — P.IVA [da inserire]
            </p>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-4">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => {
                  const label = typeof l === "string" ? l : l.label;
                  const href = typeof l === "string" ? "#" : l.href;
                  return (
                    <li key={label}>
                      <Link to={href} className="text-sm text-neutral-400 hover:text-primary transition-colors">{label}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Contatti */}
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-4">Contatti</p>
            <ul className="space-y-2">
              <li><a href="mailto:info@edilizia.io" className="text-sm text-neutral-400 hover:text-primary transition-colors">info@edilizia.io</a></li>
              <li><Link to="/#cta-finale" className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors">Prenota la consulenza gratuita →</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-6 flex flex-wrap gap-4 justify-center">
          {[
            { label: "Privacy Policy", href: "/privacy-policy" },
            { label: "Cookie Policy", href: "/cookie-policy" },
            { label: "Termini di Servizio", href: "/termini-di-servizio" },
          ].map((t) => (
            <Link key={t.label} to={t.href} className="font-mono text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors">
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
