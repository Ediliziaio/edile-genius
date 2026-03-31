// B3 fix: useInfiniteQuery con paginazione server-side
// M1 fix: Tab "Chiamate Programmate" per callbacks

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useInternalCallLogs, useScheduledCallbacks } from '../hooks/useInternalCallLogs';
import { CallDetailDrawer } from '../components/CallDetailDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Phone, Search, Loader2, ChevronDown, CalendarClock, PhoneCall } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  initiated: 'bg-blue-100 text-blue-700',
  answered: 'bg-green-100 text-green-700',
  no_answer: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  busy: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<string, string> = {
  initiated: 'Avviata',
  answered: 'Risposta',
  no_answer: 'Non risposta',
  failed: 'Fallita',
  busy: 'Occupato',
};

export default function InternalCallLogsPage() {
  const companyId = useCompanyId();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { logs, totalCount, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInternalCallLogs({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: statusFilter || undefined,
    });

  const { data: callbacks = [] } = useScheduledCallbacks(companyId);

  // Ricerca locale sul nome (i filtri principali sono server-side)
  const filteredLogs = search
    ? logs.filter(
        (l) =>
          l.contact?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          l.phone_number?.includes(search)
      )
    : logs;

  const handleCallNow = async (phone: string, agentId?: string) => {
    if (!phone) {
      toast.error('Numero di telefono mancante');
      return;
    }
    toast.info('Funzione di richiamata in arrivo');
  };

  const handleCancelCallback = async (appointmentId: string) => {
    const { error } = await (supabase as any)
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);
    if (error) toast.error(error.message);
    else toast.success('Callback annullata');
  };

  return (
    <>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Registro Chiamate</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount > 0 ? `${totalCount} chiamate totali` : 'Nessuna chiamata registrata'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="registro">
          <TabsList>
            <TabsTrigger value="registro">
              <Phone className="h-4 w-4 mr-1" />
              Registro chiamate
            </TabsTrigger>
            <TabsTrigger value="programmate">
              <CalendarClock className="h-4 w-4 mr-1" />
              Programmate
              {callbacks.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-4 px-1.5 text-[10px]">
                  {callbacks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Registro ── */}
          <TabsContent value="registro" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca contatto o numero..."
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti gli stati</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
                placeholder="Da data"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
                placeholder="A data"
              />
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="rounded-xl border bg-card p-16 text-center">
                <Phone className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Nessuna chiamata trovata</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contatto</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Durata</TableHead>
                        <TableHead>Campagna</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedCallId(log.id)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {log.contact?.full_name || 'Sconosciuto'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {log.phone_number || log.contact?.phone || '—'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${STATUS_COLORS[log.status] || ''} border-none text-xs`}>
                              {STATUS_LABELS[log.status] || log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.duration_sec
                              ? `${Math.floor(log.duration_sec / 60)}m ${log.duration_sec % 60}s`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.campaign?.name || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(log.started_at), 'dd/MM HH:mm', { locale: it })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* B3: Load more button */}
                {hasNextPage && (
                  <div className="flex flex-col items-center gap-1 pt-2">
                    <p className="text-xs text-muted-foreground">
                      Mostrando {filteredLogs.length} di {totalCount} chiamate
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="gap-2"
                    >
                      {isFetchingNextPage
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ChevronDown className="h-4 w-4" />
                      }
                      Carica altri
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Tab: Programmate (M1) ── */}
          <TabsContent value="programmate" className="space-y-4 mt-4">
            {callbacks.length === 0 ? (
              <div className="rounded-xl border bg-card p-16 text-center">
                <CalendarClock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Nessun callback programmato</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Gli agenti AI programmeranno i callback automaticamente durante le conversazioni
                </p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Ora</TableHead>
                      <TableHead>Contatto</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callbacks.map((cb: any) => (
                      <TableRow key={cb.id}>
                        <TableCell className="text-sm font-medium">
                          {cb.scheduled_at
                            ? format(new Date(cb.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: it })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {cb.contact?.full_name || 'Sconosciuto'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cb.contact?.phone || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {cb.notes || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={() => handleCallNow(cb.contact?.phone, undefined)}
                            >
                              <PhoneCall className="h-3 w-3" />
                              Chiama
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => handleCancelCallback(cb.id)}
                            >
                              Rimuovi
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* B8: CallDetailDrawer con query per internal_call_log_id */}
      <CallDetailDrawer
        callId={selectedCallId}
        onClose={() => setSelectedCallId(null)}
      />
    </>
  );
}
