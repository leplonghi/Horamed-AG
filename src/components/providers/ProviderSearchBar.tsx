import { useState, useCallback, useRef } from 'react';
import { 
    IconSearch, 
    IconLoading, 
    IconClose, 
    IconMapPin 
} from "@/components/icons/HoramedIcons";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { searchByText } from '@/services/osmPlacesService';
import type { OsmSearchResult } from '@/types/healthProvider';
import { PROVIDER_CATEGORY_LABELS } from '@/types/healthProvider';
import { ProviderCategoryIcon } from './ProviderCategoryIcon';

interface ProviderSearchBarProps {
  onSelect: (result: OsmSearchResult) => void;
  className?: string;
}

const DEBOUNCE_MS = 700; // OSM usage policy: 1 req/s

export function ProviderSearchBar({ onSelect, className }: ProviderSearchBarProps) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<OsmSearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const timerRef                = useRef<ReturnType<typeof setTimeout>>();
  const containerRef            = useRef<HTMLDivElement>(null);

  const search = useCallback(async (text: string) => {
    if (text.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchByText(text);
      setResults(data);
      setOpen(data.length > 0);
      if (data.length === 0) setError('Nenhum local encontrado. Tente outro termo.');
    } catch {
      setError('Erro ao buscar. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), DEBOUNCE_MS);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    setError(null);
  };

  const handleSelect = (result: OsmSearchResult) => {
    onSelect(result);
    setQuery(result.name);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative flex items-center group">
        <div className="absolute left-4 z-10">
            {loading ? (
            <IconLoading className="h-4 w-4 text-primary animate-spin" />
            ) : (
            <IconSearch className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            )}
        </div>
        <Input
          value={query}
          onChange={handleChange}
          placeholder="Buscar clínica, hospital, médico..."
          className="pl-11 pr-10 h-12 rounded-2xl bg-muted/40 border-border/10 focus-visible:ring-primary/20 focus-visible:bg-muted/60 transition-all text-sm font-medium"
          autoComplete="off"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 h-8 w-8 rounded-xl hover:bg-muted"
            onClick={handleClear}
          >
            <IconClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {query.length > 0 && (
        <p className="text-[10px] text-muted-foreground/50 mt-1.5 ml-4 font-bold uppercase tracking-widest leading-none">
          © OpenStreetMap contributors
        </p>
      )}

      {open && results.length > 0 && (
        <ul
          className={cn(
            'absolute z-50 mt-3 w-full rounded-2xl border border-border/10 bg-background/95 backdrop-blur-3xl shadow-2xl',
            'max-h-72 overflow-y-auto py-2 p-1',
            'animate-in fade-in-0 zoom-in-95 duration-200',
          )}
        >
          {results.map(r => (
            <li key={r.osmId}>
              <button
                className="w-full flex items-start gap-3.5 px-3 py-2.5 rounded-xl hover:bg-primary/5 active:bg-primary/10 transition-colors text-left group"
                onClick={() => handleSelect(r)}
              >
                <div className="mt-1 shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <ProviderCategoryIcon category={r.category} size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight truncate group-hover:text-primary transition-colors">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground/70 truncate flex items-center gap-1.5 mt-1 font-medium">
                    <IconMapPin size={10} className="shrink-0" />
                    {r.city ? `${r.city}${r.state ? ', ' + r.state : ''}` : r.address ?? ''}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && !open && query.length >= 3 && (
        <div className="p-3 mt-2 rounded-xl bg-destructive/5 text-destructive text-[11px] font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <IconProviders className="h-3 w-3" />
            {error}
        </div>
      )}
    </div>
  );
}
