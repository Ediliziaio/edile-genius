import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Agenti Vocali", href: "#soluzione" },
  { label: "Agenti AI", href: "#use-cases" },
  { label: "Come Funziona", href: "#come-funziona" },
  { label: "Risultati", href: "#risultati" },
  { label: "Pricing", href: "#pricing" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 60], ["rgba(255,255,255,0)", "rgba(255,255,255,0.97)"]);
  const navShadow = useTransform(scrollY, [0, 60], ["none", "0 1px 0 hsl(214 32% 91%)"]);

  return (
    <motion.nav
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{ backgroundColor: navBg, boxShadow: navShadow }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex flex-col">
          <span className="font-display text-[22px] font-extrabold text-neutral-900">
            edilizia<span className="text-primary">.io</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider bg-primary-light text-primary-dark px-2 py-0.5 rounded-full -mt-0.5 w-fit">
            AI per l'Edilizia
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a href="#" className="text-sm font-medium text-neutral-500 hover:text-primary transition-colors">
            Accedi
          </a>
          <a
            href="#cta-finale"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark hover:scale-[1.02] shadow-button-green transition-all"
          >
            Prenota Demo
          </a>
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
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-base font-medium text-neutral-700 hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#cta-finale"
            onClick={() => setOpen(false)}
            className="block bg-primary text-primary-foreground text-center px-5 py-3 rounded-xl font-bold"
          >
            Prenota Demo
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
