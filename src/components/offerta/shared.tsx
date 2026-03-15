import { useEffect, useRef, useState, ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Star, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

/* ── Framer variants ── */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.35, 1] as const } },
};

/* ── useCountdown ── */
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function useCountdown(key: string) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, expired: false });

  useEffect(() => {
    let stored = localStorage.getItem(key);
    if (!stored) {
      stored = String(Date.now());
      localStorage.setItem(key, stored);
    }
    const deadline = Number(stored) + SEVEN_DAYS;
    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) return setRemaining({ days: 0, hours: 0, minutes: 0, expired: true });
      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [key]);

  return remaining;
}

/* ── useNoIndex ── */
export function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    return () => { meta?.setAttribute("content", "index, follow"); };
  }, []);
}

/* ── AnimatedSection with stagger support ── */
interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  stagger?: boolean;
}

export function AnimatedSection({ children, className = "", id, stagger }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  if (stagger) {
    return (
      <motion.section
        ref={ref}
        id={id}
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className={className}
      >
        {children}
      </motion.section>
    );
  }

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ── Decorative background blob ── */
export function HeroBlob() {
  return (
    <>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
    </>
  );
}

/* ── Dot grid pattern ── */
export function DotPattern({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none opacity-[0.03] ${className}`}
      style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}

/* ── OfferHeader (with integrated section nav) ── */
interface NavLink { label: string; href: string }

interface OfferHeaderProps {
  ctaText: string;
  onCtaClick: () => void;
  navLinks?: NavLink[];
}

export function OfferHeader({ ctaText, onCtaClick, navLinks = [] }: OfferHeaderProps) {
  const [active, setActive] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!navLinks.length) return;
    const ids = navLinks.map((l) => l.href.replace("#", ""));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [navLinks]);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-[68px] items-center justify-between px-4 gap-4">
        {/* Logo — matches homepage Navbar exactly */}
        <Link to="/" className="flex flex-col shrink-0">
          <span className="font-display text-[22px] font-extrabold text-foreground">
            edilizia<span className="text-primary">.io</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full -mt-0.5 w-fit">
            AI per l'Edilizia
          </span>
        </Link>

        {/* Desktop section nav links */}
        {navLinks.length > 0 && (
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navLinks.map((link) => {
              const isActive = active === link.href.replace("#", "");
              return (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={onCtaClick} size="sm" className="shadow-button-green hover:-translate-y-0.5 transition-all text-xs sm:text-sm">
            {ctaText} <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          {navLinks.length > 0 && (
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && navLinks.length > 0 && (
        <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg px-4 py-3 flex flex-wrap gap-2">
          {navLinks.map((link) => {
            const isActive = active === link.href.replace("#", "");
            return (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

/* ── OfferCountdown ── */
interface OfferCountdownProps {
  countdown: { days: number; hours: number; minutes: number; expired: boolean };
  variant?: "light" | "dark";
}

export function OfferCountdown({ countdown, variant = "dark" }: OfferCountdownProps) {
  if (countdown.expired) {
    return <p className="text-sm text-destructive font-medium text-center">⚠️ L'offerta è scaduta — contattaci per verificare la disponibilità</p>;
  }

  const isDark = variant === "dark";
  const textColor = isDark ? "text-background" : "text-foreground";
  const subColor = isDark ? "text-background/50" : "text-muted-foreground";
  const boxBg = isDark ? "bg-background/15 border-background/20" : "bg-primary/10 border-primary/20";

  return (
    <div className="flex flex-col items-center gap-3">
      <p className={`text-sm ${subColor}`}>⏰ Questa offerta scade tra:</p>
      <div className="flex items-center gap-3">
        {[
          { val: countdown.days, label: "giorni" },
          { val: countdown.hours, label: "ore" },
          { val: countdown.minutes, label: "minuti" },
        ].map(({ val, label }) => (
          <div key={label} className="text-center">
            <span className={`block text-3xl font-extrabold font-mono ${textColor} ${boxBg} border rounded-lg px-3 py-2`}>
              {String(val).padStart(2, "0")}
            </span>
            <span className={`text-[10px] uppercase tracking-wider mt-1 block ${subColor}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── OfferGuarantee (strong version — matches homepage Guarantee) ── */
interface OfferGuaranteeProps {
  title?: string;
  children: ReactNode;
}

export function OfferGuarantee({ title, children }: OfferGuaranteeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className="mx-auto max-w-2xl rounded-3xl border-2 border-primary/40 bg-background p-10 md:p-14 text-center"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.06), 0 0 60px hsl(var(--primary) / 0.12)" }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="mx-auto w-[120px] h-[120px] rounded-full bg-primary/10 flex items-center justify-center text-7xl mb-6"
        initial={{ rotateY: 0 }}
        animate={inView ? { rotateY: 360 } : {}}
        transition={{ duration: 0.9 }}
      >
        🛡️
      </motion.div>

      <h2 className="font-display text-[28px] md:text-4xl font-extrabold leading-tight mb-2">
        GARANZIA RIMBORSO<br />
        <span className="text-primary">30 GIORNI</span>
      </h2>
      {title && <p className="text-sm text-muted-foreground mt-1 mb-4">{title}</p>}

      <div className="mt-4 text-lg text-muted-foreground leading-relaxed">{children}</div>

      <p className="mt-6 text-base leading-relaxed">
        <span className="font-bold text-foreground">
          Guadagniamo bene solo quando tu risparmi. Questo è il nostro patto con ogni azienda edile.
        </span>
      </p>
    </motion.div>
  );
}

/* ── OfferCTABanner ── */
interface OfferCTABannerProps {
  headline: ReactNode;
  subtitle: string;
  ctaText: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  countdown: OfferCountdownProps["countdown"];
  footerLink?: { label: string; to: string };
}

export function OfferCTABanner({ headline, subtitle, ctaText, ctaHref, ctaOnClick, countdown, footerLink }: OfferCTABannerProps) {
  return (
    <section id="cta-finale" className="relative bg-foreground py-20 md:py-28 overflow-hidden">
      <DotPattern className="opacity-[0.05]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-2xl font-bold font-display text-background md:text-4xl">{headline}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-background/70">{subtitle}</p>

        {ctaHref ? (
          <Button size="lg" variant="secondary" className="mt-8 text-base px-8 py-6 shadow-lg hover:-translate-y-0.5 transition-all" asChild>
            <a href={ctaHref} target="_blank" rel="noopener noreferrer">{ctaText} <ArrowRight className="ml-1" /></a>
          </Button>
        ) : (
          <Button size="lg" variant="secondary" className="mt-8 text-base px-8 py-6 shadow-lg hover:-translate-y-0.5 transition-all" onClick={ctaOnClick}>
            {ctaText} <ArrowRight className="ml-1" />
          </Button>
        )}

        <div className="mt-8">
          <OfferCountdown countdown={countdown} variant="dark" />
        </div>

        {footerLink && (
          <p className="mt-6 text-sm">
            <Link to={footerLink.to} className="text-background/60 underline hover:text-background/90 transition-colors">
              {footerLink.label}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

/* ── SectionDivider (gradient fade) ── */
export function SectionDivider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />;
}

/* ── OfferBadge ── */
export function OfferBadge({ children }: { children: ReactNode }) {
  return (
    <AnimatedBadge variant="verde" pulse>
      {children}
    </AnimatedBadge>
  );
}

/* ── StarRating ── */
export function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
      ))}
    </div>
  );
}

