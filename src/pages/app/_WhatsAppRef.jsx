import { useState, useEffect, useCallback } from "react";

// ============================================================
// TYPES
// ============================================================
type SubscriptionStatus = "inactive" | "active" | "suspended";
type NumberStatus = "CONNECTED" | "PENDING" | "FLAGGED" | "BANNED";
type QualityRating = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";

interface WaNumber {
  id: string;
  phone_number_id: string;
  display_phone_number: string;
  display_name: string;
  status: NumberStatus;
  quality_rating: QualityRating;
  name_status: string;
  is_default: boolean;
  messaging_limit_tier?: string;
}

interface WaTemplate {
  id: string;
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAUSED";
  components: any[];
}

interface WaSubscription {
  status: SubscriptionStatus;
  plan: string;
  price_monthly: number;
  expires_at?: string;
}

// ============================================================
// MOCK DATA (in produzione: fetch da Supabase)
// ============================================================
const MOCK_SUB_ACTIVE: WaSubscription = {
  status: "active",
  plan: "standard",
  price_monthly: 29.99,
  expires_at: "2026-04-07",
};

const MOCK_SUB_INACTIVE: WaSubscription = {
  status: "inactive",
  plan: "standard",
  price_monthly: 29.99,
};

const MOCK_NUMBERS: WaNumber[] = [
  {
    id: "1",
    phone_number_id: "123456789",
    display_phone_number: "+39 350 178 2744",
    display_name: "Flo | Marketing Edile",
    status: "CONNECTED",
    quality_rating: "GREEN",
    name_status: "APPROVED",
    is_default: true,
    messaging_limit_tier: "TIER_1K",
  },
];

const MOCK_TEMPLATES: WaTemplate[] = [
  {
    id: "1",
    name: "copy_1messaggiomarzo",
    category: "MARKETING",
    language: "it",
    status: "APPROVED",
    components: [],
  },
  {
    id: "2",
    name: "copy_2messaggiomarzo",
    category: "MARKETING",
    language: "it",
    status: "APPROVED",
    components: [],
  },
  {
    id: "3",
    name: "benvenuto_cliente",
    category: "UTILITY",
    language: "it",
    status: "PENDING",
    components: [],
  },
];

// ============================================================
// HELPERS
// ============================================================
const qualityColor: Record<QualityRating, string> = {
  GREEN: "#22c55e",
  YELLOW: "#f59e0b",
  RED: "#ef4444",
  UNKNOWN: "#94a3b8",
};

const statusLabel: Record<NumberStatus, string> = {
  CONNECTED: "Collegato",
  PENDING: "In attesa",
  FLAGGED: "Segnalato",
  BANNED: "Bannato",
};

const templateStatusColor: Record<string, string> = {
  APPROVED: "#22c55e",
  PENDING: "#f59e0b",
  REJECTED: "#ef4444",
  PAUSED: "#94a3b8",
};

