import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged, AuthError, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { Capacitor } from "@capacitor/core";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  clearError: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const clearError = () => setError(null);

  useEffect(() => {
    // NOTE: We use signInWithPopup (not signInWithRedirect) for all web/PWA Google auth,
    // so getRedirectResult is not needed here. Popup auth is handled directly in the
    // signInWithGoogle function and onAuthStateChanged captures the result.

    let settled = false;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email ? `User: ${firebaseUser.email}` : 'Signed out');
      setUser(firebaseUser);
      setLoading(false);
      settled = true;
    }, (err) => {
      console.error('🔥 Auth state change error:', err);
      setError(err as AuthError);
      if (!auth.currentUser) {
        setLoading(false);
        settled = true;
      }
    });

    // Safety timeout: force loading=false after 5s if onAuthStateChanged never fires
    const safetyTimeout = setTimeout(() => {
      if (!settled) {
        console.warn('⚠️ Auth check timed out. Proceeding with current state...');
        setLoading(false);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      navigateRef.current("/auth", { replace: true });
    } catch (err: any) {
      console.error('🔥 Sign out error:', err);
      setError(err as AuthError);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, clearError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
