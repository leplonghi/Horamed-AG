import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2 min: dados de medicamentos/doses mudam com frequência
      staleTime: 2 * 60 * 1000,
      // Mantém em cache por 30 min mesmo fora de uso
      gcTime: 30 * 60 * 1000,
      // Não refaz fetch ao focar janela (Firebase usa listeners em tempo real)
      refetchOnWindowFocus: false,
      // CORRIGIDO: recarrega dados após recuperar conexão (evita dados defasados)
      refetchOnReconnect: true,
      // 2 tentativas com backoff exponencial em caso de falha
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
    mutations: {
      retry: 0,
    },
  },
});
