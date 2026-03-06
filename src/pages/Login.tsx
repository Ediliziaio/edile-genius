import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { user, isSuperAdmin, isCompanyUser, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (isSuperAdmin) navigate("/superadmin", { replace: true });
      else if (isCompanyUser) navigate("/app", { replace: true });
    }
  }, [user, loading, isSuperAdmin, isCompanyUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasError(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setHasError(true);
      toast({
        title: "Credenziali non valide",
        description: "Controlla email e password e riprova.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Auth state change listener will handle redirect
    setIsLoading(false);
  };

  return (
    <div className="dark-app min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "hsl(var(--app-bg-primary))" }}>
      {/* Logo */}
      <div className="mb-8 text-center">
        <span className="text-[22px] font-bold" style={{ color: "hsl(var(--app-text-primary))" }}>
          EdiliziaInCloud<span style={{ color: "hsl(var(--app-brand))" }}>.</span>
        </span>
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-[400px] rounded-2xl p-10"
        style={{
          backgroundColor: "hsl(var(--app-bg-tertiary))",
          border: "1px solid hsl(var(--app-border-subtle))",
        }}
      >
        <h1 className="text-xl font-semibold mb-1" style={{ color: "hsl(var(--app-text-primary))" }}>
          Accedi alla piattaforma
        </h1>
        <p className="text-sm mb-8" style={{ color: "hsl(var(--app-text-tertiary))" }}>
          Inserisci le tue credenziali per continuare
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(var(--app-text-secondary))" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="la.tua@email.com"
              required
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
              style={{
                backgroundColor: "hsl(var(--app-bg-input))",
                border: `1px solid hsl(var(--app-border-${hasError ? "error" : "default"}))`,
                color: "hsl(var(--app-text-primary))",
              }}
              onFocus={(e) => (e.target.style.borderColor = `hsl(var(--app-border-focus))`)}
              onBlur={(e) => (e.target.style.borderColor = `hsl(var(--app-border-default))`)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(var(--app-text-secondary))" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors pr-10"
                style={{
                  backgroundColor: "hsl(var(--app-bg-input))",
                  border: `1px solid hsl(var(--app-border-${hasError ? "error" : "default"}))`,
                  color: "hsl(var(--app-text-primary))",
                }}
                onFocus={(e) => (e.target.style.borderColor = `hsl(var(--app-border-focus))`)}
                onBlur={(e) => (e.target.style.borderColor = `hsl(var(--app-border-default))`)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "hsl(var(--app-text-tertiary))" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: "hsl(var(--app-brand))",
              color: "#fff",
            }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "hsl(var(--app-text-tertiary))" }}>
          Accedendo, accetti i Termini di Servizio e la Privacy Policy.
        </p>
      </div>
    </div>
  );
}
