import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, CheckCircle2, XCircle, Send, Copy, Bot } from "lucide-react";
import { toast } from "sonner";

export default function CantiereConfig() {
  const companyId = useCompanyId();
  const [botToken, setBotToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [operai, setOperai] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId) return;
    fetchConfig();
    fetchOperai();
  }, [companyId]);

  const fetchConfig = async () => {
    const { data } = await supabase.from("telegram_config").select("*").eq("company_id", companyId!).maybeSingle();
    if (data) {
      setConfig(data);
      setBotToken((data as any).bot_token || "");
    }
  };

  const fetchOperai = async () => {
    const { data } = await supabase.from("cantiere_operai").select("*").eq("company_id", companyId!).eq("attivo", true);
    setOperai(data || []);
  };

  const handleActivateBot = async () => {
    if (!companyId || !botToken.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-telegram-webhook", {
        body: { company_id: companyId, bot_token: botToken },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Bot attivato! @${data.bot_username || "bot"}`);
        fetchConfig();
      } else {
        toast.error("Errore nell'attivazione del bot");
      }
    } catch (e: any) {
      toast.error(e.message || "Errore");
    }
    setLoading(false);
  };

  const copyInviteMessage = (operaio: any) => {
    const botUsername = config?.bot_username || "il_tuo_bot";
    const msg = `Ciao ${operaio.nome}! Per inviare i report cantiere usa il nostro bot Telegram: @${botUsername}. Clicca su Start quando lo apri.`;
    navigator.clipboard.writeText(msg);
    toast.success("Messaggio copiato!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurazione Bot Telegram</h1>
        <p className="text-sm text-muted-foreground">Configura il bot Telegram per ricevere report dai cantieri</p>
      </div>

      {/* Bot Setup */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Bot Telegram</h2>
          {config?.attivo ? (
            <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" /> Attivo</Badge>
          ) : (
            <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> Non attivo</Badge>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium">Come creare il bot:</p>
          <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
            <li>Apri Telegram e cerca <strong>@BotFather</strong></li>
            <li>Scrivi <code>/newbot</code> e scegli un nome per il bot</li>
            <li>Copia il <strong>token</strong> che ti viene dato</li>
            <li>Incollalo qui sotto e clicca "Attiva Bot"</li>
          </ol>
        </div>

        <div className="space-y-2">
          <Label>Token Bot Telegram</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showToken ? "text" : "password"}
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                placeholder="123456789:ABCDefGhIJKlMnOpQrStUvWxYz"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={handleActivateBot} disabled={loading || !botToken.trim()}>
              {loading ? "Attivazione..." : "Attiva Bot"}
            </Button>
          </div>
          {config?.bot_username && (
            <p className="text-sm text-primary flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Bot attivo: @{config.bot_username}
            </p>
          )}
        </div>
      </Card>

      {/* Associate Workers */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" /> Associa Operai
        </h2>
        <p className="text-sm text-muted-foreground">
          Invia il messaggio d'invito a ogni operaio per farlo collegare al bot.
        </p>

        {operai.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nessun operaio configurato. Aggiungi operai dalla pagina del cantiere.</p>
        ) : (
          <div className="space-y-2">
            {operai.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">{o.nome} {o.cognome || ""}</p>
                  <p className="text-xs text-muted-foreground">{o.telegram_username ? `@${o.telegram_username}` : "Telegram non configurato"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {o.telegram_user_id ? (
                    <Badge variant="default" className="text-xs">Collegato</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => copyInviteMessage(o)}>
                      <Copy className="h-3 w-3 mr-1" /> Copia invito
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Email Settings */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">📧 Email Report</h2>
        <p className="text-sm text-muted-foreground">
          Le email dei destinatari report vengono configurate per ogni singolo cantiere nella sezione cantieri.
        </p>
      </Card>
    </div>
  );
}
