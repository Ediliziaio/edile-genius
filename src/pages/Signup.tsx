import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isSuperAdmin, isCompanyUser, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      if (isSuperAdmin) navigate("/superadmin", { replace: true });
      else if (isCompanyUser) navigate("/app", { replace: true });
    }
  }, [user, loading, isSuperAdmin, isCompanyUser, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password troppo corta", description: "Minimo 6 caratteri.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    try {
      // 1. Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registrazione fallita");

      // 2. Auto-provision company via edge function
      const { error: provError } = await supabase.functions.invoke("self-service-signup", {
        body: { company_name: companyName, user_id: authData.user.id, full_name: fullName },
      });

      if (provError) {
        console.error("Provisioning error:", provError);
        // User is created but company provisioning failed - still let them in
        // SuperAdmin can fix manually
      }

      toast({
        title: "Account creato! 🎉",
        description: "Benvenuto in edilizia.io — accedi per iniziare.",
      });

      // Auto-login happens via onAuthStateChange
    } catch (err: any) {
      const msg = err?.message?.includes("already registered")
        ? "Questa email è già registrata. Prova ad accedere."
        : err?.message || "Errore durante la registrazione.";
      toast({ title: "Errore", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-ink-50 relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.35]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#3ECF6E" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <span className="text-[22px] font-bold text-ink-900">
            edilizia<span className="text-brand">.io</span>
          </span>
        </div>

        <div className="w-full rounded-card p-10 bg-white border border-ink-200 shadow-card">
          <h1 className="text-xl font-semibold mb-1 text-ink-900">Crea il tuo account</h1>
          <p className="text-sm mb-8 text-ink-400">Inizia la prova gratuita — nessuna carta richiesta</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink-600">Nome completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Mario Rossi"
                required
                className="w-full rounded-btn px-3.5 py-2.5 text-sm outline-none transition-colors bg-ink-50 border border-ink-200 text-ink-900 placeholder:text-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink-600">Nome azienda</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Rossi Serramenti srl"
                required
                className="w-full rounded-btn px-3.5 py-2.5 text-sm outline-none transition-colors bg-ink-50 border border-ink-200 text-ink-900 placeholder:text-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la.tua@email.com"
                required
                className="w-full rounded-btn px-3.5 py-2.5 text-sm outline-none transition-colors bg-ink-50 border border-ink-200 text-ink-900 placeholder:text-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink-600">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  required
                  minLength={6}
                  className="w-full rounded-btn px-3.5 py-2.5 text-sm outline-none transition-colors pr-10 bg-ink-50 border border-ink-200 text-ink-900 placeholder:text-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-btn py-2.5 text-sm font-medium transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-brand text-white shadow-button-green"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? "Creazione in corso..." : "Inizia Gratis"}
            </button>
          </form>

          <p className="text-center text-sm mt-6 text-ink-400">
            Hai già un account?{" "}
            <Link to="/login" className="text-brand font-medium hover:underline">Accedi</Link>
          </p>

          <p className="text-center text-xs mt-4 text-ink-400">
            Registrandoti, accetti i Termini di Servizio e la Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