const categoryLabel: Record<string, string> = {
  MARKETING: "Marketing",
  UTILITY: "Utility",
  AUTHENTICATION: "Autenticazione",
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Badge({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: color + "18",
        color: color,
        border: `1px solid ${color}30`,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

function Card({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8ecf0",
        borderRadius: 14,
        padding: "22px 24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #1a56db 0%, #1e40af 100%)",
      color: "#fff",
      border: "none",
      boxShadow: "0 2px 8px rgba(26,86,219,0.25)",
    },
    secondary: {
      background: "#f1f5f9",
      color: "#374151",
      border: "1px solid #e2e8f0",
    },
    danger: {
      background: "#fef2f2",
      color: "#dc2626",
      border: "1px solid #fecaca",
    },
    ghost: {
      background: "transparent",
      color: "#64748b",
      border: "1px solid #e2e8f0",
    },
    success: {
      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
      color: "#fff",
      border: "none",
      boxShadow: "0 2px 8px rgba(22,163,74,0.2)",
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 14px", fontSize: 12 },
    md: { padding: "9px 18px", fontSize: 13 },
    lg: { padding: "12px 24px", fontSize: 14 },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        borderRadius: 8,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
        fontFamily: "inherit",
        ...styles[variant],
        ...sizeStyles[size],
      }}
    >
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
}

// ============================================================
// SUBSCRIPTION GATE (paywall)
// ============================================================
function SubscriptionGate({
  sub,
  onActivate,
}: {
  sub: WaSubscription;
  onActivate: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 32px",
        textAlign: "center",
        gap: 24,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 32px rgba(37,211,102,0.25)",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </div>

      <div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 10px 0",
          }}
        >
          WhatsApp Business non attivo
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#64748b",
            maxWidth: 480,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Attiva il modulo WhatsApp per collegare il tuo numero, gestire
          conversazioni, inviare template e automatizzare la comunicazione con i
          tuoi clienti — tutto dal CRM.
        </p>
      </div>

      {/* Features */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          maxWidth: 460,
          width: "100%",
        }}
      >
        {[
          { icon: "📱", label: "Più numeri collegati" },
          { icon: "🤖", label: "AI risposte automatiche" },
          { icon: "📢", label: "Broadcast & template" },
          { icon: "⚡", label: "Automazioni integrate" },
        ].map((f) => (
          <div
            key={f.label}
            style={{
              background: "#f8fafc",
              border: "1px solid #e8ecf0",
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "#374151",
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: 18 }}>{f.icon}</span>
            {f.label}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Button onClick={onActivate} variant="success" size="lg" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        }>
          Attiva WhatsApp — €{sub.price_monthly}/mese
        </Button>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          Puoi disattivare in qualsiasi momento
        </span>
      </div>
    </div>
  );
}

// ============================================================
// CONNECT NUMBER MODAL
// ============================================================
function ConnectNumberModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (num: WaNumber) => void;
}) {
  const [step, setStep] = useState<"form" | "meta" | "verifying" | "done">("form");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleConnect = useCallback(async () => {
    if (!displayName.trim()) {
      setError("Inserisci il nome visualizzato");
      return;
    }
    if (!phone.trim()) {
      setError("Inserisci il numero di telefono");
      return;
    }
    setError("");
    setStep("meta");

    // Simula flusso OAuth Meta Embedded Signup
    setTimeout(() => {
      setStep("verifying");
      setTimeout(() => {
        setStep("done");
        onConnected({
          id: Date.now().toString(),
          phone_number_id: "new_" + Date.now(),
          display_phone_number: phone,
          display_name: displayName,
          status: "CONNECTED",
          quality_rating: "UNKNOWN",
          name_status: "PENDING",
          is_default: false,
          messaging_limit_tier: "TIER_1K",
        });
      }, 2000);
    }, 1500);
  }, [displayName, phone, onConnected]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "32px 36px",
          width: 480,
          maxWidth: "95vw",
          boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #25d366, #128c7e)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
                Collega Numero WhatsApp
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                Via Meta Business Manager
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {step === "form" && (
          <>
            {/* Warning */}
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
              padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
                Una volta collegato, il numero funzionerà sia su WhatsApp mobile
                che su questo CRM tramite Cloud API.
              </p>
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Nome visualizzato *
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="es. Flo | Marketing Edile"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
                    border: "1.5px solid #e2e8f0", outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box", color: "#111827",
                  }}
                />
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                  Deve corrispondere al nome dell'azienda (linee guida Meta)
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Numero di telefono *
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 350 000 0000"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
                    border: "1.5px solid #e2e8f0", outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box", color: "#111827",
                  }}
                />
              </div>

              {error && (
                <p style={{ margin: 0, fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 6 }}>
                  {error}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <Button onClick={onClose} variant="ghost">Annulla</Button>
              <Button onClick={handleConnect} variant="primary" icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              }>
                Procedi con Meta
              </Button>
            </div>
          </>
        )}

        {(step === "meta" || step === "verifying") && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
              background: step === "meta" ? "#eff6ff" : "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "spin 1s linear infinite",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={step === "meta" ? "#3b82f6" : "#22c55e"} strokeWidth="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              {step === "meta" ? "Connessione a Meta Business..." : "Verifica numero in corso..."}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              {step === "meta"
                ? "Autorizzazione OAuth con Meta Business Manager"
                : "Registrazione numero su WhatsApp Cloud API"}
            </p>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px",
              background: "linear-gradient(135deg, #25d366, #128c7e)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#111827" }}>
              Numero collegato!
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>
              Il numero è stato collegato con successo. Potrebbe richiedere
              qualche minuto per sincronizzarsi completamente.
            </p>
            <Button onClick={onClose} variant="primary">
              Chiudi
            </Button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ============================================================
