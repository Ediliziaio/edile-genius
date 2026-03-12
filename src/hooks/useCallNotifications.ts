import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from "sonner";

interface CallPayload {
  id: string;
  status: string;
  contact_id: string | null;
  to_number: string;
}

const STATUS_MESSAGES: Record<string, { emoji: string; template: (name: string) => string }> = {
  ringing: {
    emoji: "📞",
    template: (n) => `Chiamata a ${n} in corso...`,
  },
  in_progress: {
    emoji: "🟢",
    template: (n) => `${n} ha risposto!`,
  },
  completed: {
    emoji: "✅",
    template: (n) => `Chiamata con ${n} completata`,
  },
  ended: {
    emoji: "✅",
    template: (n) => `Chiamata con ${n} terminata`,
  },
  failed: {
    emoji: "❌",
    template: (n) => `Chiamata a ${n} fallita`,
  },
};

export function useCallNotifications() {
  const companyId = useCompanyId();
  const prevStatuses = useRef<Map<string, string>>(new Map());
  const contactNameCache = useRef<Map<string, string>>(new Map());

  // Clear caches when companyId changes (logout / tenant switch)
  useEffect(() => {
    prevStatuses.current.clear();
    contactNameCache.current.clear();
  }, [companyId]);

  const getContactName = useCallback(async (contactId: string | null): Promise<string | null> => {
    if (!contactId) return null;
    if (contactNameCache.current.has(contactId)) return contactNameCache.current.get(contactId)!;

    const { data } = await supabase
      .from("contacts")
      .select("full_name")
      .eq("id", contactId)
      .single();

    const name = data?.full_name ?? null;
    if (name) {
      contactNameCache.current.set(contactId, name);
      if (contactNameCache.current.size > 100) {
        const first = contactNameCache.current.keys().next().value;
        if (first) contactNameCache.current.delete(first);
      }
    }
    return name;
  }, []);

  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`call-notifications-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "outbound_call_log",
          filter: `company_id=eq.${companyId}`,
        },
        async (payload) => {
          const newRow = payload.new as CallPayload;
          const oldRow = payload.old as Partial<CallPayload>;
          const newStatus = newRow.status;
          const oldStatus = oldRow.status ?? prevStatuses.current.get(newRow.id);

          // Skip if status didn't change
          if (!newStatus || newStatus === oldStatus) return;

          prevStatuses.current.set(newRow.id, newStatus);

          const msgConfig = STATUS_MESSAGES[newStatus];
          if (!msgConfig) return;

          const contactName = await getContactName(newRow.contact_id);
          const displayName = contactName || newRow.to_number || "contatto";

          const message = `${msgConfig.emoji} ${msgConfig.template(displayName)}`;

          if (newStatus === "failed") {
            toast.error(message);
          } else if (newStatus === "completed" || newStatus === "ended") {
            toast.success(message);
          } else {
            toast.info(message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);
}
