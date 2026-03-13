import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAziendaSettings } from '@/hooks/useAziendaSettings';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPermissionsModal } from './UserPermissionsModal';
import { InvitaUtenteModal } from './InvitaUtenteModal';
import { Users, UserPlus, Shield, Settings2, Trash2, Search, Crown, Mail, Clock, XCircle, Building2 } from 'lucide-react';

const RUOLO_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  owner: { label: 'Proprietario', color: 'bg-amber-100 text-amber-700', icon: Crown },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700', icon: Shield },
  membro: { label: 'Membro', color: 'bg-muted text-muted-foreground', icon: Users },
};

export function TabUtenti() {
  const { user, roles, profile } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [permissionsUserId, setPermissionsUserId] = useState<string | null>(null);
  const [showInvitaModal, setShowInvitaModal] = useState(false);

  const isAdmin = roles.includes('company_admin') || roles.includes('superadmin');

  // Guard: no company
  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Nessuna azienda associata</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Il tuo account non è ancora collegato a un'azienda. Contatta un amministratore per ricevere un invito.
        </p>
      </div>
    );
  }

  return <TabUtentiContent companyId={companyId} user={user} profile={profile} roles={roles} isAdmin={isAdmin} search={search} setSearch={setSearch} permissionsUserId={permissionsUserId} setPermissionsUserId={setPermissionsUserId} showInvitaModal={showInvitaModal} setShowInvitaModal={setShowInvitaModal} toast={toast} qc={qc} />;
}

function TabUtentiContent({ companyId, user, profile, roles, isAdmin, search, setSearch, permissionsUserId, setPermissionsUserId, showInvitaModal, setShowInvitaModal, toast, qc }: any) {
  const { membri, invitaUtente, rimuoviMembro, cambiaRuolo } = useAziendaSettings(companyId);

  // Pending invitations
  const { data: invitiPendenti = [] } = useQuery({
    queryKey: ['azienda-inviti-pendenti', companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('azienda_inviti')
        .select('id, email, ruolo, creato_il, scade_il')
        .eq('company_id', companyId)
        .eq('accettato', false);
      return data || [];
    },
    enabled: !!companyId,
  });

  const revocaInvito = useMutation({
    mutationFn: async (invitoId: string) => {
      const { error } = await (supabase as any)
        .from('azienda_inviti')
        .delete()
        .eq('id', invitoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['azienda-inviti-pendenti', companyId] });
      toast({ title: 'Invito revocato' });
    },
    onError: (err: any) => toast({ title: 'Errore', description: err.message, variant: 'destructive' }),
  });

  // Ensure current user always appears in the list
  const membriWithSelf = (() => {
    if (!user) return membri;
    const found = membri.find((m: any) => m.user_id === user.id);
    if (found) return membri;
    // Add current user as fallback
    return [
      {
        user_id: user.id,
        nome: profile?.full_name || user.email,
        email: user.email,
        avatar_url: profile?.avatar_url || null,
        ruolo: roles.includes('company_admin') ? 'admin' : 'membro',
      },
      ...membri,
    ];
  })();

  const filtratiMembri = membriWithSelf.filter((m: any) =>
    (m.nome || m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Utenti & Accessi</h2>
          <p className="text-sm text-muted-foreground">Gestisci chi può accedere all'account e a quali strumenti</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvitaModal(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Invita utente
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{membriWithSelf.length}</p>
          <p className="text-xs text-muted-foreground">Utenti totali</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{membriWithSelf.filter((m: any) => m.ruolo === 'admin').length}</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{invitiPendenti.length}</p>
          <p className="text-xs text-muted-foreground">Inviti in sospeso</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca utenti..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {filtratiMembri.map((membro: any) => {
          const ruoloCfg = RUOLO_CONFIG[membro.ruolo] || RUOLO_CONFIG.membro;
          const email = membro.email || '—';
          const iniziali = (membro.nome || email).slice(0, 2).toUpperCase();
          const isSelf = membro.user_id === user?.id;

          return (
            <Card key={membro.user_id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={membro.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{iniziali}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{membro.nome || email}</p>
                    {isSelf && <Badge variant="secondary" className="text-xs">Tu</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && !isSelf ? (
                    <Select
                      value={membro.ruolo}
                      onValueChange={v => cambiaRuolo.mutate({ userId: membro.user_id, ruolo: v as any })}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="membro">Membro</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`text-xs ${ruoloCfg.color}`}>{ruoloCfg.label}</Badge>
                  )}

                  {isAdmin && !isSelf && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setPermissionsUserId(membro.user_id)} className="gap-1 h-8 text-muted-foreground hover:text-primary">
                        <Settings2 className="w-4 h-4" /> Permessi
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Rimuovere questo utente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {membro.nome || email} perderà l'accesso a tutti gli strumenti dell'azienda. Questa azione non può essere annullata.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => rimuoviMembro.mutate(membro.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Rimuovi
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtratiMembri.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-muted-foreground">Nessun utente trovato</p>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitiPendenti.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Inviti in sospeso</h3>
          </div>
          {invitiPendenti.map((invito: any) => (
            <Card key={invito.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{invito.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Ruolo: {invito.ruolo === 'admin' ? 'Admin' : 'Membro'} · Inviato il {new Date(invito.creato_il).toLocaleDateString('it-IT')}
                  </p>
                </div>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-destructive">
                        <XCircle className="w-4 h-4" /> Revoca
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revocare l'invito?</AlertDialogTitle>
                        <AlertDialogDescription>
                          L'invito a {invito.email} verrà annullato e il link non sarà più valido.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revocaInvito.mutate(invito.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Revoca invito
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showInvitaModal && (
        <InvitaUtenteModal
          onInvita={(email, ruolo) => {
            invitaUtente.mutate({ email, ruolo });
            setShowInvitaModal(false);
          }}
          onClose={() => setShowInvitaModal(false)}
        />
      )}

      {permissionsUserId && companyId && (
        <UserPermissionsModal
          userId={permissionsUserId}
          companyId={companyId}
          onClose={() => setPermissionsUserId(null)}
        />
      )}
    </div>
  );
}
