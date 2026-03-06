import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, Loader2,
  AlertTriangle, X, MapPin, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DB_FIELDS = [
  { key: "full_name", label: "Nome completo", required: true },
  { key: "phone", label: "Telefono", required: false },
  { key: "phone_alt", label: "Telefono alt.", required: false },
  { key: "email", label: "Email", required: false },
  { key: "company_name", label: "Azienda", required: false },
  { key: "city", label: "Città", required: false },
  { key: "province", label: "Provincia", required: false },
  { key: "cap", label: "CAP", required: false },
  { key: "address", label: "Indirizzo", required: false },
  { key: "sector", label: "Settore", required: false },
  { key: "source", label: "Fonte", required: false },
  { key: "status", label: "Stato", required: false },
  { key: "priority", label: "Priorità", required: false },
  { key: "notes", label: "Note", required: false },
];

const AUTO_MAP: Record<string, string> = {
  nome: "full_name", name: "full_name", "nome completo": "full_name", "full name": "full_name", "nome e cognome": "full_name",
  cognome: "full_name", surname: "full_name", "last name": "full_name",
  telefono: "phone", phone: "phone", tel: "phone", cellulare: "phone", mobile: "phone",
  "telefono alt": "phone_alt", "phone alt": "phone_alt", "tel alt": "phone_alt", "altro telefono": "phone_alt",
  email: "email", "e-mail": "email", mail: "email", "posta elettronica": "email",
  azienda: "company_name", company: "company_name", "nome azienda": "company_name", "ragione sociale": "company_name",
  città: "city", citta: "city", city: "city",
  provincia: "province", province: "province", prov: "province",
  cap: "cap", "codice postale": "cap", zip: "cap",
  indirizzo: "address", address: "address", via: "address",
  settore: "sector", sector: "sector", industry: "sector",
  fonte: "source", source: "source", origine: "source",
  stato: "status", status: "status",
  priorità: "priority", priorita: "priority", priority: "priority",
  note: "notes", notes: "notes", commenti: "notes",
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const detectSeparator = (line: string) => {
    const semicolons = (line.match(/;/g) || []).length;
    const commas = (line.match(/,/g) || []).length;
    const tabs = (line.match(/\t/g) || []).length;
    if (tabs > commas && tabs > semicolons) return "\t";
    if (semicolons > commas) return ";";
    return ",";
  };

  const sep = detectSeparator(lines[0]);

  const parseLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === sep && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine).filter(r => r.some(c => c));
  return { headers, rows };
}

function autoMapHeaders(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  const used = new Set<string>();
  headers.forEach((h, i) => {
    const key = AUTO_MAP[h.toLowerCase().trim()];
    if (key && !used.has(key)) {
      mapping[i] = key;
      used.add(key);
    }
  });
  return mapping;
}

const BATCH_SIZE = 50;

