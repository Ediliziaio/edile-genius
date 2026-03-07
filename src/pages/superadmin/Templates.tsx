import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  icon: string;
  channel: string[];
  difficulty: string;
  estimated_setup_min: number;
  is_published: boolean;
  is_featured: boolean;
  installs_count: number;
  prompt_template: string;
  first_message_template: string | null;
  config_schema: any;
}

const CATEGORIES = [
  "reportistica", "qualifica_lead", "assistenza", "appuntamenti",
  "preventivi", "sicurezza", "hr_operai", "post_vendita",
];

const EMPTY: Partial<Template> = {
  slug: "", name: "", description: "", category: "reportistica", icon: "🤖",
  channel: ["whatsapp"], difficulty: "facile", estimated_setup_min: 30,
  is_published: false, is_featured: false, prompt_template: "",
  first_message_template: "", config_schema: [],
};

export default function SATemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [saving, setSaving] = useState(false);
  const [configSchemaText, setConfigSchemaText] = useState("[]");

  const fetchTemplates = async () => {
    const { data } = await supabase.from("agent_templates").select("*").order("created_at", { ascending: false });
    setTemplates((data as Template[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setEditing({ ...EMPTY });
    setConfigSchemaText("[]");
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing({ ...t });
    setConfigSchemaText(JSON.stringify(t.config_schema, null, 2));
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing?.name || !editing?.slug || !editing?.prompt_template) {
      toast.error("Nome, slug e prompt sono obbligatori");
      return;
    }

    let parsedSchema: any;
    try {
      parsedSchema = JSON.parse(configSchemaText);
    } catch {
      toast.error("Config schema non è un JSON valido");
      return;
    }

    setSaving(true);
    const payload = {
      slug: editing.slug,
      name: editing.name,
      description: editing.description || null,
      category: editing.category || null,
      icon: editing.icon || "🤖",
      channel: editing.channel || ["whatsapp"],
      difficulty: editing.difficulty || "facile",
      estimated_setup_min: editing.estimated_setup_min || 30,
      is_published: editing.is_published || false,
      is_featured: editing.is_featured || false,
      prompt_template: editing.prompt_template,
      first_message_template: editing.first_message_template || null,
      config_schema: parsedSchema,
    };

    if (editing.id) {
      const { error } = await supabase.from("agent_templates").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); } else { toast.success("Template aggiornato"); }
    } else {
      const { error } = await supabase.from("agent_templates").insert(payload);
      if (error) { toast.error(error.message); } else { toast.success("Template creato"); }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchTemplates();
  };

  const toggleField = async (id: string, field: "is_published" | "is_featured", value: boolean) => {
    await supabase.from("agent_templates").update({ [field]: value }).eq("id", id);
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Eliminare questo template?")) return;
    const { error } = await supabase.from("agent_templates").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Template eliminato"); fetchTemplates(); }
  };

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Gestione Template</h1>
          <p className="text-muted-foreground text-sm mt-1">Catalogo template agenti — {templates.length} template</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1" /> Nuovo Template</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Difficoltà</TableHead>
                <TableHead className="text-center">Pubblicato</TableHead>
                <TableHead className="text-center">In evidenza</TableHead>
                <TableHead className="text-center">Installazioni</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{t.icon}</span>
                      <div>
                        <p className="font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{t.category || "—"}</TableCell>
                  <TableCell className="text-sm">{t.difficulty}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={t.is_published} onCheckedChange={(v) => toggleField(t.id, "is_published", v)} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={t.is_featured} onCheckedChange={(v) => toggleField(t.id, "is_featured", v)} />
                  </TableCell>
                  <TableCell className="text-center text-sm font-mono">{t.installs_count}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTemplate(t.id)}><Trash2 size={14} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifica Template" : "Nuovo Template"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Slug *</Label>
                  <Input className="mt-1" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="report-serale-cantiere" />
                </div>
                <div>
                  <Label>Nome *</Label>
                  <Input className="mt-1" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Descrizione</Label>
                <Textarea className="mt-1" rows={2} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={editing.category || ""} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Icona</Label>
                  <Input className="mt-1" value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
                </div>
                <div>
                  <Label>Difficoltà</Label>
                  <Select value={editing.difficulty || "facile"} onValueChange={(v) => setEditing({ ...editing, difficulty: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["facile", "medio", "avanzato"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tempo setup (min)</Label>
                  <Input className="mt-1" type="number" value={editing.estimated_setup_min || 30} onChange={(e) => setEditing({ ...editing, estimated_setup_min: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Canali (separati da virgola)</Label>
                  <Input className="mt-1" value={(editing.channel || []).join(", ")} onChange={(e) => setEditing({ ...editing, channel: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_published || false} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                  <Label>Pubblicato</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_featured || false} onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })} />
                  <Label>In evidenza</Label>
                </div>
              </div>

              <div>
                <Label>Prompt Template *</Label>
                <Textarea className="mt-1 font-mono text-xs" rows={10} value={editing.prompt_template || ""} onChange={(e) => setEditing({ ...editing, prompt_template: e.target.value })} />
              </div>

              <div>
                <Label>First Message Template</Label>
                <Textarea className="mt-1" rows={3} value={editing.first_message_template || ""} onChange={(e) => setEditing({ ...editing, first_message_template: e.target.value })} />
              </div>

              <div>
                <Label>Config Schema (JSON)</Label>
                <Textarea className="mt-1 font-mono text-xs" rows={8} value={configSchemaText} onChange={(e) => setConfigSchemaText(e.target.value)} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 size={14} className="mr-1 animate-spin" />}
                  {editing.id ? "Salva Modifiche" : "Crea Template"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
