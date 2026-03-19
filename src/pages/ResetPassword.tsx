import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import logoGreen from "@/assets/logo-green.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setHasRecoveryToken(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasRecoveryToken(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password troppo corta", description: "Minimo 6 caratteri.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Le password non corrispondono", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setDone(true);
      setTimeout(() => navigate("/app", { replace: true }), 2000);
    }
    setIsLoading(false);
  };

  if (!hasRecoveryToken && !done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-ink-50">
        <div className="w-full max-w-[400px] rounded-card p-10 bg-white border border-ink-200 shadow-card text-center">
          <h1 className="text-xl font-semibold text-ink-900 mb-2">Link non valido</h1>
          <p className="text-sm text-ink-400 mb-6">
            Questo link non è valido o è scaduto. Richiedi un nuovo link di reset.
          </p>
          <Link to="/forgot-password" className="text-brand font-medium hover:underline text-sm">
            Richiedi nuovo link
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <span className="text-[22px] font-bold text-ink-900">
            edilizia<span className="text-brand">.io</span>
          </span>
        </div>

        <div className="w-full rounded-card p-10 bg-white border border-ink-200 shadow-card">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-brand mx-auto" />
              <h1 className="text-xl font-semibold text-ink-900">Password aggiornata!</h1>
              <p className="text-sm text-ink-400">Reindirizzamento alla dashboard...</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold mb-1 text-ink-900">Nuova password</h1>
              <p className="text-sm mb-8 text-ink-400">Scegli una nuova password per il tuo account.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-ink-600">Nuova password</label>
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

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-ink-600">Conferma password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Ripeti la password"
                    required
                    className="w-full rounded-btn px-3.5 py-2.5 text-sm outline-none transition-colors bg-ink-50 border border-ink-200 text-ink-900 placeholder:text-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-btn py-2.5 text-sm font-medium transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-brand text-white shadow-button-green"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLoading ? "Aggiornamento..." : "Salva nuova password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
