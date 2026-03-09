import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Soluzioni", href: "/soluzioni" },
  { label: "Come Funziona", href: "/come-funziona" },
  { label: "Tariffe", href: "/tariffe" },
  { label: "Garanzia", href: "/garanzia" },
  { label: "Chi Siamo", href: "/chi-siamo" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 60], ["rgba(255,255,255,0)", "rgba(255,255,255,0.97)"]);
  const navShadow = useTransform(scrollY, [0, 60], ["none", "0 1px 0 hsl(214 32% 91%)"]);
  const location = useLocation();

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
          <span className="font-display text-[22px] font-extrabold text-neutral-900">
            edilizia<span className="text-primary">.io</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider bg-primary-light text-primary-dark px-2 py-0.5 rounded-full -mt-0.5 w-fit">
            AI per l'Edilizia
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`relative text-sm font-medium transition-colors group ${isActive ? 'text-primary' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-neutral-500 hover:text-primary transition-colors">
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
