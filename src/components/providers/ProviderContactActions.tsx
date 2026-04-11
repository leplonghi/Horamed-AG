/**
 * ProviderContactActions — Quick action buttons for a health provider
 * Supports: Call, WhatsApp, Book online, Get directions
 */

import { Phone, WhatsappLogo, Globe, MapPin } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import type { HealthProvider } from '@/types/healthProvider';

interface ProviderContactActionsProps {
  provider: HealthProvider;
  compact?: boolean;
}

function buildWhatsAppUrl(number: string, providerName: string): string {
  const clean   = number.replace(/\D/g, '');
  const intl    = clean.startsWith('55') ? clean : `55${clean}`;
  const message = encodeURIComponent(`Olá, gostaria de agendar uma consulta.`);
  return `https://wa.me/${intl}?text=${message}`;
}

function buildMapsUrl(provider: HealthProvider): string {
  if (provider.lat && provider.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${provider.lat},${provider.lng}`;
  }
  const query = encodeURIComponent(`${provider.name} ${provider.address ?? ''}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function ProviderContactActions({ provider, compact = false }: ProviderContactActionsProps) {
  const hasPhone    = Boolean(provider.phone);
  const hasWhatsApp = Boolean(provider.whatsapp || provider.phone);
  const hasBooking  = Boolean(provider.bookingUrl);
  const hasLocation = Boolean(provider.address || (provider.lat && provider.lng));

  const btnSize = compact ? 'sm' : 'sm';
  const btnClass = compact
    ? 'flex-1 text-xs gap-1 h-8'
    : 'flex-1 gap-1.5';

  return (
    <div className="flex gap-1.5 flex-wrap">
      {hasPhone && (
        <Button
          asChild
          variant="outline"
          size={btnSize}
          className={btnClass}
        >
          <a href={`tel:${provider.phone}`} aria-label={`Ligar para ${provider.name}`}>
            <Phone className="h-3.5 w-3.5" weight="fill" />
            {!compact && 'Ligar'}
          </a>
        </Button>
      )}

      {hasWhatsApp && (
        <Button
          asChild
          variant="outline"
          size={btnSize}
          className={`${btnClass} border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/20`}
        >
          <a
            href={buildWhatsAppUrl(provider.whatsapp ?? provider.phone ?? '', provider.name)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp de ${provider.name}`}
          >
            <WhatsappLogo className="h-3.5 w-3.5" weight="fill" />
            {!compact && 'WhatsApp'}
          </a>
        </Button>
      )}

      {hasBooking && (
        <Button
          asChild
          size={btnSize}
          className={`${btnClass} bg-primary text-primary-foreground hover:bg-primary/90`}
        >
          <a
            href={provider.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Agendar consulta em ${provider.name}`}
          >
            <Globe className="h-3.5 w-3.5" />
            {!compact && 'Agendar'}
          </a>
        </Button>
      )}

      {hasLocation && (
        <Button
          asChild
          variant="ghost"
          size={btnSize}
          className={`${btnClass} text-muted-foreground hover:text-foreground`}
        >
          <a
            href={buildMapsUrl(provider)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver rota para ${provider.name}`}
          >
            <MapPin className="h-3.5 w-3.5" weight="fill" />
            {!compact && 'Rota'}
          </a>
        </Button>
      )}
    </div>
  );
}
