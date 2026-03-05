const footerCols = [
  {
    title: "Servizi",
    links: ["Agenti Vocali", "Agenti AI Operativi", "Analisi Offerte", "Reportistica Operai", "Gestione Assistenze", "Call Center AI"],
  },
  {
    title: "Azienda",
    links: ["Chi Siamo", "Come Funziona", "Casi d'Uso", "Blog", "Lavora con Noi"],
  },
];

const Footer = () => {
  return (
    <footer className="bg-neutral-900 border-t border-neutral-800 pt-16 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Logo col */}
          <div className="space-y-4">
            <span className="font-display text-[22px] font-extrabold text-white">
              edilizia<span className="text-primary">.io</span>
            </span>
            <p className="text-sm text-neutral-500 leading-relaxed">
              La prima agenzia AI specializzata esclusivamente per il settore edile italiano.
            </p>
            <p className="font-mono text-[11px] text-neutral-600">
              © 2025 Edilizia.io — P.IVA [da inserire]
            </p>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-xs uppercase tracking-wider text-neutral-500 mb-4">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-neutral-400 hover:text-primary transition-colors">{l}</a>
                  </li>
                ))}
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
