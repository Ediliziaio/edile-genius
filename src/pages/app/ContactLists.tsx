import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ListForm {
  name: string;
  description: string;
}

export default function ContactListsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ListForm>({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["contact-lists", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_lists")
        .select("*, contact_list_members(count)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = lists.filter((l: any) => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome obbligatorio", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_lists").insert({
        company_id: companyId!,
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Lista creata" });
      setShowCreate(false);
      setForm({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["contact-lists", companyId] });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contact_lists").delete().eq("id", id);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Lista eliminata" });
      queryClient.invalidateQueries({ queryKey: ["contact-lists", companyId] });
    }
  };

  const getMemberCount = (list: any) => {
    const members = list.contact_list_members;
    if (Array.isArray(members) && members.length > 0 && typeof members[0] === "object" && "count" in members[0]) {
      return members[0].count;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Liste & Gruppi</h1>
          <p className="text-sm text-ink-500 mt-1">Organizza i tuoi contatti in liste</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-brand hover:bg-brand-hover text-white">
          <Plus className="w-4 h-4 mr-2" /> Nuova Lista
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <Input
          placeholder="Cerca liste..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white border-ink-200 text-ink-900 placeholder:text-ink-300"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-ink-200 bg-white p-12 text-center shadow-card">
          <Users className="w-10 h-10 mx-auto mb-3 text-ink-300" />
          <p className="text-ink-500 mb-2">Nessuna lista creata</p>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="border-ink-200 text-ink-700">
            <Plus className="w-4 h-4 mr-2" /> Crea la prima lista
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((list: any) => (
            <div key={list.id} className="rounded-card border border-ink-200 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-btn bg-brand-light flex items-center justify-center">
                    <Users className="w-4 h-4 text-brand-text" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-ink-900">{list.name}</h3>
                    <p className="text-xs text-ink-400">{getMemberCount(list)} contatti</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(list.id)} className="text-ink-300 hover:text-status-error transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {list.description && (
                <p className="text-xs text-ink-500 line-clamp-2">{list.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white border-ink-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-ink-900">Nuova Lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-ink-600">Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="es. Clienti VIP" />
            </div>
            <div className="space-y-1">
              <Label className="text-ink-600">Descrizione</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="Descrizione opzionale..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-ink-200 text-ink-700">Annulla</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-brand hover:bg-brand-hover text-white">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Crea lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
