const AnnouncementBar = () => {
  const text = "🔥 La 1ª Agenzia di Licenziamento AI per l'Edilizia  •  Sostituisci dipendenti improduttivi con Agenti AI  •  -60% costi del personale garantito  •  Setup in 7 giorni  •  Garanzia rimborso 30 giorni  •  ";

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
        Scopri Chi Puoi Sostituire →
      </a>
    </div>
  );
};

export default AnnouncementBar;
