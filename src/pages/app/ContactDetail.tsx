import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Mail, MapPin, Building2, Loader2 } from "lucide-react";

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  city: string | null;
  province: string | null;
  status: string;
  priority: string | null;
  source: string | null;
  notes: string | null;
  created_at: string | null;
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from("contacts").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setContact(data as unknown as Contact);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!contact) return <p className="text-center text-ink-500 py-12">Contatto non trovato.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/app/contacts"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{contact.full_name}</h1>
          <p className="text-sm text-ink-500">{contact.company_name || "Nessuna azienda"}</p>
        </div>
        <Badge className="ml-auto" variant={contact.status === "qualified" ? "default" : "secondary"}>{contact.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-ink-200 shadow-card">
          <CardHeader><CardTitle className="text-sm">Informazioni</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contact.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-ink-400" /> {contact.phone}</div>}
            {contact.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-ink-400" /> {contact.email}</div>}
            {contact.city && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-ink-400" /> {contact.city}{contact.province ? ` (${contact.province})` : ""}</div>}
            {contact.company_name && <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-ink-400" /> {contact.company_name}</div>}
          </CardContent>
        </Card>

        <Card className="border border-ink-200 shadow-card">
          <CardHeader><CardTitle className="text-sm">Dettagli</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Priorità:</span><span className="font-medium">{contact.priority || "—"}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Fonte:</span><span className="font-medium">{contact.source || "—"}</span></div>
          </CardContent>
        </Card>
      </div>

      {contact.notes && (
        <Card className="border border-ink-200 shadow-card">
          <CardHeader><CardTitle className="text-sm">Note</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-ink-600 whitespace-pre-wrap">{contact.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
