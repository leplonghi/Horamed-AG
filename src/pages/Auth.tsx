import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Fingerprint, Shield, ArrowLeft, Users, Bell, Eye, EyeSlash as EyeOff, Clock, Sun, GoogleLogo } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useAuth } from "@/contexts/AuthContext";
import { signIn, signUp, signInWithGoogle, signOut } from "@/integrations/firebase";
import { processReferralOnSignup } from "@/lib/referrals";
import { APP_DOMAIN } from "@/lib/domainConfig";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo_HoraMed.png";
import authBackground from "@/assets/auth-background.png";
const features = [{
  icon: Bell,
  text: "Lembretes",
  color: "from-blue-500 to-cyan-400"
}, {
  icon: Users,
  text: "Família",
  color: "from-emerald-500 to-teal-400"
}, {
  icon: Shield,
  text: "Seguro",
  color: "from-emerald-500 to-teal-400"
}];
export default function Auth() {
  const navigate = useNavigate();
  const {
    user,
    error: authError
  } = useAuth();
  const {
    t
  } = useLanguage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authError) {
      console.error('Auth error detected in Auth page:', authError);
      if (authError.message?.includes('missing-initial-state') || authError.message?.includes('internal-error')) {
        toast.error("Erro de sessão: Seu navegador pode estar bloqueando cookies de terceiros. Tente usar o login por e-mail ou desativar o bloqueio de rastreamento.");
      }
    }
  }, [authError]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isFirstVisit] = useState(() => !localStorage.getItem('horamed_has_visited'));
  const {
    isAvailable,
    isLoading: biometricLoading,
    loginWithBiometric,
    isBiometricEnabled,
    setupBiometricLogin
  } = useBiometricAuth();
  const {
    fingerprint
  } = useDeviceFingerprint();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, []);

  useEffect(() => {
    if (user && !loading) {
      // Small delay to check if we are already on the welcome flow (navigate might be in progress)
      // This is a safety check.
      const isWelcomePath = window.location.pathname === '/onboarding';
      if (!isWelcomePath) {
        navigate("/");
      }
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setLoading(true);
      const { user: firebaseUser, isNewUser, error } = await signInWithGoogle({
        prompt: 'select_account'
      });
      if (error) throw error;

      // On mobile web, signInWithRedirect returns null user — page will reload.
      // AuthContext.onAuthStateChanged will handle navigation after redirect.
      if (!firebaseUser) {
        // Don't reset setLoading here — the browser is about to redirect away.
        return;
      }

      if (isNewUser) {
        navigate("/onboarding");
        return;
      }

      if (referralCode) {
        try {
          await processReferralOnSignup(firebaseUser.uid, referralCode);
        } catch (refError) {
          console.error('Error processing referral:', refError);
        }
      }

      // Existing user via popup — navigate explicitly (useEffect is blocked by loading=true)
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || t('auth.googleError'));
      setLoading(false);
    }
  }, [t, referralCode, navigate]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.fillAllFields'));
      return;
    }
    if (!acceptedTerms) {
      toast.error(t('auth.acceptTerms'));
      return;
    }
    if (password.length < 8) {
      toast.error(t('auth.passwordMin'));
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error(t('auth.passwordUppercase'));
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error(t('auth.passwordLowercase'));
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error(t('auth.passwordNumber'));
      return;
    }
    try {
      setLoading(true);
      const {
        user: firebaseUser,
        error
      } = await signUp(email, password);

      if (error) throw error;

      if (firebaseUser && referralCode) {
        try {
          await processReferralOnSignup(firebaseUser.uid, referralCode);
        } catch (refError) {
          console.error('Error processing referral:', refError);
        }
      }

      if (firebaseUser) {
        toast.success(t('auth.accountCreated'));
        localStorage.setItem('horamed_has_visited', 'true');
        navigate("/onboarding");
        return;
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.signupError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Initiating email sign in for:', email);
    
    if (!email || !password) {
      console.warn('⚠️ Missing email or password');
      toast.error(t('auth.fillAllFields'));
      return;
    }
    try {
      setLoading(true);
      const {
        user: firebaseUser,
        error
      } = await signIn(email, password);

      if (error) throw error;

      console.log('✅ Auth success, waiting for context redirect...');
      toast.success(t('auth.loginSuccess'));
      localStorage.setItem('horamed_has_visited', 'true');
      
      // Clear persistence issues if any
      sessionStorage.removeItem("horamed_splash_shown");
      
      if (isAvailable && !isBiometricEnabled) {
        setTimeout(() => {
          if (window.confirm(t('auth.enableBiometric'))) {
            setupBiometricLogin(email, password);
          }
        }, 1000);
      }
      navigate("/");
    } catch (error: any) {
      console.error('🔥 Auth page handleEmailSignIn error:', error);
      
      let errorMessage = error.message || t('auth.loginError');
      
      // Friendly messages for common Firebase errors
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMessage = t('auth.invalidCredentials') || 'Email ou senha incorretos.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Esta conta foi desativada.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está sendo usado.';
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        id: 'auth-error' // Previne duplicatas
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
    {/* Left Panel - Branding (hidden on mobile/tablet, only on desktop) */}
    <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.6
    }} className="hidden lg:flex relative lg:w-1/2 p-12 flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      <Link to="/" className="relative z-10 inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group w-fit">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">{t('common.back')}</span>
      </Link>

      <div className="relative z-10 flex flex-col items-center text-center justify-center flex-1">
        <motion.div className="flex flex-col items-center justify-center mb-8" initial={{
          y: 20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.2
        }}>
          <img alt="HoraMed" className="h-48 w-auto drop-shadow-2xl" src={logo} />
        </motion.div>

        <motion.h1 className="text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight" initial={{
          y: 20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.3
        }}>
          Sua saúde,<br />
          <span className="bg-gradient-to-r from-cyan-300 via-primary to-emerald-300 bg-clip-text text-transparent drop-shadow-sm">organizada.</span>
        </motion.h1>

        <motion.p className="text-white/80 text-xl max-w-sm leading-relaxed" initial={{
          y: 20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.4
        }}>
          A plataforma completa para gerenciar sua rotina de saúde com inteligência e cuidado.
        </motion.p>
      </div>

      {/* Features */}
      <motion.div className="relative z-10 flex flex-wrap justify-center gap-4 mt-auto pt-8" initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.5
      }}>
        {features.map((feature, i) => <motion.div key={feature.text} className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-lg" initial={{
          scale: 0.8,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          delay: 0.6 + i * 0.1
        }}>
          <div className={cn("p-1.5 rounded-full bg-gradient-to-br", feature.color)}>
            <feature.icon className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm text-white/90 font-semibold">{feature.text}</span>
        </motion.div>)}
      </motion.div>
    </motion.div>

    {/* Right Panel - Form (with gradient on mobile) */}
    <div className="flex-1 flex flex-col justify-center relative overflow-hidden">
      {/* Mobile gradient background - blue at bottom, white at top */}
      <div className="absolute inset-0 lg:hidden bg-gradient-to-t from-primary/20 via-primary/5 to-white">
        <motion.div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }} transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
        <motion.div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl" animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }} transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
      </div>

      <motion.div className="relative z-10 w-full max-w-md mx-auto p-4 sm:p-6 lg:p-12" initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.5,
        delay: 0.2
      }}>
        {/* Mobile Header with Logo */}
        <div className="lg:hidden flex flex-col items-center justify-center mb-8">
          <motion.div initial={{
            scale: 0.8,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} transition={{
            delay: 0.1
          }}>
            <img alt="HoraMed" className="h-20 w-auto" src={logo} />
          </motion.div>
        </div>

        {/* Header */}
        <div className="text-center lg:text-left mb-4 sm:mb-6">
          <motion.div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 backdrop-blur-sm rounded-full mb-3" initial={{
            scale: 0.9,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} transition={{
            delay: 0.3
          }}>
            <Sun className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-primary">7 dias grátis Premium</span>
          </motion.div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
            {!isLogin ? "Crie sua conta" : isFirstVisit ? "Bem-vindo ao HoraMed!" : "Bem-vindo de volta!"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {!isLogin ? "Comece a organizar seus medicamentos hoje" : isFirstVisit ? "Crie sua conta ou entre para começar" : "Entre para continuar cuidando da sua saúde"}
          </p>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-3">
          {/* Google */}
          <Button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full h-11 bg-white hover:bg-gray-50 text-foreground border border-border shadow-sm transition-all hover:shadow-md rounded-xl font-medium text-sm">
            <GoogleLogo className="w-4 h-4 mr-2 text-[#4285F4]" weight="bold" />
            Continuar com Google
          </Button>

          {/* Biometric */}
          {isAvailable && isBiometricEnabled && isLogin && <Button type="button" onClick={async () => {
            const result = await loginWithBiometric();
            if (result && typeof result === 'object' && 'email' in result) {
              setEmail(result.email);
              toast.info(t('auth.biometricConfirmed'));
            }
          }} disabled={biometricLoading} variant="outline" className="w-full h-11 rounded-xl font-medium text-sm bg-white/50 backdrop-blur-sm">
            <Fingerprint className="h-4 w-4 mr-2" />
            {biometricLoading ? "Autenticando..." : "Entrar com biometria"}
          </Button>}

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background/80 backdrop-blur-sm px-3 text-xs text-muted-foreground">ou com e-mail</span>
            </div>
          </div>

          {/* Email Form */}
          <form 
            onSubmit={(e) => {
              console.log('📝 Form submit triggered! isLogin:', isLogin, 'Email:', email);
              if (isLogin) handleEmailSignIn(e);
              else handleEmailSignUp(e);
            }} 
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 rounded-xl bg-white/70 backdrop-blur-sm border-border/50 focus:border-primary transition-colors" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                {/* TODO: Implementar página de recuperação de senha
                {isLogin && <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Esqueceu?
                </Link>}
                */}
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 rounded-xl bg-white/70 backdrop-blur-sm border-border/50 focus:border-primary transition-colors pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!isLogin && <p className="text-[10px] text-muted-foreground">
                Mín. 8 caracteres, maiúscula, minúscula e número
              </p>}
            </div>

            <AnimatePresence>
              {!isLogin && <motion.div initial={{
                opacity: 0,
                scale: 0.95
              }} animate={{
                opacity: 1,
                scale: 1
              }} exit={{
                opacity: 0,
                scale: 0.95
              }} className="flex items-start gap-2 pt-1">
                <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={checked => setAcceptedTerms(checked as boolean)} className="mt-0.5" />
                <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                  Aceito os{" "}
                  <Link to="/termos" className="text-primary hover:underline">Termos</Link>
                  {" "}e{" "}
                  <Link to="/privacidade" className="text-primary hover:underline">Privacidade</Link>
                </Label>
              </motion.div>}
            </AnimatePresence>

            <Button 
              type="submit" 
              disabled={loading} 
              onClick={() => console.log('🔘 Submit Button clicked! Current state:', { loading, isLogin, acceptedTerms, email: !!email, pass: !!password })}
              className="w-full h-11 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              {loading ? <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Aguarde...</span>
              </div> : isLogin ? "Entrar" : "Criar conta grátis"}
            </Button>
          </form>

          {/* Toggle Login/Signup */}
          <p className="text-center text-xs text-muted-foreground pt-3">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? "Criar" : "Entrar"}
            </button>
          </p>
        </div>

        {/* Trust badges - hidden on very small screens */}
        <motion.div className="hidden sm:flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/30" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.6
        }}>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span className="text-[10px]">Criptografado</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-[10px]">30s cadastro</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </div>;
}