import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";

type FooterLink = string | { label: string; href: string };

const footerCols: { title: string; links: FooterLink[] }[] = [
  {
    title: "Servizi",
    links: [
      { label: "Agenti Vocali", href: "/soluzioni" },
      { label: "Agenti AI Operativi", href: "/soluzioni" },
      { label: "Analisi Offerte", href: "/soluzioni" },
      { label: "Reportistica Operai", href: "/soluzioni" },
      { label: "Gestione Assistenze", href: "/soluzioni" },
      { label: "Call Center AI", href: "/soluzioni" },
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
            <img src={logoWhite} alt="Edilizia.io" className="h-10 w-auto" />
            <p className="text-sm text-neutral-500 leading-relaxed">
              La prima azienda AI specializzata esclusivamente per il settore edile italiano.
            </p>
            <p className="font-mono text-[11px] text-neutral-600">
              © 2025 Edilizia.io — P.IVA [da inserire]
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
              <li><a href="#cta-finale" className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors">Prenota Demo Gratuita →</a></li>
              <li className="flex gap-3 pt-2">
                <a href="#" className="text-sm text-neutral-400 hover:text-primary transition-colors">LinkedIn</a>
                <a href="#" className="text-sm text-neutral-400 hover:text-primary transition-colors">Instagram</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-6 flex flex-wrap gap-4 justify-center">
          {["Privacy Policy", "Cookie Policy", "Termini di Servizio"].map((t) => (
            <a key={t} href="#" className="font-mono text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors">
              {t}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
