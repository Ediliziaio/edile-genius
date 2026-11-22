const AnnouncementBar = () => {
  const text = "Sistemi di intelligenza artificiale per l'edilizia  •  Automazione, preventivi e render AI  •  Strumenti AI per architetti, ingegneri e geometri  •  Consulenza AI  •  Primo sistema attivo in 7 giorni  •  Garanzia 30 giorni  •  ";

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
        className="hidden sm:flex flex-shrink-0 px-4 text-white text-xs font-medium underline hover:opacity-75 transition-opacity font-mono"
      >
        Prenota la consulenza →
      </a>
    </div>
  );
};

export default AnnouncementBar;
