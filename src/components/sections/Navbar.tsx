import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Wrench, Building, Building2, Factory, DoorOpen, Sun, Hammer, HardHat, Grid3x3, Umbrella, Droplets, Zap, PaintBucket, Compass } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Soluzioni", href: "/soluzioni" },
  { label: "Come Funziona", href: "/come-funziona" },
  { label: "Tariffe", href: "/tariffe" },
  { label: "Garanzia", href: "/garanzia" },
  { label: "Chi Siamo", href: "/chi-siamo" },
];

const dimensioneItems = [
  { label: "Artigiani e Micro Imprese", slug: "artigiani-micro-imprese", icon: Wrench },
  { label: "Piccole Imprese", slug: "piccole-imprese", icon: Building },
  { label: "Medie Imprese", slug: "medie-imprese", icon: Building2 },
  { label: "Grandi Aziende", slug: "grandi-aziende-general-contractor", icon: Factory },
];

const settoreItems = [
  { label: "Serramentisti e Infissi", slug: "serramentisti-infissi", icon: DoorOpen },
  { label: "Installatori Fotovoltaico", slug: "installatori-fotovoltaico", icon: Sun },
  { label: "Imprese di Ristrutturazione", slug: "imprese-ristrutturazione", icon: Hammer },
  { label: "Imprese Edili Generali", slug: "imprese-edili-generali", icon: HardHat },
  { label: "Posatori e Pavimentisti", slug: "posatori-pavimentisti", icon: Grid3x3 },
  { label: "Lattonieri e Coperture", slug: "lattonieri-coperture", icon: Umbrella },
  { label: "Impianti Idraulici e Termici", slug: "impianti-idraulici-termici", icon: Droplets },
  { label: "Impianti Elettrici", slug: "impianti-elettrici", icon: Zap },
  { label: "Cartongessisti e Finiture", slug: "cartongessisti-finiture", icon: PaintBucket },
  { label: "Progettisti e Studi Tecnici", slug: "progettisti-studi-tecnici", icon: Compass },
];

interface NavbarProps {
  variant?: "light" | "dark";
}

const Navbar = ({ variant = "light" }: NavbarProps) => {
  const isDark = variant === "dark";
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileSectorOpen, setMobileSectorOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 60], ["rgba(255,255,255,0)", "rgba(255,255,255,0.97)"]);
  const navShadow = useTransform(scrollY, [0, 60], ["none", "0 1px 0 hsl(214 32% 91%)"]);
  const location = useLocation();

  // Close mega-menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMegaOpen(false);
    setOpen(false);
    setMobileSectorOpen(false);
  }, [location.pathname]);

  return (
    <motion.nav
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{ backgroundColor: navBg, boxShadow: navShadow }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
        <Link to="/" className="flex flex-col">
          <span className={`font-display text-[22px] font-extrabold ${isDark ? "text-white" : "text-neutral-900"}`}>
            edilizia<span className="text-primary">.io</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider bg-primary-light text-primary-dark px-2 py-0.5 rounded-full -mt-0.5 w-fit">
            AI per l'Edilizia
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {/* Per Chi È - Mega Menu */}
          <div ref={megaRef} className="relative">
            <button
              onClick={() => setMegaOpen(!megaOpen)}
              className={`relative text-sm font-medium transition-colors flex items-center gap-1 ${
                location.pathname.startsWith("/per-chi-e") ? "text-primary" : isDark ? "text-neutral-300 hover:text-white" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Per Chi È
              <ChevronDown size={14} className={`transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {megaOpen && (
                <motion.div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-background rounded-2xl border border-border shadow-xl p-6 w-[640px] z-50"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-2 gap-6">
                    {/* Col 1 - Dimensione */}
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-3 block">
                        Dimensione Azienda
                      </span>
                      <div className="space-y-1">
                        {dimensioneItems.map(item => (
                          <Link
                            key={item.slug}
                            to={`/per-chi-e/${item.slug}`}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-light/60 transition-colors group"
                          >
                            <item.icon size={18} className="text-primary" />
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Col 2 - Settore */}
                    <div className="border-l border-border pl-6">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-3 block">
                        Per Settore
                      </span>
                      <div className="space-y-1">
                        {settoreItems.map(item => (
                          <Link
                            key={item.slug}
                            to={`/per-chi-e/${item.slug}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-light/60 transition-colors group"
                          >
                            <item.icon size={16} className="text-primary" />
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom CTA */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link
                      to="/per-chi-e"
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Vedi tutte le categorie →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`relative text-sm font-medium transition-colors group ${isActive ? 'text-primary' : isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className={`text-sm font-medium ${isDark ? "text-neutral-300 hover:text-white" : "text-neutral-500 hover:text-primary"} transition-colors`}>
            Accedi
          </Link>
          <Link
            to="/soluzioni"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark hover:scale-[1.02] shadow-button-green transition-all"
          >
            Prenota Demo
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-neutral-900" aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <motion.div
          className="md:hidden bg-background border-t border-border px-6 py-6 space-y-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          {/* Per Chi È accordion */}
          <div>
            <button
              onClick={() => setMobileSectorOpen(!mobileSectorOpen)}
              className={`flex items-center justify-between w-full text-base font-medium ${
                location.pathname.startsWith("/per-chi-e") ? "text-primary" : "text-neutral-700"
              }`}
            >
              Per Chi È
              <ChevronDown size={16} className={`transition-transform ${mobileSectorOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {mobileSectorOpen && (
                <motion.div
                  className="mt-3 pl-2 space-y-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-2">Dimensione</span>
                  {dimensioneItems.map(item => (
                    <Link key={item.slug} to={`/per-chi-e/${item.slug}`} onClick={() => setOpen(false)}
                      className="flex items-center gap-2 py-1.5 text-sm text-neutral-600 hover:text-primary">
                      <item.icon size={14} className="text-primary" />
                      {item.label}
                    </Link>
                  ))}
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mt-3 mb-2">Settore</span>
                  {settoreItems.map(item => (
                    <Link key={item.slug} to={`/per-chi-e/${item.slug}`} onClick={() => setOpen(false)}
                      className="flex items-center gap-2 py-1.5 text-sm text-neutral-600 hover:text-primary">
                      <item.icon size={14} className="text-primary" />
                      {item.label}
                    </Link>
                  ))}
                  <Link to="/per-chi-e" onClick={() => setOpen(false)}
                    className="block text-sm font-semibold text-primary mt-2">
                    Tutte le categorie →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className={`block text-base font-medium ${isActive ? 'text-primary' : 'text-neutral-700 hover:text-primary'}`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/soluzioni"
            onClick={() => setOpen(false)}
            className="block bg-primary text-primary-foreground text-center px-5 py-3 rounded-xl font-bold"
          >
            Prenota Demo
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
