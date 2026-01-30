import { useState, useEffect, useCallback } from "react";
import {
  Search, Pill, FileText, Zap, ArrowRight, X, Home,
  LayoutDashboard, Activity, Briefcase, History, User,
  CreditCard, Map, BarChart, Heart, Settings, Sun, Moon,
  LogOut, Plus, Calendar, Image, Shield
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface SearchResult {
  id: string;
  type: "medication" | "document" | "action" | "navigation" | "setting";
  title: string;
  subtitle?: string;
  route?: string;
  action?: () => void;
  keywords?: string[];
}

interface SpotlightSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SpotlightSearch({ open, onOpenChange }: SpotlightSearchProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setTheme } = useTheme();
  const { signOut } = useAuth();
  const { triggerLight, triggerMedium } = useHapticFeedback();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define static actions and navigation items
  const STATIC_COMMANDS: SearchResult[] = [
    // Quick Actions
    { id: "act-add-med", type: "action", title: t('search.addMedication') || "Adicionar Medicamento", route: "/adicionar-medicamento", keywords: ["add", "novo", "remédio"] },
    { id: "act-upload", type: "action", title: t('search.uploadDocument') || "Novo Documento", route: "/carteira/upload", keywords: ["upload", "arquivo", "foto"] },
    { id: "act-consult", type: "action", title: "Nova Consulta", route: "/consultas", keywords: ["agendar", "médico"] },

    // Navigation
    { id: "nav-home", type: "navigation", title: "Início", route: "/", keywords: ["home"] },
    { id: "nav-meds", type: "navigation", title: "Medicamentos", route: "/medicamentos", keywords: ["lista", "remédios"] },
    { id: "nav-routine", type: "navigation", title: "Rotina", route: "/rotina", keywords: ["hoje", "tomar"] },
    { id: "nav-stock", type: "navigation", title: "Estoque", route: "/estoque", keywords: ["quantidade", "sobra"] },
    { id: "nav-history", type: "navigation", title: "Histórico", route: "/historico-medicamentos", keywords: ["passado", "registro"] },
    { id: "nav-dash", type: "navigation", title: "Dashboard de Saúde", route: "/dashboard-saude", keywords: ["resumo", "gráficos"] },
    { id: "nav-wallet", type: "navigation", title: "Carteira Digital", route: "/carteira", keywords: ["documentos", "exames"] },
    { id: "nav-profile", type: "navigation", title: "Perfil", route: "/perfil", keywords: ["conta", "dados"] },

    // Settings & System
    { id: "set-theme-light", type: "setting", title: "Modo Claro", action: () => setTheme("light"), keywords: ["tema", "branco", "dia"] },
    { id: "set-theme-dark", type: "setting", title: "Modo Escuro", action: () => setTheme("dark"), keywords: ["tema", "preto", "noite"] },
    { id: "set-signout", type: "setting", title: "Sair", action: () => signOut(), keywords: ["logout", "deslogar"] },
  ];

  const search = useCallback(async (searchQuery: string) => {
    // If empty, show some suggested "recent" or "popular" options (static for now)
    if (!searchQuery.trim()) {
      setResults(STATIC_COMMANDS.slice(0, 5)); // Show first 5 static commands as default
      return;
    }

    setIsLoading(true);
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    try {
      // 1. Filter Static Commands (Client-side)
      const matchingStatic = STATIC_COMMANDS.filter(cmd =>
        cmd.title.toLowerCase().includes(normalizedQuery) ||
        cmd.subtitle?.toLowerCase().includes(normalizedQuery) ||
        cmd.keywords?.some(k => k.includes(normalizedQuery))
      );
      searchResults.push(...matchingStatic);

      // 2. Search Medications (Supabase)
      const { data: items } = await supabase
        .from("items")
        .select("id, name, dose_text")
        .ilike("name", `%${normalizedQuery}%`)
        .limit(3);

      items?.forEach(item => {
        searchResults.push({
          id: `med-${item.id}`,
          type: "medication",
          title: item.name,
          subtitle: item.dose_text || "Medicamento",
          route: `/medicamentos?edit=${item.id}`, // Or a specific detail route if available
        });
      });

      // 3. Search Documents (Supabase)
      const { data: docs } = await supabase
        .from("documentos_saude")
        .select("id, title")
        .ilike("title", `%${normalizedQuery}%`)
        .limit(3);

      docs?.forEach(doc => {
        searchResults.push({
          id: `doc-${doc.id}`,
          type: "document",
          title: doc.title || "Documento",
          subtitle: "Carteira Digital",
          route: `/carteira/${doc.id}`,
        });
      });

      setResults(searchResults.slice(0, 10)); // Limit total results
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
      setSelectedIndex(0);
    }
  }, [t, setTheme, signOut]);

  useEffect(() => {
    if (open) {
      triggerLight();
      setQuery("");
      setResults(STATIC_COMMANDS.slice(0, 5));
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const debounce = setTimeout(() => search(query), 200);
    return () => clearTimeout(debounce);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    triggerMedium();
    onOpenChange(false);
    if (result.action) {
      result.action();
    } else if (result.route) {
      navigate(result.route);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      triggerLight();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      triggerLight();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "medication": return Pill;
      case "document": return FileText;
      case "action": return Zap;
      case "navigation": return ArrowRight; // Dynamic icon based on specific item would be better but keeping simple
      case "setting": return Settings;
    }
  };

  // Helper to get specific icons for known static IDs to make it prettier
  const getSpecificIcon = (result: SearchResult) => {
    if (result.type === 'medication') return Pill;
    if (result.type === 'document') return FileText;

    switch (result.id) {
      case 'act-add-med': return Plus;
      case 'act-upload': return FileText;
      case 'act-consult': return Calendar;
      case 'nav-home': return Home;
      case 'nav-meds': return Pill;
      case 'nav-routine': return Activity;
      case 'nav-stock': return Briefcase; // or Package
      case 'nav-history': return History;
      case 'nav-dash': return LayoutDashboard;
      case 'nav-wallet': return Shield;
      case 'nav-profile': return User;
      case 'set-theme-light': return Sun;
      case 'set-theme-dark': return Moon;
      case 'set-signout': return LogOut;
      default: return getIcon(result.type);
    }
  };

  const getIconColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "medication": return "text-primary bg-primary/10";
      case "document": return "text-blue-500 bg-blue-500/10";
      case "action": return "text-amber-500 bg-amber-500/10";
      case "navigation": return "text-slate-500 bg-slate-500/10";
      case "setting": return "text-purple-500 bg-purple-500/10";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogTitle asChild>
          <VisuallyHidden>Busca Global</VisuallyHidden>
        </DialogTitle>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border/50">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder') || "O que você procura?"}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base py-6 placeholder:text-muted-foreground/50"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 hover:bg-muted/50 rounded-full"
              onClick={() => setQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Buscando...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhum resultado encontrado</p>
              <p className="text-sm opacity-60 mt-1">Tente buscar por "remédio", "consulta" ou "configurações"</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {results.map((result, index) => {
                const Icon = getSpecificIcon(result);
                const iconColor = getIconColor(result.type);

                return (
                  <motion.button
                    key={result.id}
                    layoutId={result.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group",
                      index === selectedIndex
                        ? "bg-primary/10 text-foreground shadow-sm"
                        : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", iconColor)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium truncate transition-colors", index === selectedIndex ? "text-primary" : "text-foreground")}>
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground/80 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <ArrowRight className="w-4 h-4 text-primary shrink-0 animate-in slide-in-from-left-2 fade-in duration-200" />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border/50 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-background border border-border shadow-sm min-w-[20px] text-center font-sans normal-case">↑↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-background border border-border shadow-sm min-w-[20px] text-center font-sans normal-case">↵</kbd>
              Selecionar
            </span>
          </div>
          <div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-background border border-border shadow-sm min-w-[20px] text-center font-sans normal-case">Esc</kbd>
              Fechar
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
