import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Trash2, Plus, Search, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContactListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = useCompanyId();

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addContactId, setAddContactId] = useState("");

  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ["contact-list", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_lists").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["contact-list-members", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_list_members")
        .select("id, contact_id, added_at, contacts:contact_id(id, full_name, phone, email, status, company_name)")
        .eq("list_id", id!);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allContacts = [] } = useQuery({
    queryKey: ["all-contacts-for-list", companyId],
    enabled: !!companyId && showAdd,
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("id, full_name, phone").eq("company_id", companyId!).order("full_name");
      return data || [];
    },
  });

  const memberContactIds = new Set(members.map((m: any) => m.contact_id));
  const availableContacts = allContacts.filter((c: any) => !memberContactIds.has(c.id));

  const filteredMembers = members.filter((m: any) => {
    if (!search) return true;
    const c = m.contacts as any;
    const q = search.toLowerCase();
    return c?.full_name?.toLowerCase().includes(q) || c?.phone?.includes(q) || c?.email?.toLowerCase().includes(q);
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["contact-list-members", id] });
    queryClient.invalidateQueries({ queryKey: ["contact-list", id] });
  };

  const handleRemove = async (memberId: string) => {
    const { error } = await supabase.from("contact_list_members").delete().eq("id", memberId);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else { toast({ title: "Contatto rimosso dalla lista" }); invalidate(); }
  };

  const handleAdd = async () => {
    if (!addContactId || !id) return;
    const { error } = await supabase.from("contact_list_members").insert({ list_id: id, contact_id: addContactId });
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Contatto aggiunto" });
      setShowAdd(false); setAddContactId(""); invalidate();
    }
  };

  const isLoading = listLoading || membersLoading;

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="text-ink-500">
          <Link to="/app/lists"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-btn flex items-center justify-center text-lg" style={{ backgroundColor: `${list?.color || '#6366f1'}20` }}>
            {list?.icon || "📋"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-900">{list?.name}</h1>
            <p className="text-sm text-ink-500">{members.length} contatti nella lista</p>
          </div>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowAdd(true)} className="bg-brand hover:bg-brand-hover text-white">
            <Plus className="w-4 h-4 mr-2" /> Aggiungi Contatto
          </Button>
        </div>
      </div>

      {list?.description && <p className="text-sm text-ink-500">{list.description}</p>}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <Input placeholder="Cerca nella lista..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white border-ink-200 text-ink-900 placeholder:text-ink-300" />
      </div>

      {filteredMembers.length === 0 ? (
        <div className="rounded-card border border-ink-200 bg-white p-12 text-center shadow-card">
          <p className="text-ink-500 mb-2">Nessun contatto nella lista</p>
          <Button variant="outline" onClick={() => setShowAdd(true)} className="border-ink-200 text-ink-700">
            <Plus className="w-4 h-4 mr-2" /> Aggiungi il primo contatto
          </Button>
        </div>
      ) : (
        <div className="rounded-card border border-ink-200 bg-white overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-ink-50">
                <TableHead className="text-ink-500">Nome</TableHead>
                <TableHead className="text-ink-500">Azienda</TableHead>
                <TableHead className="text-ink-500">Telefono</TableHead>
                <TableHead className="text-ink-500">Email</TableHead>
                <TableHead className="text-ink-500">Stato</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((m: any) => {
                const c = m.contacts as any;
                return (
                  <TableRow key={m.id} className="hover:bg-ink-50">
                    <TableCell className="font-medium text-ink-900">{c?.full_name || "—"}</TableCell>
                    <TableCell className="text-ink-500">{c?.company_name || "—"}</TableCell>
                    <TableCell className="text-ink-500">{c?.phone || "—"}</TableCell>
                    <TableCell className="text-ink-500">{c?.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs border-ink-200">{c?.status || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(m.id)} className="text-ink-400 hover:text-status-error h-8 w-8">
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-white border-ink-200 max-w-sm">
          <DialogHeader><DialogTitle className="text-ink-900">Aggiungi Contatto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={addContactId} onValueChange={setAddContactId}>
              <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue placeholder="Seleziona contatto..." /></SelectTrigger>
              <SelectContent>
                {availableContacts.length === 0 ? (
                  <SelectItem value="none" disabled>Nessun contatto disponibile</SelectItem>
                ) : availableContacts.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name} {c.phone ? `(${c.phone})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-ink-200 text-ink-700">Annulla</Button>
            <Button onClick={handleAdd} disabled={!addContactId} className="bg-brand hover:bg-brand-hover text-white">Aggiungi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
