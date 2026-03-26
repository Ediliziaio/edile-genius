import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect } from "react";
import logoGreen from "@/assets/logo-green.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { user, isSuperAdmin, isCompanyUser, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isAdminSubdomain = host === "admin.edilizia.io";
  const isAppSubdomain = host === "app.edilizia.io";

  useEffect(() => {
    if (!loading && user) {
      if (isAdminSubdomain) {
        // On admin subdomain: only superadmins allowed
        if (isSuperAdmin) navigate("/superadmin", { replace: true });
        else navigate("/login", { replace: true }); // company user → stay on login (will show error)
      } else if (isAppSubdomain) {
        // On app subdomain: always go to /app (even superadmins)
        navigate("/app", { replace: true });
      } else {
        // edilizia.io: normal routing
        if (isSuperAdmin) navigate("/superadmin", { replace: true });
        else if (isCompanyUser) navigate("/app", { replace: true });
      }
    }
  }, [user, loading, isSuperAdmin, isCompanyUser, navigate, isAdminSubdomain, isAppSubdomain]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasError(false);

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });

    // On admin subdomain, verify superadmin role after login
    if (!error && data?.user && isAdminSubdomain) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .in("role", ["superadmin", "superadmin_user"])
        .limit(1);
      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        setHasError(true);
        setIsLoading(false);
        toast({
          title: "Accesso non autorizzato",
          description: "Quest'area è riservata ai superadmin.",
          variant: "destructive",
        });
        return;
      }
    }

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
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-ink-50 relative overflow-hidden">
      {/* SVG dot grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.35]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#3ECF6E" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img src={logoGreen} alt="Edilizia.io" className="h-8 w-auto" />
        </div>

        {/* Login Card */}
        <div className="w-full rounded-card p-10 bg-white border border-ink-200 shadow-card">
          <h1 className="text-xl font-semibold mb-1 text-ink-900">
            Bentornato
          </h1>
          <p className="text-sm mb-8 text-ink-400">
            Accedi alla tua piattaforma AI
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink-600">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la.tua@email.com"
                required
                className={`w-full rounded-btn px-3.5 py-2.5 text-sm outline-none transition-colors bg-ink-50 border text-ink-900 placeholder:text-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 ${
                  hasError ? "border-status-error" : "border-ink-200"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full rounded-btn px-3.5 py-2.5 text-sm outline-none transition-colors pr-10 bg-ink-50 border text-ink-900 placeholder:text-ink-300 focus:border-brand focus:ring-2 focus:ring-brand/20 ${
                    hasError ? "border-status-error" : "border-ink-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
                >
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
              {isLoading ? "Accesso in corso..." : "Accedi"}
            </button>
          </form>

          <div className="flex items-center justify-between mt-6">
            <Link to="/forgot-password" className="text-sm text-ink-400 hover:text-brand transition-colors">
              Password dimenticata?
            </Link>
            <p className="text-sm text-ink-400">
              <Link to="/signup" className="text-brand font-medium hover:underline">Registrati gratis</Link>
            </p>
          </div>

          <p className="text-center text-xs mt-3 text-ink-400">
            Accedendo, accetti i Termini di Servizio e la Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
