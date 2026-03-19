import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import logoGreen from "@/assets/logo-green.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
    setIsLoading(false);
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

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <span className="text-[22px] font-bold text-ink-900">
            edilizia<span className="text-brand">.io</span>
          </span>
        </div>

        <div className="w-full rounded-card p-10 bg-white border border-ink-200 shadow-card">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-brand" />
              </div>
              <h1 className="text-xl font-semibold text-ink-900">Controlla la tua email</h1>
              <p className="text-sm text-ink-400">
                Abbiamo inviato un link per reimpostare la password a <strong className="text-ink-700">{email}</strong>.
              </p>
              <p className="text-xs text-ink-400">Non trovi l'email? Controlla la cartella spam.</p>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-brand font-medium hover:underline mt-4">
                <ArrowLeft size={14} /> Torna al login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold mb-1 text-ink-900">Password dimenticata?</h1>
              <p className="text-sm mb-8 text-ink-400">
                Inserisci la tua email e ti invieremo un link per reimpostarla.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-btn py-2.5 text-sm font-medium transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-brand text-white shadow-button-green"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLoading ? "Invio in corso..." : "Invia link di reset"}
                </button>
              </form>

              <p className="text-center text-sm mt-6 text-ink-400">
                <Link to="/login" className="text-brand font-medium hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Torna al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
