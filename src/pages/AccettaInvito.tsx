import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';

type InviteStatus = 'loading' | 'needs_login' | 'accepting' | 'accepted' | 'error';

export default function AccettaInvito() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('invite') || searchParams.get('token') || '';
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus('error');
      setErrorMsg('Token invito mancante.');
      return;
    }
    if (!user) {
      // Check invite validity first, then prompt login
      checkInvite();
    } else {
      acceptInvite();
    }
  }, [user, authLoading, token]);

  async function checkInvite() {
    const { data, error } = await supabase
      .from('azienda_inviti')
      .select('id, accettato, scade_il, company_id')
      .eq('token', token)
      .single();

    if (error || !data) {
      setStatus('error');
      setErrorMsg('Invito non trovato o non valido.');
      return;
    }
    if (data.accettato) {
      setStatus('error');
      setErrorMsg('Questo invito è già stato utilizzato.');
      return;
    }
    if (data.scade_il && new Date(data.scade_il) < new Date()) {
      setStatus('error');
      setErrorMsg('Questo invito è scaduto.');
      return;
    }

    // Fetch company name for display
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', data.company_id)
      .single();
    if (company) setCompanyName(company.name);

    setStatus('needs_login');
  }

  async function acceptInvite() {
    setStatus('accepting');
    try {
      // Fetch invite
      const { data: invite, error: invErr } = await supabase
        .from('azienda_inviti')
        .select('id, accettato, scade_il, company_id, ruolo, email')
        .eq('token', token)
        .single();

      if (invErr || !invite) throw new Error('Invito non trovato.');
      if (invite.accettato) throw new Error('Invito già utilizzato.');
      if (invite.scade_il && new Date(invite.scade_il) < new Date()) throw new Error('Invito scaduto.');

      // Fetch company name
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', invite.company_id)
        .single();
      if (company) setCompanyName(company.name);

      // Update profile company_id
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ company_id: invite.company_id })
        .eq('id', user!.id);
      if (profileErr) throw profileErr;

      // Assign role based on invite
      const roleMap: Record<string, string> = {
        owner: 'company_admin',
        admin: 'company_admin',
        membro: 'company_user',
      };
      const appRole = roleMap[invite.ruolo || 'membro'] || 'company_user';

      // Upsert role
      await supabase
        .from('user_roles')
        .upsert(
          { user_id: user!.id, role: appRole } as any,
          { onConflict: 'user_id,role' }
        );

      // Mark invite as accepted
      await supabase
        .from('azienda_inviti')
        .update({ accettato: true } as any)
        .eq('id', invite.id);

      setStatus('accepted');
      toast.success(`Benvenuto in ${company?.name || 'azienda'}!`);

      // Redirect after short delay
      setTimeout(() => navigate('/app'), 2000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Errore durante l\'accettazione dell\'invito.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Invito Team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' || status === 'accepting' ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {status === 'loading' ? 'Verifica invito in corso…' : 'Accettazione invito…'}
              </p>
            </>
          ) : status === 'needs_login' ? (
            <>
              <LogIn className="h-10 w-10 text-primary" />
              <p className="text-center text-sm">
                {companyName
                  ? `Sei stato invitato a unirti a **${companyName}**.`
                  : 'Hai ricevuto un invito.'}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Accedi o crea un account per accettare l'invito.
              </p>
              <div className="flex gap-2 w-full">
                <Button asChild className="flex-1">
                  <Link to={`/login?redirect=/accetta-invito?invite=${token}`}>Accedi</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to={`/signup?redirect=/accetta-invito?invite=${token}`}>Registrati</Link>
                </Button>
              </div>
            </>
          ) : status === 'accepted' ? (
            <>
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-center font-medium">Invito accettato!</p>
              <p className="text-center text-sm text-muted-foreground">
                Stai per essere reindirizzato alla dashboard…
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="text-center text-sm text-destructive">{errorMsg}</p>
              <Button asChild variant="outline">
                <Link to="/">Torna alla home</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