// TEMPLATE EDITOR MODAL
// ============================================================
function TemplateEditorModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [body, setBody] = useState("");
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");

  const charCount = body.length;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, width: 860, maxWidth: "96vw",
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 28px", borderBottom: "1px solid #e8ecf0",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Crea Modello Messaggio
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "auto" }}>
          {/* Form */}
          <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Nome Modello *
                </label>
                <input value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                  placeholder="nome_modello"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Solo minuscole e underscore</span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Categoria *</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Autenticazione</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Lingua *</label>
                <select style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
                  <option value="it">Italiano</option>
                  <option value="en">Inglese</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Intestazione (Opzionale)
              </label>
              <input value={header} onChange={e => setHeader(e.target.value)}
                placeholder="Testo intestazione..."
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Corpo *
              </label>
              <div style={{ position: "relative" }}>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Ciao {{1}}, sono Flo di Marketing Edile..."
                  maxLength={1024}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 8,
                    border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit",
                    resize: "vertical", minHeight: 140, boxSizing: "border-box", lineHeight: 1.6
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    Usa {'{{1}}'}, {'{{2}}'} per variabili
                  </span>
                  <span style={{ fontSize: 11, color: charCount > 900 ? "#f59e0b" : "#94a3b8" }}>
                    {charCount} / 1024
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Piè di pagina (Opzionale)
              </label>
              <input value={footer} onChange={e => setFooter(e.target.value)}
                placeholder="Reply STOP to unsubscribe"
                maxLength={60}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Preview */}
          <div style={{
            width: 280, flexShrink: 0, borderLeft: "1px solid #e8ecf0",
            background: "#f0f2f5", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Anteprima
            </p>
            <div style={{
              background: "#fff", borderRadius: 12, padding: 0,
              overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)"
            }}>
              {/* WA-style bubble */}
              <div style={{ background: "#e5ddd5", padding: "16px 12px", minHeight: 180 }}>
                <div style={{
                  background: "#fff", borderRadius: "0 8px 8px 8px",
                  padding: "10px 14px", maxWidth: "90%", boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}>
                  {header && (
                    <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#111827" }}>
                      {header}
                    </p>
                  )}
                  {body ? (
                    <p style={{ margin: 0, fontSize: 12, color: "#111827", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {body.replace(/\{\{(\d+)\}\}/g, (_, n) => `[var${n}]`)}
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
                      Il testo del messaggio apparirà qui...
                    </p>
                  )}
                  {footer && (
                    <p style={{ margin: "8px 0 0", fontSize: 10, color: "#94a3b8" }}>{footer}</p>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>11:48 ✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#fff8f0", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ margin: 0, fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
                Il modello sarà inviato a Meta per approvazione. I tempi medi sono 2-24 ore.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px", borderTop: "1px solid #e8ecf0",
          display: "flex", justifyContent: "flex-end", gap: 10
        }}>
          <Button onClick={onClose} variant="ghost">Annulla</Button>
          <Button onClick={() => { onSaved(); onClose(); }} variant="primary" disabled={!name || !body}>
            Crea e invia a Meta
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function WhatsAppSettings() {
  const [subscription, setSubscription] = useState<WaSubscription>(MOCK_SUB_INACTIVE);
  const [numbers, setNumbers] = useState<WaNumber[]>([]);
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<"numbers" | "templates" | "flows">("numbers");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activating, setActivating] = useState(false);

  // Demo: carica dati quando subscription è attiva
  useEffect(() => {
    if (subscription.status === "active") {
      setNumbers(MOCK_NUMBERS);
      setTemplates(MOCK_TEMPLATES);
    }
  }, [subscription.status]);

  const handleActivate = useCallback(() => {
    setActivating(true);
    // In produzione: redirect a Stripe checkout
    setTimeout(() => {
      setSubscription(MOCK_SUB_ACTIVE);
      setActivating(false);
    }, 1500);
  }, []);

  const handleNumberConnected = useCallback((num: WaNumber) => {
    setNumbers(prev => [...prev, num]);
  }, []);

  const handleSetDefault = useCallback((id: string) => {
    setNumbers(prev => prev.map(n => ({ ...n, is_default: n.id === id })));
  }, []);

  const handleDisconnect = useCallback((id: string) => {
    if (window.confirm("Vuoi davvero disconnettere questo numero?")) {
      setNumbers(prev => prev.filter(n => n.id !== id));
    }
  }, []);

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#f8fafc",
      minHeight: "100vh",
      padding: "32px",
      boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* PAGE HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(37,211,102,0.3)",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>
                WhatsApp Business
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Gestisci numeri, template e conversazioni
              </p>
            </div>
          </div>

          {subscription.status === "active" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge color="#22c55e" label="Attivo" />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Rinnovo: {subscription.expires_at}
              </span>
            </div>
          )}
        </div>

        {/* SUBSCRIPTION GATE */}
        {subscription.status === "inactive" ? (
          <Card>
            <SubscriptionGate sub={subscription} onActivate={handleActivate} />
            {activating && (
              <div style={{ textAlign: "center", padding: "12px 0", color: "#64748b", fontSize: 13 }}>
                Reindirizzamento al pagamento...
              </div>
            )}
          </Card>
        ) : (
          <>
            {/* META VERIFICATION BANNER */}
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12,
              padding: "14px 18px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                    Verifica Meta Business in sospeso
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#b45309" }}>
                    Completa la verifica per aumentare i limiti di invio e mostrare un nome verificato
                  </p>
                </div>
              </div>
              <a
                href="https://business.facebook.com/settings/security"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8, background: "#fff",
                  border: "1.5px solid #f59e0b", color: "#92400e",
                  fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap"
                }}
              >
                Verifica ora ↗
              </a>
            </div>

            {/* TABS */}
            <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "#fff", border: "1px solid #e8ecf0", borderRadius: 10, padding: 4 }}>
              {(["numbers", "templates", "flows"] as const).map((tab) => {
                const labels = { numbers: "Numeri", templates: "Modelli", flows: "Flussi" };
                const icons = {
                  numbers: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>,
                  templates: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>,
                  flows: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>,
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      padding: "9px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                      background: activeTab === tab ? "#1a56db" : "transparent",
                      color: activeTab === tab ? "#fff" : "#64748b",
                    }}
                  >
                    {icons[tab]}
                    {labels[tab]}
                    {tab === "templates" && (
                      <span style={{
                        background: activeTab === tab ? "rgba(255,255,255,0.25)" : "#e8ecf0",
                        color: activeTab === tab ? "#fff" : "#64748b",
                        borderRadius: 10, padding: "1px 7px", fontSize: 11
                      }}>
                        {templates.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB: NUMBERS */}
            {activeTab === "numbers" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>
                      Numeri di telefono
                      <span style={{ marginLeft: 8, background: "#e8ecf0", color: "#64748b", borderRadius: 10, padding: "2px 9px", fontSize: 12 }}>
                        {numbers.length}
                      </span>
                    </h2>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                      Puoi collegare più numeri allo stesso account
                    </p>
                  </div>
                  <Button onClick={() => setShowConnectModal(true)} variant="primary" icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  }>
                    Aggiungi numero
                  </Button>
                </div>

                {numbers.length === 0 ? (
                  <Card style={{ textAlign: "center", padding: "48px 32px" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>📱</div>
                    <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: "#374151" }}>
                      Nessun numero collegato
                    </p>
                    <p style={{ margin: "0 0 24px", fontSize: 13, color: "#94a3b8" }}>
                      Collega il tuo numero WhatsApp Business per iniziare
                    </p>
                    <Button onClick={() => setShowConnectModal(true)} variant="primary">
                      Collega numero
                    </Button>
                  </Card>
                ) : (
                  numbers.map((num) => (
                    <Card key={num.id} style={{ position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {/* Avatar */}
                        <div style={{
                          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                          background: "linear-gradient(135deg, #25d366, #128c7e)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(37,211,102,0.2)"
                        }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                              {num.display_name}
                            </span>
                            {num.is_default && (
                              <span style={{ background: "#eff6ff", color: "#3b82f6", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>
                                Predefinito
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <span style={{ fontSize: 13, color: "#64748b" }}>
                              🇮🇹 {num.display_phone_number}
                            </span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              ID: {num.phone_number_id}
                            </span>
                          </div>
                        </div>

                        {/* Status + quality */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Badge
                              color={num.status === "CONNECTED" ? "#22c55e" : "#f59e0b"}
                              label={statusLabel[num.status]}
                            />
                            <Badge
                              color={qualityColor[num.quality_rating]}
                              label={`Qualità ${num.quality_rating}`}
                            />
                          </div>
                          {num.messaging_limit_tier && (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              Limite: {num.messaging_limit_tier.replace("TIER_", "").replace("K", ".000 msg/gg")}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
                          {!num.is_default && (
                            <Button onClick={() => handleSetDefault(num.id)} variant="secondary" size="sm">
                              Imposta predefinito
                            </Button>
                          )}
                          <Button onClick={() => handleDisconnect(num.id)} variant="danger" size="sm">
                            Disconnetti
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* TAB: TEMPLATES */}
            {activeTab === "templates" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>
                      Modelli Messaggio
                    </h2>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                      I template devono essere approvati da Meta prima dell'uso
                    </p>
                  </div>
                  <Button onClick={() => setShowTemplateModal(true)} variant="primary" icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  }>
                    Crea Modello
                  </Button>
                </div>

                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e8ecf0" }}>
                        {["Nome / Lingua", "Categoria", "Stato", "Azioni"].map((h) => (
                          <th key={h} style={{
                            padding: "12px 18px", textAlign: "left",
                            fontSize: 11, fontWeight: 700, color: "#64748b",
                            textTransform: "uppercase", letterSpacing: "0.05em"
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map((t, i) => (
                        <tr key={t.id} style={{ borderBottom: i < templates.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                              {t.language === "it" ? "🇮🇹 Italiano" : "🇬🇧 Inglese"}
                            </div>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{
                              fontSize: 12, fontWeight: 600,
                              color: t.category === "MARKETING" ? "#7c3aed" : t.category === "UTILITY" ? "#0369a1" : "#374151",
                              background: t.category === "MARKETING" ? "#f5f3ff" : t.category === "UTILITY" ? "#e0f2fe" : "#f1f5f9",
                              padding: "3px 10px", borderRadius: 6,
                            }}>
                              {categoryLabel[t.category]}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <Badge
                              color={templateStatusColor[t.status]}
                              label={t.status === "APPROVED" ? "Approvato" : t.status === "PENDING" ? "In revisione" : t.status === "REJECTED" ? "Rifiutato" : "Sospeso"}
                            />
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <Button variant="ghost" size="sm">Modifica</Button>
                              <Button variant="danger" size="sm">Elimina</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}

            {/* TAB: FLOWS */}
            {activeTab === "flows" && (
              <Card style={{ textAlign: "center", padding: "56px 32px" }}>
                <div style={{ fontSize: 42, marginBottom: 16 }}>⚡</div>
                <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, color: "#111827" }}>
                  Flussi di automazione WhatsApp
                </h3>
                <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b", maxWidth: 420, margin: "0 auto 24px" }}>
                  Crea flussi automatici basati su messaggi in entrata, eventi CRM o trigger temporali.
                  I flussi WhatsApp si integrano con il modulo Automazioni del CRM.
                </p>
                <Button variant="primary" icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                }>
                  Vai alle Automazioni
                </Button>
              </Card>
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      {showConnectModal && (
        <ConnectNumberModal
          onClose={() => setShowConnectModal(false)}
          onConnected={(num) => {
            handleNumberConnected(num);
            setShowConnectModal(false);
          }}
        />
      )}
      {showTemplateModal && (
        <TemplateEditorModal
          onClose={() => setShowTemplateModal(false)}
          onSaved={() => {
            setTemplates(prev => [...prev, {
              id: Date.now().toString(),
              name: "nuovo_modello_" + Date.now().toString().slice(-4),
              category: "MARKETING",
              language: "it",
              status: "PENDING",
              components: [],
            }]);
          }}
        />
      )}
    </div>
  );
}