export default function ImportContactsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const companyId = profile?.company_id;
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);

  // Step 1: Upload
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Step 2: Mapping
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [assignListId, setAssignListId] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Step 3: Import
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number; errors: number } | null>(null);

  const { data: contactLists = [] } = useQuery({
    queryKey: ["contact-lists-simple", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("contact_lists").select("id, name").eq("company_id", companyId!).order("name");
      return data || [];
    },
  });

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
      toast({ title: "Formato non supportato", description: "Carica un file CSV, TSV o TXT", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "Massimo 10 MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) {
        toast({ title: "File vuoto o non valido", variant: "destructive" });
        return;
      }
      setHeaders(h);
      setRows(r);
      setFileName(file.name);
      setMapping(autoMapHeaders(h));
      setStep(1);
    };
    reader.readAsText(file);
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const mappedFields = Object.values(mapping);
  const hasName = mappedFields.includes("full_name");

  const updateMapping = (colIndex: number, dbField: string) => {
    const newMapping = { ...mapping };
    if (dbField === "__skip__") {
      delete newMapping[colIndex];
    } else {
      // Remove previous assignment of this field
      for (const key of Object.keys(newMapping)) {
        if (newMapping[Number(key)] === dbField) delete newMapping[Number(key)];
      }
      newMapping[colIndex] = dbField;
    }
    setMapping(newMapping);
  };

  const handleImport = async () => {
    if (!companyId) return;
    setImporting(true);
    setProgress(0);
    let inserted = 0, skipped = 0, errors = 0;

    // Build contacts from rows
    const contacts: Record<string, any>[] = [];
    for (const row of rows) {
      const contact: Record<string, any> = { company_id: companyId, source: "import_csv" };
      for (const [colStr, dbField] of Object.entries(mapping)) {
        const col = Number(colStr);
        const val = row[col]?.trim();
        if (val) contact[dbField] = val;
      }
      // Validate: must have full_name
      if (!contact.full_name) { skipped++; continue; }
      // Sanitize lengths
      if (contact.full_name.length > 200) contact.full_name = contact.full_name.slice(0, 200);
      if (contact.email && contact.email.length > 255) contact.email = contact.email.slice(0, 255);
      if (contact.phone && contact.phone.length > 30) contact.phone = contact.phone.slice(0, 30);
      contacts.push(contact);
    }

    // Check duplicates by phone/email if enabled
    let existingPhones = new Set<string>();
    let existingEmails = new Set<string>();
    if (skipDuplicates) {
      const { data: existing } = await supabase
        .from("contacts")
        .select("phone, email")
        .eq("company_id", companyId);
      if (existing) {
        existingPhones = new Set(existing.map(c => c.phone).filter(Boolean) as string[]);
        existingEmails = new Set(existing.map(c => c.email).filter(Boolean) as string[]);
      }
    }

    const toInsert: Record<string, any>[] = [];
    for (const c of contacts) {
      if (skipDuplicates) {
        if (c.phone && existingPhones.has(c.phone)) { skipped++; continue; }
        if (c.email && existingEmails.has(c.email)) { skipped++; continue; }
      }
      toInsert.push(c);
    }

    // Batch insert
    const total = toInsert.length;
    const insertedIds: string[] = [];
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase.from("contacts").insert(batch as any).select("id");
      if (error) {
        errors += batch.length;
      } else {
        inserted += (data?.length || 0);
        if (data) insertedIds.push(...data.map(d => d.id));
      }
      setProgress(Math.round(((i + batch.length) / total) * 100));
    }

    // Assign to list if selected
    if (assignListId && insertedIds.length > 0) {
      const members = insertedIds.map(contact_id => ({ list_id: assignListId, contact_id }));
      for (let i = 0; i < members.length; i += BATCH_SIZE) {
        await supabase.from("contact_list_members").insert(members.slice(i, i + BATCH_SIZE));
      }
    }

    setImportResult({ inserted, skipped, errors });
    setImporting(false);
    setProgress(100);
  };

  const reset = () => {
    setStep(0);
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setImportResult(null);
    setProgress(0);
    setAssignListId("");
  };

  const previewRows = rows.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Importa Contatti</h1>
          <p className="text-sm text-ink-500 mt-1">Carica un file CSV per importare contatti in massa</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/app/contacts")} className="border-ink-200 text-ink-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla Rubrica
        </Button>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {["Carica file", "Mappa colonne", "Importa"].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step > i ? "bg-status-success text-white" :
              step === i ? "bg-brand text-white" :
              "bg-ink-100 text-ink-400"
            }`}>
              {step > i ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm ${step >= i ? "text-ink-900 font-medium" : "text-ink-400"}`}>{label}</span>
            {i < 2 && <div className={`w-12 h-0.5 ${step > i ? "bg-status-success" : "bg-ink-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-card p-16 text-center cursor-pointer transition-colors ${
            dragOver ? "border-brand bg-brand-light" : "border-ink-200 bg-white hover:border-ink-300"
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFileChange} />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? "text-brand" : "text-ink-300"}`} />
          <p className="text-ink-700 font-medium mb-1">Trascina qui il tuo file CSV</p>
          <p className="text-sm text-ink-400">oppure clicca per selezionarlo dal computer</p>
          <p className="text-xs text-ink-300 mt-3">Formati supportati: CSV, TSV, TXT — Max 10 MB</p>
        </div>
      )}

      {/* Step 1: Column Mapping */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-card border border-ink-200 bg-white p-4 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet className="w-5 h-5 text-brand" />
              <div>
                <p className="text-sm font-medium text-ink-900">{fileName}</p>
                <p className="text-xs text-ink-400">{rows.length} righe trovate · {headers.length} colonne</p>
              </div>
            </div>

            {/* Mapping table */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-700">Mappa le colonne del file ai campi del contatto:</p>
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1/3 text-sm text-ink-600 bg-ink-50 px-3 py-2 rounded-md truncate" title={h}>{h}</div>
                    <ArrowRight className="w-4 h-4 text-ink-300 shrink-0" />
                    <Select value={mapping[i] || "__skip__"} onValueChange={(v) => updateMapping(i, v)}>
                      <SelectTrigger className="w-1/3 bg-white border-ink-200 text-ink-900 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip__">— Ignora —</SelectItem>
                        {DB_FIELDS.map(f => (
                          <SelectItem key={f.key} value={f.key} disabled={mappedFields.includes(f.key) && mapping[i] !== f.key}>
                            {f.label} {f.required && "*"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {!hasName && (
              <div className="flex items-center gap-2 mt-4 p-3 rounded-md bg-status-warning-light text-status-warning text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Devi mappare almeno il campo <strong>Nome completo</strong> per procedere.</span>
              </div>
            )}
          </div>

          {/* Preview */}
          {previewRows.length > 0 && (
            <div className="rounded-card border border-ink-200 bg-white p-4 shadow-card">
              <p className="text-sm font-medium text-ink-700 mb-3">Anteprima (prime 3 righe):</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-ink-50">
                      {headers.map((h, i) => (
                        <TableHead key={i} className="text-ink-500 text-xs whitespace-nowrap">
                          {mapping[i] ? (
                            <Badge className="bg-brand-light text-brand-text border-none text-xs">
                              {DB_FIELDS.find(f => f.key === mapping[i])?.label}
                            </Badge>
                          ) : (
                            <span className="text-ink-300 italic">ignorato</span>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, ri) => (
                      <TableRow key={ri}>
                        {row.map((cell, ci) => (
                          <TableCell key={ci} className={`text-xs ${mapping[ci] ? "text-ink-700" : "text-ink-300"}`}>
                            {cell || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="rounded-card border border-ink-200 bg-white p-4 shadow-card space-y-4">
            <p className="text-sm font-medium text-ink-700">Opzioni importazione</p>
            <div className="flex items-center gap-3">
              <Checkbox checked={skipDuplicates} onCheckedChange={(v) => setSkipDuplicates(!!v)} />
              <Label className="text-sm text-ink-600">Salta duplicati (stesso telefono o email già presente)</Label>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-ink-600">Assegna a una lista (opzionale)</Label>
              <Select value={assignListId} onValueChange={setAssignListId}>
                <SelectTrigger className="w-[280px] bg-white border-ink-200 text-ink-900 text-sm">
                  <SelectValue placeholder="Nessuna lista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna lista</SelectItem>
                  {contactLists.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={reset} className="border-ink-200 text-ink-700">
              <ArrowLeft className="w-4 h-4 mr-2" /> Cambia file
            </Button>
            <Button onClick={() => setStep(2)} disabled={!hasName} className="bg-brand hover:bg-brand-hover text-white">
              Avvia importazione <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Import */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-card border border-ink-200 bg-white p-6 shadow-card space-y-6">
            {!importResult && !importing && (
              <div className="text-center space-y-4">
                <FileSpreadsheet className="w-12 h-12 text-brand mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-ink-900">Pronto per importare</p>
                  <p className="text-sm text-ink-500 mt-1">
                    <strong>{rows.length}</strong> righe da importare · <strong>{Object.keys(mapping).length}</strong> campi mappati
                    {skipDuplicates && " · Duplicati esclusi"}
                    {assignListId && assignListId !== "none" && ` · Assegnati a lista`}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setStep(1)} className="border-ink-200 text-ink-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Modifica mappatura
                  </Button>
                  <Button onClick={handleImport} className="bg-brand hover:bg-brand-hover text-white">
                    <Upload className="w-4 h-4 mr-2" /> Importa ora
                  </Button>
                </div>
              </div>
            )}

            {importing && (
              <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 text-brand animate-spin mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-ink-900">Importazione in corso...</p>
                  <p className="text-sm text-ink-500 mt-1">Non chiudere questa pagina</p>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-ink-500">{progress}%</p>
              </div>
            )}

            {importResult && (
              <div className="text-center space-y-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                  importResult.errors > 0 ? "bg-status-warning-light" : "bg-status-success-light"
                }`}>
                  {importResult.errors > 0 ? (
                    <AlertTriangle className="w-7 h-7 text-status-warning" />
                  ) : (
                    <Check className="w-7 h-7 text-status-success" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-ink-900">Importazione completata</p>
                </div>
                <div className="flex justify-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-status-success">{importResult.inserted}</p>
                    <p className="text-ink-500">Importati</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-status-warning">{importResult.skipped}</p>
                    <p className="text-ink-500">Saltati</p>
                  </div>
                  {importResult.errors > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-status-error">{importResult.errors}</p>
                      <p className="text-ink-500">Errori</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="outline" onClick={reset} className="border-ink-200 text-ink-700">
                    Importa altro file
                  </Button>
                  <Button onClick={() => navigate("/app/contacts")} className="bg-brand hover:bg-brand-hover text-white">
                    Vai alla Rubrica
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
