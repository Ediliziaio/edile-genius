import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mic, Square, Loader2, Upload } from "lucide-react";

export default function NuovoPreventivo() {
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [cantiereId, setCantiereId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteIndirizzo, setClienteIndirizzo] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [oggetto, setOggetto] = useState("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const { data: cantieri } = useQuery({
    queryKey: ["cantieri-select", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase.from("cantieri") as any)
        .select("id, nome")
        .eq("company_id", companyId)
        .eq("stato", "attivo");
      return data || [];
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
    } catch {
      toast.error("Impossibile accedere al microfono");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioBlob(file);
  };

  const handleSubmit = async () => {
    if (!audioBlob || !companyId) {
      toast.error("Registra o carica un audio prima");
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non autenticato");

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");
      formData.append("company_id", companyId);
      if (cantiereId) formData.append("cantiere_id", cantiereId);
      if (clienteNome) formData.append("cliente_nome", clienteNome);
      if (clienteIndirizzo) formData.append("cliente_indirizzo", clienteIndirizzo);
      if (clienteTelefono) formData.append("cliente_telefono", clienteTelefono);
      if (clienteEmail) formData.append("cliente_email", clienteEmail);
      if (oggetto) formData.append("oggetto", oggetto);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-preventivo-audio`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore elaborazione");
      }

      const preventivo = await res.json();
      toast.success("Preventivo creato con successo!");
      navigate(`/app/preventivi/${preventivo.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Nuovo Preventivo da Audio</h1>
      <p className="text-muted-foreground">Registra il sopralluogo o carica un audio. L'AI estrarrà le voci del preventivo.</p>

      <Card>
        <CardHeader><CardTitle className="text-lg">1. Registra Audio</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {!recording ? (
              <Button onClick={startRecording} variant="outline" className="gap-2 flex-1" disabled={processing}>
                <Mic className="h-4 w-4" /> Avvia Registrazione
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="gap-2 flex-1">
                <Square className="h-4 w-4" /> Ferma
              </Button>
            )}
            <div className="relative flex-1">
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={processing} />
              <Button variant="outline" className="gap-2 w-full" disabled={processing}>
                <Upload className="h-4 w-4" /> Carica File
              </Button>
            </div>
          </div>
          {audioBlob && (
            <div className="bg-muted rounded-lg p-3">
              <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">2. Info Preventivo (opzionale)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input placeholder="Nome cliente" value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input placeholder="+39..." value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="email@..." value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Indirizzo</Label>
              <Input placeholder="Via..." value={clienteIndirizzo} onChange={e => setClienteIndirizzo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Oggetto lavori</Label>
            <Input placeholder="es. Ristrutturazione bagno" value={oggetto} onChange={e => setOggetto(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cantiere (opzionale)</Label>
            <Select value={cantiereId} onValueChange={setCantiereId}>
              <SelectTrigger><SelectValue placeholder="Seleziona cantiere" /></SelectTrigger>
              <SelectContent>
                {(cantieri || []).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={!audioBlob || processing} className="w-full gap-2" size="lg">
        {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Elaborazione AI in corso...</> : "🤖 Genera Preventivo con AI"}
      </Button>
    </div>
  );
}
