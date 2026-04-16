import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Warning as AlertTriangle, CaretDown as ChevronDown, CaretUp as ChevronUp, Pill, Info, ShieldWarning as ShieldAlert, X } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { auth, fetchCollection, where } from "@/integrations/firebase";
import { useQuery } from "@tanstack/react-query";

interface DrugInteraction {
  id: string;
  drug_a: string;
  drug_b: string;
  interaction_type: string;
  description: string;
  recommendation: string | null;
}

interface DrugInteractionAlertProps {
  itemId?: string;
  itemName?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Fetch drug interaction data from OpenFDA drug label endpoint.
 * OpenFDA is CORS-enabled and free (no API key required).
 * We search for the drug's label and extract any drug_interactions text.
 */
async function fetchOpenFDAInteractions(
  medNames: string[]
): Promise<DrugInteraction[]> {
  if (medNames.length < 2) return [];

  const interactions: DrugInteraction[] = [];

  // Query each medication against others
  for (let i = 0; i < medNames.length && i < 4; i++) {
    const name = medNames[i].trim();
    if (!name) continue;

    try {
      const encoded = encodeURIComponent(`"${name}"`);
      const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encoded}+OR+openfda.generic_name:${encoded}&limit=1`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const label = json.results?.[0];
      if (!label?.drug_interactions?.[0]) continue;

      const interactionText: string = label.drug_interactions[0];

      // Match other meds in the interaction text
      for (let j = 0; j < medNames.length; j++) {
        if (i === j) continue;
        const otherName = medNames[j].trim().toLowerCase();
        const matchIndex = interactionText.toLowerCase().indexOf(otherName);
        if (matchIndex === -1) continue;

        // Extract a snippet around the match (200 chars)
        const start = Math.max(0, matchIndex - 60);
        const end = Math.min(interactionText.length, matchIndex + 160);
        const snippet = interactionText.slice(start, end).trim();

        // Infer severity from keywords
        const lowerSnippet = snippet.toLowerCase();
        let interaction_type = 'mild';
        if (lowerSnippet.includes('contraindicated') || lowerSnippet.includes('fatal') || lowerSnippet.includes('severe')) {
          interaction_type = 'severe';
        } else if (lowerSnippet.includes('caution') || lowerSnippet.includes('monitor') || lowerSnippet.includes('increase')) {
          interaction_type = 'moderate';
        }

        const id = `${name}__${otherName}`;
        if (!interactions.find(x => x.id === id)) {
          interactions.push({
            id,
            drug_a: medNames[i],
            drug_b: medNames[j],
            interaction_type,
            description: snippet.length < interactionText.length ? `...${snippet}...` : snippet,
            recommendation: 'Consulte seu médico ou farmacêutico.',
          });
        }
      }
    } catch {
      // Network error — skip this med
    }
  }

  return interactions;
}

export default function DrugInteractionAlert({
  itemId,
  itemName,
  className,
  compact = false
}: DrugInteractionAlertProps) {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Fetch list of active meds from Firebase
  const { data: medNames = [] } = useQuery({
    queryKey: ['active-med-names', itemId],
    queryFn: async (): Promise<string[]> => {
      const user = auth.currentUser;
      if (!user) return [];
      const { data: items } = await fetchCollection<{ name: string }>(
        `users/${user.uid}/medications`,
        [where('isActive', '==', true)]
      );
      const all = (items || []).map(i => i.name).filter(Boolean);
      if (itemName && !all.includes(itemName)) all.unshift(itemName);
      return all;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch interactions from OpenFDA (24h cache)
  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['drug-interactions-openfda', medNames.join(',')],
    queryFn: () => fetchOpenFDAInteractions(medNames),
    enabled: medNames.length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    retry: 1,
  });

  const handleDismiss = (id: string) => setDismissed(prev => [...prev, id]);
  const visibleInteractions = interactions.filter(i => !dismissed.includes(i.id));

  const getSeverityConfig = (type: string) => {
    switch (type) {
      case 'severe':
        return { color: "bg-destructive/15 text-destructive border-destructive/30", icon: ShieldAlert, label: language === 'pt' ? 'Grave' : 'Severe' };
      case 'moderate':
        return { color: "bg-warning/15 text-warning border-warning/30", icon: AlertTriangle, label: language === 'pt' ? 'Moderada' : 'Moderate' };
      default:
        return { color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: Info, label: language === 'pt' ? 'Leve' : 'Mild' };
    }
  };

  if (isLoading || visibleInteractions.length === 0) return null;

  if (compact) {
    const mostSevere = visibleInteractions.reduce((prev, curr) => {
      const order = ['severe', 'moderate', 'mild'];
      return order.indexOf(curr.interaction_type) < order.indexOf(prev.interaction_type) ? curr : prev;
    }, visibleInteractions[0]);
    const config = getSeverityConfig(mostSevere.interaction_type);
    const Icon = config.icon;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("inline-flex", className)}>
        <Badge className={cn("gap-1.5 cursor-pointer", config.color)} onClick={() => setExpanded(!expanded)}>
          <Icon className="h-3 w-3" />
          {visibleInteractions.length} {language === 'pt' ? 'interação' : 'interaction'}{visibleInteractions.length > 1 ? (language === 'pt' ? 'ões' : 's') : ''}
        </Badge>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={className}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-warning/10 to-orange-500/5 border-warning/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-warning/20">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {language === 'pt' ? 'Interações Medicamentosas' : 'Drug Interactions'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {visibleInteractions.length} {language === 'pt' ? 'detectada' : 'detected'}{visibleInteractions.length > 1 ? 's' : ''} · OpenFDA
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="gap-1">
                {expanded ? <><ChevronUp className="h-4 w-4" />{language === 'pt' ? 'Ocultar' : 'Hide'}</> : <><ChevronDown className="h-4 w-4" />{language === 'pt' ? 'Ver' : 'View'}</>}
              </Button>
            </div>
          </CardHeader>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, transformOrigin: "top" }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0 space-y-3">
                  {visibleInteractions.map((interaction) => {
                    const config = getSeverityConfig(interaction.interaction_type);
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={interaction.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={cn("p-3 rounded-xl border", config.color.replace('/15', '/10').replace('/30', '/20'))}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm flex items-center gap-1">
                                  <Pill className="h-3 w-3" />{interaction.drug_a}
                                </span>
                                <span className="text-muted-foreground text-xs">+</span>
                                <span className="font-medium text-sm flex items-center gap-1">
                                  <Pill className="h-3 w-3" />{interaction.drug_b}
                                </span>
                                <Badge variant="outline" className={cn("text-xs", config.color)}>{config.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{interaction.description}</p>
                              {interaction.recommendation && (
                                <p className="text-xs font-medium text-primary">💡 {interaction.recommendation}</p>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleDismiss(interaction.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    ⚠️ {language === 'pt'
                      ? 'Fonte: OpenFDA. Consulte seu médico antes de fazer alterações.'
                      : 'Source: OpenFDA. Consult your doctor before making changes.'}
                  </p>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
