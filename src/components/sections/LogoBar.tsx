const logos = Array.from({ length: 8 }, (_, i) => `Cliente Edile ${i + 1}`);

const stats = [
  { icon: "🏗️", text: "50+ aziende attive" },
  { icon: "📞", text: "100.000+ chiamate gestite" },
  { icon: "⚡", text: "Setup medio: 9 giorni" },
];

const LogoBar = () => {
  return (
    <section className="bg-neutral-50 py-12">
      <p className="text-center font-display text-[13px] font-medium text-neutral-500 uppercase tracking-[0.08em] mb-8">
        Scelto da aziende edili in tutta Italia
      </p>

      {/* Marquee logos */}
      <div className="relative overflow-hidden mb-8">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-neutral-50 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-neutral-50 to-transparent z-10" />
        <div className="flex animate-marquee gap-12 whitespace-nowrap">
          {[...logos, ...logos].map((name, i) => (
            <div
              key={i}
              className="flex-shrink-0 bg-neutral-200 rounded-xl px-8 py-4 text-sm font-medium text-neutral-500"
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap justify-center gap-4">
        {stats.map((s) => (
          <div
            key={s.text}
            className="bg-background border border-neutral-200 rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-700 font-display"
          >
            {s.icon} {s.text}
          </div>
        ))}
      </div>
    </section>
  );
};

export default LogoBar;
