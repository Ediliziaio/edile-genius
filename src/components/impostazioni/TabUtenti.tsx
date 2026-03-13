import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAziendaSettings } from '@/hooks/useAziendaSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPermissionsModal } from './UserPermissionsModal';
import { InvitaUtenteModal } from './InvitaUtenteModal';
import { Users, UserPlus, Shield, Settings2, Trash2, Search, Crown } from 'lucide-react';

const RUOLO_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  owner: { label: 'Proprietario', color: 'bg-amber-100 text-amber-700', icon: Crown },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700', icon: Shield },
  membro: { label: 'Membro', color: 'bg-muted text-muted-foreground', icon: Users },
};

export function TabUtenti() {
  const { user, roles } = useAuth();
  const companyId = useCompanyId();
  const { membri, invitaUtente, rimuoviMembro, cambiaRuolo } = useAziendaSettings(companyId!);

  const [search, setSearch] = useState('');
  const [permissionsUserId, setPermissionsUserId] = useState<string | null>(null);
  const [showInvitaModal, setShowInvitaModal] = useState(false);

  const isAdmin = roles.includes('company_admin') || roles.includes('superadmin');

  const filtratiMembri = membri.filter((m: any) =>
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
          <p className="text-2xl font-bold text-foreground">{membri.length}</p>
          <p className="text-xs text-muted-foreground">Utenti totali</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{membri.filter((m: any) => m.ruolo === 'admin').length}</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{membri.length}</p>
          <p className="text-xs text-muted-foreground">Accesso attivo</p>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => rimuoviMembro.mutate(membro.user_id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
