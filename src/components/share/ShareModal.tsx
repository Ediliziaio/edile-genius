import { useState } from 'react';
import { Link2, Copy, Eye, Trash2, Calendar, Clock, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { it } from 'date-fns/locale';
import { useShareLinks, type CreateShareOptions, type GalleryItem, type ShareLink } from '@/hooks/useShareLinks';

export interface ShareableItem {
  table: string;
  id: string;
  title?: string;
  thumbnailUrl?: string;
  modulo?: string;
}

interface ShareModalProps {
  companyId: string;
  items: ShareableItem[];
  onClose: () => void;
}

const MODULO_LABEL: Record<string, string> = {
  infissi: '🪟 Infissi',
  stanza: '🛋️ Stanza',
  facciata: '🏠 Facciata',
  persiane: '🪟 Persiane',
  pavimento: '🪵 Pavimento',
  bagno: '🛁 Bagno',
};

const SCADENZA_OPTIONS = [
  { value: '0', label: 'Nessuna scadenza' },
  { value: '7', label: '7 giorni' },
  { value: '14', label: '14 giorni' },
  { value: '30', label: '30 giorni' },
  { value: '90', label: '3 mesi' },
];

type Tab = 'crea' | 'gestisci';

export function ShareModal({ companyId, items, onClose }: ShareModalProps) {
  const { shareLinks, createLink, revokeLink, copyLink, stats } = useShareLinks(companyId);
  const [activeTab, setActiveTab] = useState<Tab>('crea');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(items.map(i => i.id)));
  const [nomeDestinatario, setNomeDestinatario] = useState('');
  const [emailDestinatario, setEmailDestinatario] = useState('');
  const [messaggio, setMessaggio] = useState('');
  const [scadenzaGiorni, setScadenzaGiorni] = useState('0');
  const [mostraBefore, setMostraBefore] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    const selected = items.filter(i => selectedIds.has(i.id));
    if (selected.length === 0) return;
    setCreating(true);

    const galleryItems: GalleryItem[] = selected.map(i => ({ table: i.table, id: i.id }));

    const url = await createLink({
      galleryItems,
      nomeDestinatario: nomeDestinatario || undefined,
      emailDestinatario: emailDestinatario || undefined,
      messaggio: messaggio || undefined,
      scadenzaGiorni: scadenzaGiorni !== '0' ? parseInt(scadenzaGiorni) : null,
      mostraBefore,
    });

    setCreating(false);
    if (url) {
      setCreatedUrl(url);
      setActiveTab('gestisci');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Condividi con il cliente</h2>
              <p className="text-xs text-muted-foreground">{items.length} render disponibili</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['crea', 'gestisci'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'crea' ? '+ Nuovo link' : `Link attivi (${stats.attivi})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'crea' && (
            <div className="p-5 space-y-5">
              {/* Success */}
              {createdUrl && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <p className="text-sm font-medium text-primary">✓ Link creato!</p>
                  <div className="flex gap-2">
                    <Input value={createdUrl} readOnly className="text-xs h-8" />
                    <Button
                      size="sm"
                      className="flex-shrink-0 gap-1 h-8"
                      onClick={() => { navigator.clipboard.writeText(createdUrl); }}
                    >
                      <Copy className="w-3 h-3" /> Copia
                    </Button>
                  </div>
                </div>
              )}

              {/* Selection */}
              <div>
                <Label className="text-xs text-muted-foreground">
                  Render da includere ({selectedIds.size}/{items.length})
                </Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {items.map(item => (
                    <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      {item.thumbnailUrl && (
                        <img src={item.thumbnailUrl} alt="" className="w-10 h-8 rounded object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title || 'Render senza titolo'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {MODULO_LABEL[item.modulo || ''] || item.table}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Before/After toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Mostra immagine originale</p>
                  <p className="text-xs text-muted-foreground">Il cliente può vedere il prima/dopo</p>
                </div>
                <Switch checked={mostraBefore} onCheckedChange={setMostraBefore} />
              </div>

              {/* Recipient */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome destinatario</Label>
                  <Input
                    value={nomeDestinatario}
                    onChange={e => setNomeDestinatario(e.target.value)}
                    placeholder="es. Mario Rossi"
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email destinatario</Label>
                  <Input
                    value={emailDestinatario}
                    onChange={e => setEmailDestinatario(e.target.value)}
                    placeholder="cliente@email.com"
                    className="mt-1 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <Label className="text-xs text-muted-foreground">Messaggio per il cliente</Label>
                <Textarea
                  value={messaggio}
                  onChange={e => setMessaggio(e.target.value)}
                  placeholder="Ecco le proposte di render per il suo progetto..."
                  className="mt-1 text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Expiry */}
              <div>
                <Label className="text-xs text-muted-foreground">Scadenza link</Label>
                <Select value={scadenzaGiorni} onValueChange={setScadenzaGiorni}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCADENZA_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {activeTab === 'gestisci' && (
            <div className="p-5 space-y-3">
              {shareLinks.length === 0 ? (
                <div className="text-center py-10">
                  <Link2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Nessun link creato ancora</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setActiveTab('crea')}>
                    Crea il primo link
                  </Button>
                </div>
              ) : (
                shareLinks.map(link => (
                  <ShareLinkCard
                    key={link.id}
                    link={link}
                    onCopy={() => copyLink(link.token)}
                    onRevoke={() => revokeLink(link.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'crea' && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>Annulla</Button>
            <Button
              size="sm"
              disabled={selectedIds.size === 0 || creating}
              onClick={handleCreate}
              className="gap-1.5"
            >
              {creating ? '⟳ Creando...' : <><Link2 className="w-3.5 h-3.5" /> Crea link</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ShareLinkCard({ link, onCopy, onRevoke }: { link: ShareLink; onCopy: () => void; onRevoke: () => void }) {
  const isExpired = link.scade_il ? isPast(new Date(link.scade_il)) : false;

  return (
    <div className={`p-4 rounded-xl border ${
      !link.attivo || isExpired ? 'border-border bg-muted/50 opacity-60' : 'border-border bg-card hover:border-primary/30'
    } transition-colors`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {link.nome_destinatario && (
              <span className="text-sm font-semibold text-foreground">{link.nome_destinatario}</span>
            )}
            {!link.attivo && <Badge variant="secondary" className="text-xs">Revocato</Badge>}
            {isExpired && link.attivo && <Badge variant="secondary" className="text-xs">Scaduto</Badge>}
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">/s/{link.token.slice(0, 16)}…</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy} disabled={!link.attivo || isExpired}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={`${window.location.origin}/s/${link.token}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
          {link.attivo && !isExpired && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onRevoke}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{link.views_count || 0} views</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(link.created_at), { addSuffix: true, locale: it })}
        </span>
        {link.scade_il && !isExpired && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Scade {format(new Date(link.scade_il), 'd MMM', { locale: it })}
          </span>
        )}
      </div>
    </div>
  );
}
