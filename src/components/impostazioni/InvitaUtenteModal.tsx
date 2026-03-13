import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield, Send } from 'lucide-react';

interface Props {
  onInvita: (email: string, ruolo: 'admin' | 'membro') => void;
  onClose: () => void;
}

export function InvitaUtenteModal({ onInvita, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [ruolo, setRuolo] = useState<'admin' | 'membro'>('membro');

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invita utente</DialogTitle>
          <DialogDescription>Inserisci l'email e scegli il ruolo per il nuovo membro del team.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nome@azienda.it"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Ruolo</Label>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all ${ruolo === 'membro' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setRuolo('membro')}
              >
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Membro</p>
                  <p className="text-xs text-muted-foreground mt-1">Accesso base alle funzionalità assegnate</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all ${ruolo === 'admin' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setRuolo('admin')}
              >
                <CardContent className="p-4 text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium text-foreground">Admin</p>
                  <p className="text-xs text-muted-foreground mt-1">Gestisce utenti, permessi e impostazioni</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Button onClick={() => onInvita(email, ruolo)} disabled={!email} className="w-full gap-2">
            <Send className="w-4 h-4" /> Invia invito
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
