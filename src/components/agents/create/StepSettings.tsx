import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, MessageSquare, FileText, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import StepConversation from "./StepConversation";
import StepAdvanced from "./StepAdvanced";

interface StepSettingsProps {
  form: any;
  update: (key: string, value: any) => void;
}

export default function StepSettings({ form, update }: StepSettingsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const sections = [
    {
      key: "conversation",
      icon: MessageSquare,
      title: "Comportamento conversazione",
      description: "Tempi di attesa, interruzioni e comportamento automatico",
      content: <StepConversation form={form} update={update} />,
    },
    {
      key: "knowledge",
      icon: FileText,
      title: "Archivio documenti e integrazioni",
      description: "Carica documenti, collega API esterne e definisci criteri di valutazione",
      content: <StepAdvanced form={form} update={update} />,
    },
    {
      key: "safety",
      icon: Shield,
      title: "Sicurezza e privacy",
      description: "Protezione dati sensibili e salvataggio conversazioni",
      content: null, // Already handled inside StepAdvanced
    },
  ];

  // Filter out the safety section since it's part of StepAdvanced
  const visibleSections = sections.filter(s => s.content !== null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Impostazioni</h2>
        <p className="text-sm text-ink-400 mt-1">
          Le impostazioni predefinite funzionano già bene per la maggior parte degli agenti.
          Espandi una sezione solo se vuoi personalizzare qualcosa.
        </p>
      </div>

      <div className="space-y-3">
        {visibleSections.map(section => {
          const isOpen = openSections[section.key] ?? false;
          const Icon = section.icon;

          return (
            <Collapsible key={section.key} open={isOpen} onOpenChange={() => toggle(section.key)}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3.5 rounded-card border border-ink-200 bg-ink-50 hover:bg-ink-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-ink-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-ink-700">{section.title}</p>
                      <p className="text-xs text-ink-400">{section.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-ink-400 transition-transform shrink-0", isOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-4 pb-2 px-1">
                  {section.content}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
