import { useState, useEffect, useRef } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo_HoraMed.png";
import heroBg from "@/assets/landing-hero-bg.jpg";
import appMockupGen from "@/assets/landing-app-mockup-gen.png";
import elderlyCare from "@/assets/landing-elderly-care.png";
import familyHealth from "@/assets/landing-family-health.png";
import appMockup from "@/assets/horamed-app-mockup.png";
import {
  Bell, FileText, Users, Shield, Brain, Smartphone,
  Star, Check, ArrowRight, Camera, MessageCircle,
  HeartPulse, Trophy, Zap, Pill, ChevronDown,
  ClipboardList, Lock, Clock, Stethoscope, Activity,
  CalendarCheck, Sparkles, Heart
} from "lucide-react";
import { getAuthRedirectUrl } from "@/lib/domainConfig";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { PRICING, BRL_COUNTRIES } from "@/lib/stripeConfig";

/* ─── Animated Counter ──────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Parallax floating card ──────────────────────────────────── */
function FloatCard({ children, delay = 0, className = "", style = {} }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={{ animation: `float ${3 + delay}s ease-in-out infinite`, ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Section reveal ────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
const Landing = () => {
  const authUrl = getAuthRedirectUrl();
  const { t, language, country } = useLanguage();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const isBrazil = BRL_COUNTRIES.includes(country.code);
  const pricing = isBrazil ? PRICING.brl : PRICING.usd;
  const priceDisplay = `${pricing.symbol}${pricing.monthly.toFixed(2)}`;
  const priceLabel = language === "pt" ? "/mês" : "/month";
  const isPt = language === "pt";

  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 80], ["rgba(5,10,25,0)", "rgba(5,10,25,0.92)"]);
  const heroPara = useTransform(scrollY, [0, 600], ["0%", "30%"]);

  /* Mouse parallax for hero */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  const testimonials = isPt ? [
    { name: "Lucas M.", role: "Usa para si mesmo", avatar: "L", content: "Tomo 3 medicamentos diários para tireoide e pressão. Antes esquecia direto — às vezes dias seguidos. Com o HoraMed, minha adesão chegou a 100%. É literalmente transformador.", rating: 5 },
    { name: "Maria Helena", role: "Cuida dos pais idosos", avatar: "M", content: "Minha mãe tem 78 anos e toma 6 medicamentos com horários diferentes. Agora tenho paz de saber que ela está cuidada. Não preciso mais ligar 3 vezes por dia para lembrar.", rating: 5 },
    { name: "Roberto S.", role: "Paciente cardíaco", avatar: "R", content: "Depois do infarto, perder uma dose pode custar a vida. O HoraMed me dá essa segurança todo dia. É como ter um enfermeiro 24h no bolso.", rating: 5 },
    { name: "Dra. Fernanda", role: "Cardiologista", avatar: "F", content: "Recomendo para todos os meus pacientes. A adesão ao tratamento melhora visivelmente. Já vi casos em que o HoraMed evitou internações.", rating: 5 },
  ] : [
    { name: "Lucas M.", role: "Uses for himself", avatar: "L", content: "I take 3 daily medications for thyroid and blood pressure. I used to forget constantly. With HoraMed, my adherence reached 100%. It's literally life-changing.", rating: 5 },
    { name: "Mary H.", role: "Cares for elderly parents", avatar: "M", content: "My mom is 78 and takes 6 medications at different times. Now I have peace of mind knowing she's taken care of, without calling 3 times a day.", rating: 5 },
    { name: "Robert S.", role: "Heart patient", avatar: "R", content: "After my heart attack, missing a dose can cost your life. HoraMed gives me that security every day. It's like having a nurse 24/7 in my pocket.", rating: 5 },
    { name: "Dr. Fernanda", role: "Cardiologist", avatar: "F", content: "I recommend it to all my patients. Medication adherence improves visibly. I've seen cases where HoraMed prevented hospitalizations.", rating: 5 },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const features = [
    { icon: Bell, title: isPt ? "Lembretes que chegam na hora" : "Reminders that arrive on time", desc: isPt ? "Notificações precisas. Push, som ou vibração — você decide." : "Precise notifications. Push, sound or vibration — you decide." },
    { icon: Users, title: isPt ? "Toda a família protegida" : "The whole family protected", desc: isPt ? "Até 5 perfis. Gerencie pais, filhos e cônjuge num só app." : "Up to 5 profiles. Manage parents, children and spouse in one app." },
    { icon: Brain, title: isPt ? "Clara — sua IA de saúde" : "Clara — your health AI", desc: isPt ? "Tira dúvidas, explica bulas e organiza sua saúde com IA." : "Answers questions, explains prescriptions and organizes your health with AI." },
    { icon: Camera, title: isPt ? "Scan de receita em segundos" : "Prescription scan in seconds", desc: isPt ? "Fotografe a receita. A IA extrai o medicamento e a dose." : "Photograph the prescription. AI extracts the drug and dosage." },
    { icon: FileText, title: isPt ? "Carteira de Saúde digital" : "Digital Health Wallet", desc: isPt ? "Exames, vacinas e receitas guardados com segurança." : "Exams, vaccines and prescriptions stored securely." },
    { icon: Activity, title: isPt ? "Dashboard de adesão" : "Adherence dashboard", desc: isPt ? "Veja sua evolução, sequências e histórico completo." : "See your progress, streaks and complete history." },
    { icon: Shield, title: isPt ? "Alerta de interações" : "Drug interaction alerts", desc: isPt ? "Combinações perigosas detectadas automaticamente." : "Dangerous combinations detected automatically." },
    { icon: CalendarCheck, title: isPt ? "Modo viagem" : "Travel mode", desc: isPt ? "Ajuste horários por fuso automaticamente ao viajar." : "Automatically adjust schedules by timezone when traveling." },
  ];

  const freeFeatures = isPt
    ? ["1 medicamento", "Lembretes básicos", "1 perfil", "Histórico limitado"]
    : ["1 medication", "Basic reminders", "1 profile", "Limited history"];

  const premiumFeatures = isPt
    ? ["Medicamentos ilimitados", "Lembretes inteligentes", "Até 5 perfis familiares", "Histórico completo", "Assistente IA Clara", "Scan de receitas", "Carteira de Saúde", "Verificação de interações", "Dashboard completo", "Modo viagem", "Gamificação", "Suporte prioritário"]
    : ["Unlimited medications", "Smart reminders", "Up to 5 family profiles", "Full history", "AI assistant Clara", "Prescription scanner", "Health Wallet", "Drug interactions check", "Complete dashboard", "Travel mode", "Gamification", "Priority support"];

  const stats = [
    { value: 50000, suffix: "+", label: isPt ? "doses lembradas todo mês" : "doses remembered monthly" },
    { value: 5000, suffix: "+", label: isPt ? "famílias com saúde organizada" : "families with organized health" },
    { value: 98, suffix: "%", label: isPt ? "de adesão média dos usuários" : "average user adherence" },
    { value: 4.9, suffix: "★", label: isPt ? "avaliação na App Store" : "App Store rating" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#060c1a" }}>
      <SEOHead
        title={isPt ? "HoraMed — O Guardião da Sua Saúde" : "HoraMed — The Guardian of Your Health"}
        description={isPt
          ? "Pare de arriscar sua saúde esquecendo medicamentos. HoraMed é o assistente inteligente que cuida de você e da sua família — 24 horas por dia, todos os dias."
          : "Stop risking your health by forgetting medications. HoraMed is the intelligent assistant that takes care of you and your family — 24 hours a day, every day."}
      />

      {/* ── HEADER ──────────────────────────────────────────── */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{ backgroundColor: headerBg, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between max-w-7xl">
          {/* Logo proeminente */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="HoraMed"
              className="h-10 w-auto drop-shadow-lg"
              style={{ filter: "brightness(1.15) drop-shadow(0 0 8px rgba(56,189,248,0.4))" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => window.location.href = authUrl}
            >
              {isPt ? "Entrar" : "Login"}
            </Button>
            <button
              onClick={() => window.location.href = authUrl}
              className="h-9 px-5 text-sm font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)", boxShadow: "0 4px 20px rgba(37,99,235,0.5)" }}
            >
              {isPt ? "Começar Grátis" : "Start Free"}
            </button>
          </div>
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════
          HERO — Full bleed cinematic background
      ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Background: imagem cinematográfica com parallax */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: heroPara }}
        >
          <img
            src={heroBg}
            alt="HoraMed background"
            className="w-full h-full object-cover"
            style={{ transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px) scale(1.06)`, transition: "transform 0.08s linear" }}
          />
          {/* Overlay gradiente multicamada */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(6,12,26,0.55) 0%, rgba(6,12,26,0.35) 40%, rgba(6,12,26,0.80) 80%, rgba(6,12,26,1) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(37,99,235,0.18) 0%, transparent 60%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 30%, rgba(14,165,233,0.12) 0%, transparent 50%)" }} />
        </motion.div>

        {/* Partículas/brilhos animados */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + (i % 4)}px`,
                height: `${2 + (i % 4)}px`,
                background: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#818cf8" : "#34d399",
                left: `${(i * 19 + 5) % 95}%`,
                top: `${(i * 13 + 8) % 90}%`,
                opacity: 0.35 + (i % 5) * 0.1,
              }}
              animate={{ y: [-10, 10, -10], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-24 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* ── COLUNA ESQUERDA: Copy ── */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
                style={{ background: "rgba(37,99,235,0.18)", border: "1px solid rgba(56,189,248,0.3)", color: "#7dd3fc" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isPt ? "7 dias Premium grátis · Sem cartão de crédito" : "7 days Premium free · No credit card"}
              </motion.div>

              {/* H1 — Audacioso, emocional */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.06] mb-6 text-white">
                  {isPt ? (
                    <>
                      O guardião{" "}
                      <span style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        invisível
                      </span>
                      {" "}da sua{" "}
                      <span style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        saúde.
                      </span>
                    </>
                  ) : (
                    <>
                      The{" "}
                      <span style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        invisible
                      </span>
                      {" "}guardian of your{" "}
                      <span style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        health.
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-lg sm:text-xl font-medium leading-relaxed mb-8" style={{ color: "rgba(203,213,225,0.85)" }}>
                  {isPt
                    ? "Cada dose conta. HoraMed garante que você e todos que você ama nunca percam um medicamento — com inteligência, cuidado e zero esforço."
                    : "Every dose counts. HoraMed ensures you and everyone you love never miss a medication — with intelligence, care and zero effort."}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => window.location.href = authUrl}
                    className="group relative h-14 px-8 text-base font-bold text-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl active:scale-[0.97] w-full sm:w-auto"
                    style={{ background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", boxShadow: "0 8px 32px rgba(37,99,235,0.5), 0 0 0 1px rgba(56,189,248,0.2)" }}
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      {isPt ? "Proteja sua saúde agora" : "Protect your health now"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                  <button
                    onClick={() => window.location.href = authUrl}
                    className="h-14 px-8 text-base font-medium rounded-2xl border transition-all duration-300 hover:bg-white/10 w-full sm:w-auto"
                    style={{ color: "rgba(148,163,184,1)", borderColor: "rgba(148,163,184,0.25)" }}
                  >
                    {isPt ? "Já tenho conta" : "I already have an account"}
                  </button>
                </div>

                {/* Social proof under CTAs */}
                <div className="flex items-center gap-3 mt-6 justify-center lg:justify-start">
                  <div className="flex -space-x-2">
                    {["#3b82f6", "#10b981", "#f59e0b", "#ec4899"].map((c, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-[#060c1a] flex items-center justify-center text-white text-xs font-bold" style={{ background: c }}>
                        {["L", "M", "R", "F"][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map(i => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-xs" style={{ color: "rgba(148,163,184,0.8)" }}>
                      {isPt ? "5.000+ famílias protegidas" : "5,000+ families protected"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── COLUNA DIREITA: Mockup do App ── */}
            <div className="relative flex items-center justify-center lg:justify-end">
              {/* Glow atrás do mockup */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(37,99,235,0.25) 0%, transparent 70%)", filter: "blur(40px)" }} />

              {/* Mockup principal */}
              <motion.div
                initial={{ opacity: 0, x: 40, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10"
                style={{ filter: "drop-shadow(0 32px 64px rgba(37,99,235,0.4))" }}
              >
                <img
                  src={appMockupGen}
                  alt="HoraMed App"
                  className="w-full max-w-xs sm:max-w-sm mx-auto"
                  style={{ borderRadius: "2.5rem" }}
                />
              </motion.div>

              {/* Floating UI cards */}
              <FloatCard delay={0.8}
                className="absolute -left-4 top-12 z-20 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(56,189,248,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", minWidth: "170px" }}
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">⏰ {isPt ? "Hora do remédio!" : "Time for meds!"}</p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>Omeprazol · 20:00</p>
                </div>
              </FloatCard>

              <FloatCard delay={1.1}
                className="absolute -right-4 bottom-20 z-20 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(52,211,153,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">30 {isPt ? "dias" : "days"} 🔥</p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>{isPt ? "Sequência perfeita!" : "Perfect streak!"}</p>
                </div>
              </FloatCard>

              <FloatCard delay={1.3}
                className="absolute left-2 bottom-8 z-20 rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(45,212,191,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
              >
                <HeartPulse className="h-4 w-4" style={{ color: "#2dd4bf" }} />
                <p className="text-xs font-semibold text-white">98% {isPt ? "de adesão" : "adherence"}</p>
              </FloatCard>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="flex justify-center mt-16 cursor-pointer"
            onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.5)" }}>
                {isPt ? "descobrir mais" : "discover more"}
              </span>
              <ChevronDown className="h-5 w-5" style={{ color: "rgba(148,163,184,0.5)" }} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════ */}
      <section className="py-14 px-4 relative" style={{ background: "rgba(10,18,40,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <Reveal key={i} delay={i * 0.1} className="text-center">
                <p className="text-3xl sm:text-4xl font-black mb-1.5">
                  <span style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {typeof s.value === "number" && s.value > 100 ? <Counter to={s.value} suffix={s.suffix} /> : `${s.value}${s.suffix}`}
                  </span>
                </p>
                <p className="text-sm font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          EMOTIONAL HOOK — Full-bleed imagem
      ═══════════════════════════════════════════════ */}
      <section className="relative py-0 overflow-hidden" style={{ minHeight: "520px" }}>
        <img
          src={familyHealth}
          alt={isPt ? "Família cuidando da saúde juntos" : "Family taking care of health together"}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 30%" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(6,12,26,0.92) 0%, rgba(6,12,26,0.70) 50%, rgba(6,12,26,0.85) 100%)" }} />
        <div className="relative z-10 container mx-auto max-w-4xl px-4 py-24 flex items-center min-h-[520px]">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#38bdf8" }}>
              {isPt ? "Por que o HoraMed existe" : "Why HoraMed exists"}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-white mb-6">
              {isPt ? (
                <>
                  "Eu esqueci o remédio."<br />
                  <span style={{ color: "#f87171" }}>Três palavras que podem mudar tudo.</span>
                </>
              ) : (
                <>
                  "I forgot my medication."<br />
                  <span style={{ color: "#f87171" }}>Three words that can change everything.</span>
                </>
              )}
            </h2>
            <p className="text-lg sm:text-xl max-w-2xl leading-relaxed" style={{ color: "rgba(203,213,225,0.85)" }}>
              {isPt
                ? "Metade dos pacientes crônicos não toma os medicamentos corretamente. O resultado? Hospitalizações, piora de doenças, e mortes evitáveis. O HoraMed é a solução — simples, humana e inteligente."
                : "Half of chronic patients don't take their medications correctly. The result? Hospitalizations, worsening conditions, and preventable deaths. HoraMed is the solution — simple, human and intelligent."}
            </p>
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => window.location.href = authUrl}
                className="h-13 px-8 font-bold text-white rounded-xl transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)", boxShadow: "0 6px 24px rgba(37,99,235,0.5)", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
              >
                {isPt ? "Começar agora, de graça" : "Start now, for free"}
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES GRID — Dark premium
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-4" style={{ background: "#080f22" }}>
        <div className="container mx-auto max-w-6xl">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "#38bdf8" }}>
              {isPt ? "Recursos" : "Features"}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
              {isPt ? "Feito para quem levou a sério" : "Built for those who take it seriously"}
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(148,163,184,0.8)" }}>
              {isPt ? "Não é um alarme. É um ecossistema completo de cuidado com sua saúde." : "It's not an alarm. It's a complete health care ecosystem."}
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div
                  className="group p-5 rounded-2xl cursor-default transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  style={{
                    background: "rgba(15,23,42,0.7)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(56,189,248,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(6,182,212,0.2))", border: "1px solid rgba(56,189,248,0.2)" }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: "#38bdf8" }} />
                  </div>
                  <h3 className="font-bold text-sm mb-2 text-white">{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          APP SHOWCASE — Screenshots reais + pessoas
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden" style={{ background: "#060c1a" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 60% 50%, rgba(37,99,235,0.08) 0%, transparent 60%)" }} />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Reveal>
                <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "#38bdf8" }}>
                  {isPt ? "Como funciona" : "How it works"}
                </p>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
                  {isPt ? "Pronto em 2 minutos.\nEfetivo para sempre." : "Ready in 2 minutes.\nEffective forever."}
                </h2>
                {[
                  { n: "01", icon: Camera, title: isPt ? "Adicione ou fotografe" : "Add or photograph", desc: isPt ? "Busque o nome, fotografe a receita ou escreva. A IA faz o resto." : "Search the name, photograph the prescription or type it. AI does the rest." },
                  { n: "02", icon: Bell, title: isPt ? "Configure em segundos" : "Set up in seconds", desc: isPt ? "Escolha horários, frequência e modo de alerta. Simples assim." : "Choose times, frequency and alert mode. That simple." },
                  { n: "03", icon: HeartPulse, title: isPt ? "Confirme e evolua" : "Confirm and evolve", desc: isPt ? "Um toque confirma a dose. Acompanhe sua adesão crescer todo dia." : "One tap confirms the dose. Watch your adherence grow every day." },
                ].map((s, i) => (
                  <Reveal key={i} delay={i * 0.12}>
                    <div className="flex gap-4 mb-6">
                      <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(56,189,248,0.2)" }}>
                        <s.icon className="h-5 w-5" style={{ color: "#38bdf8" }} />
                        <span className="absolute -top-2 -right-2 text-[9px] font-black px-1.5 rounded-full text-white" style={{ background: "#2563eb" }}>{s.n}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-0.5">{s.title}</h3>
                        <p className="text-sm" style={{ color: "rgba(148,163,184,0.75)" }}>{s.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </Reveal>
            </div>

            {/* Screenshot real do app */}
            <Reveal delay={0.2}>
              <div className="relative flex justify-center">
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(37,99,235,0.2) 0%, transparent 70%)", filter: "blur(30px)" }} />
                <img
                  src={appMockup}
                  alt="HoraMed App Screenshot"
                  className="relative z-10 max-w-[300px] w-full mx-auto"
                  style={{ borderRadius: "2.5rem", filter: "drop-shadow(0 24px 48px rgba(37,99,235,0.4))" }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ELDERLY / SOCIAL PROOF — Foto + Depoimentos
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden" style={{ background: "#080f22" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Foto real de uso */}
            <Reveal>
              <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: "4/3", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
                <img src={elderlyCare} alt={isPt ? "Idosa usando o HoraMed" : "Elderly woman using HoraMed"} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,12,26,0.8) 0%, transparent 50%)" }} />
                <div className="absolute bottom-5 left-5 right-5">
                  <div
                    className="rounded-2xl px-4 py-3 flex items-center gap-3"
                    style={{ background: "rgba(6,12,26,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{isPt ? "Maria, 78 anos" : "Maria, 78 years old"}</p>
                      <p className="text-xs" style={{ color: "rgba(148,163,184,0.8)" }}>
                        {isPt ? "12 meses com 100% de adesão" : "12 months with 100% adherence"}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[...Array(5)].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Coluna de depoimentos */}
            <div>
              <Reveal>
                <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "#38bdf8" }}>
                  {isPt ? "O que dizem" : "What they say"}
                </p>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-8">
                  {isPt ? "Vidas transformadas.\nFamílias protegidas." : "Transformed lives.\nProtected families."}
                </h2>
              </Reveal>
              <div className="relative" style={{ minHeight: "220px" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                  >
                    <div
                      className="rounded-2xl p-6 h-full"
                      style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
                    >
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                      </div>
                      <p className="text-base leading-relaxed text-white/90 mb-5 italic">
                        "{testimonials[activeTestimonial].content}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>
                          {testimonials[activeTestimonial].avatar}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{testimonials[activeTestimonial].name}</p>
                          <p className="text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>{testimonials[activeTestimonial].role}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Dots */}
              <div className="flex gap-2 mt-56">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: i === activeTestimonial ? "28px" : "8px", background: i === activeTestimonial ? "#38bdf8" : "rgba(148,163,184,0.3)" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-4" style={{ background: "#060c1a" }}>
        <div className="container mx-auto max-w-4xl">
          <Reveal className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "#38bdf8" }}>
              {isPt ? "Planos" : "Pricing"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {isPt ? "Sua saúde vale mais do que a maioria das assinaturas." : "Your health is worth more than most subscriptions."}
            </h2>
            <p className="text-lg" style={{ color: "rgba(148,163,184,0.75)" }}>
              {isPt ? "Comece grátis. Faça upgrade quando quiser." : "Start free. Upgrade whenever you want."}
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Gratuito */}
            <Reveal delay={0.1}>
              <div className="p-8 rounded-3xl h-full" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-xl font-bold text-white mb-1">{isPt ? "Gratuito" : "Free"}</h3>
                <p className="text-sm mb-6" style={{ color: "rgba(148,163,184,0.7)" }}>{isPt ? "Para começar hoje" : "To start today"}</p>
                <div className="mb-8">
                  <span className="text-4xl font-black text-white">{pricing.symbol}0</span>
                  <span className="text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>{priceLabel}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {freeFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(203,213,225,0.8)" }}>
                      <Check className="h-4 w-4 shrink-0" style={{ color: "#38bdf8" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => window.location.href = authUrl}
                  className="w-full h-12 rounded-xl font-semibold text-sm transition-all hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(203,213,225,0.9)" }}
                >
                  {isPt ? "Começar grátis" : "Start free"}
                </button>
              </div>
            </Reveal>

            {/* Premium */}
            <Reveal delay={0.2}>
              <div className="p-8 rounded-3xl h-full relative overflow-hidden"
                style={{ background: "linear-gradient(145deg, #1d4ed8 0%, #0369a1 50%, #0e7490 100%)", boxShadow: "0 20px 60px rgba(37,99,235,0.4)" }}>
                {/* Shimmer overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)" }} />
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-black" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                  ✦ {isPt ? "Recomendado" : "Recommended"}
                </div>
                <h3 className="text-xl font-black text-white mb-1">Premium</h3>
                <p className="text-sm mb-6 text-white/70">{isPt ? "Cuidado sem limites" : "Unlimited care"}</p>
                <div className="mb-1">
                  <span className="text-4xl font-black text-white">{priceDisplay}</span>
                  <span className="text-sm text-white/70">{priceLabel}</span>
                </div>
                <p className="text-xs text-white/60 mb-8">{isPt ? "7 dias gratuitos para experimentar" : "7 free days to try"}</p>
                <ul className="space-y-2.5 mb-8">
                  {premiumFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-white">
                      <Check className="h-4 w-4 shrink-0 text-white/80" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => window.location.href = authUrl}
                  className="w-full h-12 rounded-xl font-black text-sm transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
                  style={{ background: "white", color: "#1e40af" }}
                >
                  {isPt ? "Testar 7 dias grátis" : "Try 7 days free"}
                </button>
                <p className="text-xs text-center text-white/50 mt-3">
                  {isPt ? "Cancele quando quiser, sem burocracia" : "Cancel anytime, no hassle"}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TRUST BADGES
      ═══════════════════════════════════════════════ */}
      <section className="py-10 px-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#080f22" }}>
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              { icon: Shield, label: isPt ? "Seus dados nunca são vendidos" : "Your data is never sold" },
              { icon: Lock, label: isPt ? "Criptografia de ponta a ponta" : "End-to-end encryption" },
              { icon: Smartphone, label: "iOS & Android" },
              { icon: MessageCircle, label: isPt ? "Suporte em português" : "Support in English" },
              { icon: Stethoscope, label: isPt ? "Aprovado por médicos" : "Doctor-approved" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <t.icon className="h-4 w-4" style={{ color: "#38bdf8" }} />
                <span className="text-sm font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA — Poderoso e emocional
      ═══════════════════════════════════════════════ */}
      <section className="relative py-32 px-4 overflow-hidden" style={{ background: "#060c1a" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 65%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.08) 0%, transparent 50%)" }} />
        </div>
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <Reveal>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
              style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)", boxShadow: "0 8px 32px rgba(37,99,235,0.4)" }}>
              <HeartPulse className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
              {isPt ? (
                <>Sua saúde merece<br /><span style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>o melhor cuidado.</span></>
              ) : (
                <>Your health deserves<br /><span style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>the best care.</span></>
              )}
            </h2>
            <p className="text-xl mb-10 leading-relaxed" style={{ color: "rgba(203,213,225,0.8)" }}>
              {isPt
                ? "Não deixe para amanhã o que pode salvar vidas hoje. Comece agora — é grátis, é simples, e pode mudar tudo."
                : "Don't leave for tomorrow what can save lives today. Start now — it's free, it's simple, and it can change everything."}
            </p>
            <button
              onClick={() => window.location.href = authUrl}
              className="group h-16 px-14 text-lg font-black text-white rounded-2xl transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl active:scale-[0.97] inline-flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)", boxShadow: "0 12px 40px rgba(37,99,235,0.5), 0 0 0 1px rgba(56,189,248,0.2)" }}
            >
              {isPt ? "Criar conta grátis agora" : "Create free account now"}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-5 text-sm" style={{ color: "rgba(100,116,139,0.8)" }}>
              {isPt ? "Sem cartão de crédito · 7 dias Premium incluso · Cancele quando quiser" : "No credit card · 7 days Premium included · Cancel anytime"}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="py-10 px-4" style={{ background: "#030712", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <img
              src={logo}
              alt="HoraMed"
              className="h-10 w-auto"
              style={{ filter: "brightness(1.1) drop-shadow(0 0 6px rgba(56,189,248,0.3))" }}
            />
            <div className="flex gap-6 text-sm" style={{ color: "rgba(100,116,139,0.8)" }}>
              <a href="/termos" className="hover:text-white transition-colors">{isPt ? "Termos de Uso" : "Terms of Use"}</a>
              <a href="/privacidade" className="hover:text-white transition-colors">{isPt ? "Privacidade" : "Privacy"}</a>
              <button onClick={() => window.location.href = authUrl} className="hover:text-white transition-colors">{isPt ? "Entrar" : "Login"}</button>
            </div>
          </div>
          <div className="mt-8 pt-6 text-center text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(100,116,139,0.5)" }}>
            © {new Date().getFullYear()} HoraMed. {isPt ? "Todos os direitos reservados." : "All rights reserved."}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
