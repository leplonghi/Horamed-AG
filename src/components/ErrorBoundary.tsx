import { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Always log errors to console (both dev and production)
    console.error("🔴 Error caught by ErrorBoundary:", error);
    console.error("📍 Error message:", error.message);
    console.error("📚 Stack trace:", error.stack);
    console.error("🧩 Component stack:", errorInfo.componentStack);

    // Log environment info
    console.error("🌍 Environment:", {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
    });

    // Log Firebase config status (without exposing keys)
    console.error("🔥 Firebase config status:", {
      hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
    });
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      const errorMessage = this.state.error?.message || "Erro desconhecido";

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Algo deu errado
            </h2>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>

            {/* Show error details in production for debugging */}
            <details className="text-left">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Detalhes do erro (clique para expandir)
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-40">
                {errorMessage}
                {isDev && this.state.error?.stack && (
                  <>
                    {"\n\n"}
                    {this.state.error.stack}
                  </>
                )}
              </pre>
            </details>

            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Recarregar Página
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
