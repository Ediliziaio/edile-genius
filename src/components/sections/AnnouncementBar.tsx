const AnnouncementBar = () => {
  const text = "⚡ Solo 12 aziende edili accettate ogni mese  •  Setup completato in 7 giorni  •  Agenti AI attivi 24/7 — zero lead persi  •  Garanzia rimborso 30 giorni  •  Primo a muoversi, primo a vincere il mercato  •  ";

  return (
    <div className="bg-primary h-11 flex items-center overflow-hidden relative">
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          <span className="font-mono text-xs uppercase tracking-[0.08em] font-medium text-neutral-900">
            {text}{text}
          </span>
        </div>
      </div>
      <a
        href="#cta-finale"
        className="flex-shrink-0 px-4 text-white text-xs font-medium underline hover:opacity-75 transition-opacity font-mono"
      >
        Prenota Demo Gratuita →
      </a>
    </div>
  );
};

export default AnnouncementBar;
