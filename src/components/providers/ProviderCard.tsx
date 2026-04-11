import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    IconProviders, 
    IconEdit, 
    IconTrash, 
    IconStar,
    IconMapPin,
    IconChevronDown as CaretDown,
    IconChevronUp as CaretUp,
    IconExternalLink,
    IconCalendar
} from "@/components/icons/HoramedIcons";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PROVIDER_CATEGORY_LABELS, PROVIDER_CATEGORY_ICONS } from '@/types/healthProvider';
import type { HealthProvider } from '@/types/healthProvider';
import { ProviderContactActions } from './ProviderContactActions';
import { motion, AnimatePresence } from "framer-motion";

interface ProviderCardProps {
  provider: HealthProvider;
  onEdit: (provider: HealthProvider) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
}

const CATEGORY_COLOR: Record<string, { bg: string, text: string, glow: string }> = {
  hospital: { bg: 'bg-rose-500/10', text: 'text-rose-500', glow: 'shadow-rose-500/20' },
  clinic:   { bg: 'bg-emerald-500/10', text: 'text-emerald-500', glow: 'shadow-emerald-500/20' },
  doctor:   { bg: 'bg-blue-500/10', text: 'text-blue-500', glow: 'shadow-blue-500/20' },
  lab:      { bg: 'bg-amber-500/10', text: 'text-amber-500', glow: 'shadow-amber-500/20' },
  pharmacy: { bg: 'bg-green-500/10', text: 'text-green-500', glow: 'shadow-green-500/20' },
  dentist:  { bg: 'bg-cyan-500/10', text: 'text-cyan-500', glow: 'shadow-cyan-500/20' },
  other:    { bg: 'bg-muted/10', text: 'text-muted-foreground', glow: 'shadow-muted/20' },
};

export function ProviderCard({ provider, onEdit, onDelete, onToggleFavorite }: ProviderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const hasContact = provider.phone || provider.whatsapp || provider.bookingUrl || provider.address;
  const colors = CATEGORY_COLOR[provider.category] || CATEGORY_COLOR.other;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group"
    >
      <Card
        className={cn(
          'rounded-3xl border-0 bg-card/40 backdrop-blur-xl transition-all duration-300 overflow-hidden',
          'shadow-glass hover:shadow-glass-hover',
          provider.isFavorite && 'ring-1 ring-amber-500/30 ring-inset',
        )}
      >
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            {/* Icon/Avatar */}
            <div className="relative shrink-0">
              <div className={cn(
                'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-inner-light transition-transform duration-300 group-hover:scale-105',
                colors.bg,
                colors.text
              )}>
                <IconProviders className="h-8 w-8" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-glass bg-background/90 backdrop-blur-md active:scale-90",
                  provider.isFavorite ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400'
                )}
                onClick={() => onToggleFavorite(provider.id, provider.isFavorite)}
              >
                <IconStar className={cn("h-4.5 w-4.5 transition-all", provider.isFavorite && "fill-current scale-110")} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <h4 className="font-bold text-base truncate text-foreground/90">{provider.name}</h4>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md", colors.bg, colors.text)}>
                  {PROVIDER_CATEGORY_LABELS[provider.category] || provider.category}
                </span>
                {provider.specialty && (
                   <span className="text-[10px] font-bold text-muted-foreground/80 bg-muted/10 px-2 py-0.5 rounded-md">
                   {provider.specialty}
                 </span>
                )}
              </div>

              {(provider.address || provider.city) && (
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground/60 font-medium">
                  <IconMapPin className="h-3.5 w-3.5 shrink-0 opacity-40" />
                  <span className="truncate">
                    {provider.city ? `${provider.city}` : provider.address}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions Desktop/Compact */}
            <div className="flex flex-col gap-2 shrink-0">
               <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-xl text-[11px] font-bold border-border/20 shadow-glass bg-white/5 active:scale-95"
                onClick={() => navigate(`/eventos-medicos?providerId=${provider.id}`)}
              >
                Agenda
              </Button>
               <Button
                size="sm"
                className="h-8 px-3 rounded-xl text-[11px] font-bold shadow-glow bg-primary hover:bg-primary/90 text-white active:scale-95"
                onClick={() => navigate(`/eventos-medicos/adicionar?providerId=${provider.id}`)}
              >
                Agendar
              </Button>
            </div>
          </div>

          <div className="flex border-t border-border/10 bg-muted/5 divide-x divide-border/10">
              <Button 
                variant="ghost" 
                className="flex-1 rounded-none h-11 text-[11px] font-bold gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
                onClick={() => onEdit(provider)}
              >
                <IconEdit className="h-4 w-4" />
                Editar
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1 rounded-none h-11 text-[11px] font-bold gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                onClick={() => onDelete(provider.id)}
              >
                <IconTrash className="h-4 w-4" />
                Remover
              </Button>
              {hasContact && (
                <Button 
                    variant="ghost" 
                    className="flex-1 rounded-none h-11 text-[11px] font-bold gap-2 text-muted-foreground hover:bg-muted/10"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? <CaretUp className="h-4 w-4" /> : <CaretDown className="h-4 w-4" />}
                    {expanded ? "Fechar" : "Contato"}
                </Button>
              )}
          </div>

          <AnimatePresence>
            {expanded && hasContact && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden bg-muted/5 border-t border-border/10"
                >
                    <div className="p-4 space-y-3">
                        {provider.notes && (
                            <p className="text-xs text-muted-foreground italic bg-background/30 p-2.5 rounded-xl border border-border/5">
                                "{provider.notes}"
                            </p>
                        )}
                        {/* We reuse the existing contact actions but should probably check if it needs icons update too */}
                        <ProviderContactActions provider={provider} compact />
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
