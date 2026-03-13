import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building2, Upload, Palette, Globe, Phone, Mail, Save, Loader2, User, Lock } from 'lucide-react';

const BRAND_PRESETS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0F172A'];

export function TabProfilo() {
  const { profile, user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ['company-profile', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('*').eq('id', companyId!).single();
      return data;
    },
    enabled: !!companyId,
  });

  const [form, setForm] = useState({
    name: '', email: '', phone: '', website: '', address: '', description: '', brand_color: '#2563EB', logo_url: '',
  });

  // Personal profile state
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        email: (company as any).email || '',
        phone: company.phone || '',
        website: company.website || '',
        address: company.address || '',
        description: (company as any).description || '',
        brand_color: (company as any).brand_color || '#2563EB',
        logo_url: company.logo_url || '',
      });
    }
  }, [company]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const salva = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('companies')
        .update({
          name: form.name,
          phone: form.phone,
          website: form.website,
          address: form.address,
          logo_url: form.logo_url || null,
        } as any)
        .eq('id', companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-profile', companyId] });
      toast({ title: 'Profilo salvato!' });
    },
    onError: (err: any) => toast({ title: 'Errore', description: err.message, variant: 'destructive' }),
  });

  const savePersonalProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl || null }).eq('id', user.id);
    setSavingProfile(false);
    toast(error ? { title: 'Errore', description: error.message, variant: 'destructive' } : { title: 'Profilo aggiornato' });
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (newPassword.length < 8) { setPwError('Minimo 8 caratteri'); return; }
    if (newPassword !== confirmPassword) { setPwError('Le password non corrispondono'); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) { toast({ title: 'Errore', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Password aggiornata' }); setNewPassword(''); setConfirmPassword(''); }
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Il tuo profilo ── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Il tuo profilo</h2>
        <p className="text-sm text-muted-foreground">Gestisci le tue informazioni personali e la password</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-foreground">Dati personali</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Email</Label>
            <Input value={profile?.email || ''} disabled className="opacity-60" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Nome completo</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Mario Rossi" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Avatar URL</Label>
              <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <Button onClick={savePersonalProfile} disabled={savingProfile} variant="outline" className="gap-2">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva profilo
          </Button>

          <Separator className="my-2" />

          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-foreground">Cambia password</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Nuova password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimo 8 caratteri" autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Conferma password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ripeti la password" autoComplete="new-password" />
            </div>
          </div>
          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          <Button onClick={handleChangePassword} disabled={savingPassword || !newPassword} variant="outline" className="gap-2">
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Aggiorna password
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* ── Profilo Azienda ── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profilo Azienda</h2>
        <p className="text-sm text-muted-foreground">Queste informazioni appaiono nei documenti e nelle comunicazioni ai clienti</p>
      </div>

      {/* Identity */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-foreground">Identità visiva</span>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <Label className="text-muted-foreground text-xs">URL Logo</Label>
              <Input value={form.logo_url} onChange={e => update('logo_url', e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
          </div>

          {/* Brand color */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Colore primario brand</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.brand_color} onChange={e => update('brand_color', e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
              <Input value={form.brand_color} onChange={e => update('brand_color', e.target.value)} className="font-mono text-sm w-32" maxLength={7} />
              <div className="flex gap-1">
                {BRAND_PRESETS.map(c => (
                  <button key={c} onClick={() => update('brand_color', c)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: form.brand_color === c ? 'hsl(var(--foreground))' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Anteprima:</span>
              <span className="text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ backgroundColor: form.brand_color }}>
                {form.name || 'Nome Azienda'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company data */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm text-foreground">Dati azienda</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Ragione sociale *</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Domus Group S.r.l." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Email aziendale</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input value={form.email} onChange={e => update('email', e.target.value)} placeholder="info@azienda.it" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Telefono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+39 02 0000000" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Sito web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://www.azienda.it" className="pl-9" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Indirizzo</Label>
            <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Via Roma 1, Milano" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Descrizione (appare nei preventivi)</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Descrivi brevemente la tua azienda…" className="resize-none" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => salva.mutate()} disabled={salva.isPending} className="gap-2">
          {salva.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {salva.isPending ? 'Salvataggio…' : 'Salva modifiche'}
        </Button>
      </div>
    </div>
  );
}
