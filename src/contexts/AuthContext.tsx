import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged, getRedirectResult, AuthError, signOut as firebaseSignOut } from "firebase/auth";
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
    // Handle redirect result on web/PWA (after signInWithRedirect returns)
    if (!Capacitor.isNativePlatform()) {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            console.log('🔄 Redirect result: user authenticated', result.user.email);
            setUser(result.user);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('🔥 Redirect result error:', err);
          setError(err as AuthError);
        });
    }

    // Auth monitor with settle bit
    let settled = false;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email ? `User: ${firebaseUser.email}` : 'Signed out');
      
      setUser(firebaseUser);
      setLoading(false);
      settled = true;
    }, (err) => {
      console.error('🔥 Auth state change error:', err);
      setError(err as AuthError);
      
      // If we have a current user even on error, don't set loading false yet
      if (!auth.currentUser) {
        setLoading(false);
        settled = true;
      }
    });

    // Safety timeout: if loading is still true after 3 seconds, force it off
    const safetyTimeout = setTimeout(() => {
      if (!settled) {
        console.warn('⚠️ Auth check timed out. Proceeding with current state...');
        setLoading(false);
        // If we are still loading after 5s, something is wrong. 
        // We'll let the app try to render with whatever it has.
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
