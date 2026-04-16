import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { auth } from "@/integrations/firebase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  
  // Use auth.currentUser as a synchronous fallback during login transition
  // to avoid race conditions returning the user to /auth
  const resolvedUser = user || auth.currentUser;

  if (loading && !resolvedUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return resolvedUser ? <>{children}</> : <Navigate to="/auth" replace />;
}
