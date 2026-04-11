/**
 * MyProviders — Personal health providers management page.
 *
 * Features:
 *  - Search by text (OSM/Nominatim) or locate nearby (Overpass)
 *  - Filter by category
 *  - Favorites at the top
 *  - Quick actions: call, WhatsApp, booking, directions
 *
 * Data is 100% private — only the authenticated user can access their providers.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  MagnifyingGlass,
  Funnel,
  MapPin,
  Spinner,
  SmileySad,
  Buildings,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import Header from '@/components/Header';
import Navigation from '@/components/Navigation';

import { useProviders } from '@/hooks/useProviders';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { ProviderFormModal } from '@/components/providers/ProviderFormModal';

import {
  PROVIDER_CATEGORY_LABELS,
  type HealthProvider,
  type ProviderCategory,
} from '@/types/healthProvider';
import { ProviderCategoryIcon } from '@/components/providers/ProviderCategoryIcon';

const ALL_CATEGORIES: ProviderCategory[] = [
  'doctor', 'clinic', 'hospital', 'lab', 'pharmacy', 'dentist', 'other',
];

export default function MyProviders() {
  const { providers, loading, error, add, update, remove, toggleFavorite } = useProviders();

  // Local UI state
  const [localSearch, setLocalSearch]   = useState('');
  const [activeFilter, setActiveFilter] = useState<ProviderCategory | 'all'>('all');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState<HealthProvider | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  // Filter + search providers
  const filtered = useMemo(() => {
    let list = [...providers];

    if (activeFilter !== 'all') {
      list = list.filter(p => p.category === activeFilter);
    }

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.specialty?.toLowerCase().includes(q) ||
        p.doctorName?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q),
      );
    }

    // Favorites first
    return list.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [providers, activeFilter, localSearch]);

  // Delete with optimistic UI
  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    const ok = await remove(id);
    setDeletingId(null);
    if (ok) {
      toast.success('Provedor removido.');
    } else {
      toast.error('Erro ao remover. Tente novamente.');
    }
  }, [remove]);

  const handleEdit = (provider: HealthProvider) => {
    setEditing(provider);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleCreate = async (data: Parameters<typeof add>[0]) => {
    const id = await add(data);
    if (id) {
      toast.success('Provedor adicionado!');
    } else {
      throw new Error('failed');
    }
  };

  const handleUpdate = async (id: string, data: Partial<HealthProvider>) => {
    const ok = await update(id, data);
    if (ok) {
      toast.success('Provedor atualizado!');
    } else {
      throw new Error('failed');
    }
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    await toggleFavorite(id);
    toast.success(current ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!');
  };

  // Category filter pills
  const usedCategories = useMemo(
    () => ALL_CATEGORIES.filter(c => providers.some(p => p.category === c)),
    [providers],
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 pb-24 pt-2">
        {/* Page hero */}
        <div className="px-4 mb-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Meus Provedores</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {providers.length === 0
                  ? 'Nenhum provedor salvo ainda'
                  : `${providers.length} local${providers.length > 1 ? 'is' : ''} salvo${providers.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <Button
              id="add-provider-btn"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => { setEditing(null); setModalOpen(true); }}
            >
              <Plus size={15} weight="bold" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Local search + filter */}
        {providers.length > 0 && (
          <div className="px-4 mb-3 space-y-2">
            <div className="relative">
              <MagnifyingGlass
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="providers-local-search"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Filtrar por nome, especialidade ou cidade..."
                className="pl-8 h-9 text-sm"
                aria-label="Filtrar provedores salvos"
              />
            </div>

            {/* Category pills */}
            {usedCategories.length > 1 && (
              <div
                className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
                role="group"
                aria-label="Filtrar por categoria"
              >
                <button
                  className={cn(
                    'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    activeFilter === 'all'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent border-border text-muted-foreground hover:bg-muted',
                  )}
                  onClick={() => setActiveFilter('all')}
                >
                  Todos
                </button>

                {usedCategories.map(cat => (
                  <button
                    key={cat}
                    className={cn(
                      'shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      activeFilter === cat
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent border-border text-muted-foreground hover:bg-muted',
                    )}
                    onClick={() => setActiveFilter(cat)}
                  >
                    <ProviderCategoryIcon category={cat} size={11} weight="bold" />
                    {PROVIDER_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-4">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Spinner size={20} className="animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-destructive gap-2">
              <SmileySad size={36} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && providers.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <Buildings size={32} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-base">Nenhum provedor salvo</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Adicione suas clínicas, médicos e hospitais para ter acesso rápido a contatos e agendamentos.
                </p>
              </div>
              <Button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="gap-2"
              >
                <Plus size={16} weight="bold" />
                Adicionar primeiro provedor
              </Button>
            </div>
          )}

          {/* No results after filter */}
          {!loading && !error && providers.length > 0 && filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Nenhum provedor encontrado para "{localSearch || PROVIDER_CATEGORY_LABELS[activeFilter as ProviderCategory]}".
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-1"
                onClick={() => { setLocalSearch(''); setActiveFilter('all'); }}
              >
                Limpar filtros
              </Button>
            </div>
          )}

          {/* Provider list */}
          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Form modal */}
      <ProviderFormModal
        open={modalOpen}
        onClose={handleModalClose}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        editing={editing}
      />

      <Navigation />
    </div>
  );
}