/* ── LogoBarMini (simplified version for offer pages) ── */
import logoMarchetti from "@/assets/logos/costruzioni-marchetti.png";
import logoSolartech from "@/assets/logos/solartech-italia.png";
import logoFinestre from "@/assets/logos/finestre-italia.png";
import logoTermoidraulica from "@/assets/logos/termoidraulica-verdi.png";
import logoEdilgroup from "@/assets/logos/edilgroup-roma.png";
import logoEnersun from "@/assets/logos/enersun-impianti.png";
import logoSerramenti from "@/assets/logos/serramenti-bianchi.png";
import logoCmb from "@/assets/logos/cmb-edilizia.png";

const miniLogos = [
  { name: "Costruzioni Marchetti", src: logoMarchetti },
  { name: "SolarTech Italia", src: logoSolartech },
  { name: "Finestre Italia", src: logoFinestre },
  { name: "Termoidraulica Verdi", src: logoTermoidraulica },
  { name: "Edilgroup Roma", src: logoEdilgroup },
  { name: "EnerSun Impianti", src: logoEnersun },
  { name: "Serramenti Bianchi", src: logoSerramenti },
  { name: "CMB Edilizia", src: logoCmb },
];

export function LogoBarMini() {
  return (
    <section className="py-10 bg-muted/30 overflow-hidden">
      <p className="text-center font-display text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] mb-6">
        Già scelto da 50+ aziende edili in Italia
      </p>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-muted/30 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-muted/30 to-transparent z-10" />
        <div className="flex animate-marquee gap-8 whitespace-nowrap">
          {[...miniLogos, ...miniLogos].map((logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center justify-center bg-background border border-border/60 rounded-xl px-5 py-3 shadow-sm"
              style={{ minWidth: 140, height: 60 }}
            >
              <img src={logo.src} alt={logo.name} className="h-10 w-auto object-contain opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Imports for cards ── */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Gift } from "lucide-react";

/* ── OfferSectionNav (DEPRECATED — nav is now integrated into OfferHeader) ── */
export function OfferSectionNav({ links: _links }: { links: { label: string; href: string }[] }) {
  return null;
}

/* ── SetupFreeBanner ── */
interface SetupFreeBannerProps {
  setupCost: string;
  expired: boolean;
}

export function SetupFreeBanner({ setupCost, expired }: SetupFreeBannerProps) {
  if (expired) return null;
  return (
    <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center shadow-[0_0_20px_-8px_hsl(var(--primary)/0.2)]">
      <div className="flex items-center justify-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <p className="text-sm font-bold">
          🎁 Setup <span className="line-through text-muted-foreground">{setupCost}</span>{" "}
          <span className="text-primary text-lg">GRATIS</span> — se attivi entro 7 giorni!
        </p>
      </div>
    </div>
  );
}

/* ── PricingCard ── */
interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  setup: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  extra?: string;
  target?: string;
  saving?: string;
  ctaText?: string;
  setupFree?: boolean;
  onCta: () => void;
}

export function PricingCard({ name, price, period, setup, features, highlighted, badge, extra, target, saving, ctaText, setupFree, onCta }: PricingCardProps) {
  return (
    <Card
      className={`relative flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        highlighted
          ? "border-2 border-primary shadow-lg ring-2 ring-primary/20 border-t-4 border-t-primary"
          : "border border-border hover:border-primary/30 border-t-4 border-t-transparent"
      }`}
    >
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground whitespace-nowrap shadow-md px-3 py-1">{badge}</Badge>
        </div>
      )}
      <CardHeader className="text-center pt-8 pb-2">
        <CardTitle className="text-xl font-display">{name}</CardTitle>
        {target && <p className="text-xs text-muted-foreground mt-1">{target}</p>}
        <div className="pt-2">
          <span className="text-4xl font-extrabold">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        {setupFree ? (
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground line-through">Setup: {setup}</p>
            <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 shadow-sm">GRATIS</Badge>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Setup: {setup}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="flex-1 space-y-2.5 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {extra && <p className="text-xs text-muted-foreground text-center">{extra}</p>}
        {saving && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-primary">💰 {saving}</p>
          </div>
        )}
        <Button className="w-full" variant={highlighted ? "default" : "outline"} onClick={onCta}>
          {ctaText || `Attiva ${name}`} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
