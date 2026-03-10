import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import logo from "@/assets/logo_HoraMed.png";
import heroBg from "@/assets/landing-hero-bg-new.png";
import appScreenHoje from "@/assets/app-screen-hoje.png";
import appScreenRotina from "@/assets/app-screen-rotina.png";
import appScreenPerfil from "@/assets/app-screen-perfil.png";
import { Bell, FileText, Users, Shield, Brain, DeviceMobile as Smartphone, Star, Check, ArrowRight, Camera, Heartbeat as HeartPulse, Trophy, Pill, CaretDown as ChevronDown, Lock, Clock, Heartbeat as Activity, CalendarCheck, Sparkle as Sparkles, CheckCircle as CheckCircle2, TrendUp as TrendingUp, Stethoscope, ChatCircle as MessageCircle, Syringe, Heart, Alarm } from "@phosphor-icons/react";
import { getAuthRedirectUrl } from "@/lib/domainConfig";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { PRICING, BRL_COUNTRIES } from "@/lib/stripeConfig";

/* ─── Design tokens — azul real do app ───────────────────────────── */
const C = {
  // Azul primário exato do app (nav bar ativa, botões principais)
  primary: "hsl(199 89% 48%)",
  primaryDark: "hsl(199 89% 38%)",
  primaryLight: "hsl(199 89% 94%)",
  grad: "linear-gradient(135deg, hsl(199 89% 48%), hsl(207 89% 58%))",
  // BG da landing = gradiente levíssimo azul celeste → branco (igual à tela de login)
  bg: "linear-gradient(160deg, hsl(204 80% 96%) 0%, hsl(210 60% 99%) 50%, hsl(204 80% 97%) 100%)",
  bgFlat: "hsl(204 80% 97%)",
  card: "#ffffff",
  text: "hsl(222 60% 12%)",
  muted: "hsl(222 30% 45%)",
  border: "hsl(210 40% 90%)",
  success: "hsl(142 69% 45%)",
};

/* ─── Scroll progress bar ────────────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "left", background: C.grad }}
      className="fixed top-0 left-0 right-0 h-[3px] z-[60]"
    />
  );
}

/* ─── Floating ambient particles ─────────────────────────────────── */
const PARTICLES = [
  { icon: Pill, x: "8%", y: "18%", delay: 0, dur: 6 },
  { icon: Heart, x: "85%", y: "15%", delay: 1.2, dur: 7 },
  { icon: Alarm, x: "75%", y: "70%", delay: 0.5, dur: 5 },
  { icon: Stethoscope, x: "12%", y: "75%", delay: 2, dur: 8 },
  { icon: Sparkles, x: "50%", y: "8%", delay: 0.8, dur: 6.5 },
  { icon: Syringe, x: "92%", y: "45%", delay: 1.5, dur: 7.5 },
];
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute text-xl select-none"
          style={{ left: p.x, top: p.y, opacity: 0.18 }}
          animate={{ y: [-12, 12, -12], rotate: [-8, 8, -8], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <p.icon className="w-6 h-6" />
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Cursor glow ─────────────────────────────────────────────────── */
function CursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { damping: 22, stiffness: 130 });
  const sy = useSpring(y, { damping: 22, stiffness: 130 });
  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);
  return (
    <motion.div
      style={{
        left: sx, top: sy,
        translateX: "-50%", translateY: "-50%",
        background: "radial-gradient(circle, hsl(199 89% 48% / 0.08) 0%, transparent 70%)",
      }}
      className="pointer-events-none fixed z-30 w-72 h-72 rounded-full"
    />
  );
}

/* ─── Section reveal ─────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated Counter ───────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let v = 0;
    const step = Math.max(1, Math.ceil(to / 60));
    const t = setInterval(() => {
      v += step;
      if (v >= to) { setCount(to); clearInterval(t); } else setCount(v);
    }, 16);
    return () => clearInterval(t);
  }, [inView, to]);
  return <span ref={ref}>{count.toLocaleString("pt-BR")}{suffix}</span>;
}

/* ─── Phone Carousel — telas reais do app ───────────────────────── */
const APP_SCREENS = [
  { src: appScreenHoje, label: "Hoje" },
  { src: appScreenRotina, label: "Rotina" },
  { src: appScreenPerfil, label: "Perfil" },
];

function PhoneCarousel() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % APP_SCREENS.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Phone shell */}
      <div
        className="relative rounded-[2.8rem] overflow-hidden border-[6px] border-white shadow-2xl w-[240px] sm:w-[270px]"
        style={{ boxShadow: "0 40px 100px rgba(41,171,226,0.25), 0 8px 24px rgba(0,0,0,0.12)" }}
      >
        {/* Status bar imitation */}
        <div className="flex items-center justify-between px-5 py-2 bg-white">
          <span className="text-[10px] font-semibold text-slate-400">09:41</span>
          <div className="w-14 h-4 rounded-full bg-slate-900" />
          <span className="text-[10px] text-slate-400">100%</span>
        </div>
        {/* Actual app screenshot — animated carousel */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "9/19" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={APP_SCREENS[current].src}
              alt={APP_SCREENS[current].label}
              className="absolute inset-0 w-full h-full object-cover object-top"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>
        </div>
        {/* Home indicator */}
        <div className="flex justify-center items-center py-2 bg-white">
          <div className="w-24 h-1 rounded-full bg-slate-300" />
        </div>
      </div>
      {/* Dots */}
      <div className="flex gap-1.5 mt-4">
        {APP_SCREENS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? "24px" : "6px",
              background: i === current ? "hsl(199 89% 48%)" : "hsl(215 16% 78%)"
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PhoneFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`relative rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl ${className}`}
      style={{
        boxShadow: "0 40px 100px rgba(41,171,226,0.22), 0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(41,171,226,0.1)",
      }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

/* ─── Magnetic button ────────────────────────────────────────────── */
function MagneticBtn({ children, onClick, className = "", style = {} }: {
  children: React.ReactNode; onClick: () => void; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 20 });
  const sy = useSpring(y, { stiffness: 250, damping: 20 });
  const onMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left - r.width / 2) * 0.35);
    y.set((e.clientY - r.top - r.height / 2) * 0.35);
  }, [x, y]);
  const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);
  return (
    <motion.button
      ref={ref}
      style={{ ...style, x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
const Landing = () => {
  const authUrl = getAuthRedirectUrl();
  const { language, country } = useLanguage();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Mouse parallax for hero phone
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const phoneX = useSpring(useTransform(mouseX, [-1, 1], [-14, 14]), { stiffness: 80, damping: 18 });
  const phoneY = useSpring(useTransform(mouseY, [-1, 1], [-8, 8]), { stiffness: 80, damping: 18 });
  const heroRef = useRef<HTMLElement>(null);
  const onHeroMouseMove = useCallback((e: React.MouseEvent) => {
    const r = heroRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    mouseY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }, [mouseX, mouseY]);

  const isBrazil = BRL_COUNTRIES.includes(country.code);
  const pricing = isBrazil ? PRICING.brl : PRICING.usd;
  const priceDisplay = `${pricing.symbol}${pricing.monthly.toFixed(2)}`;
  const isPt = language === "pt";

  /* testimonials */
  const testimonials = isPt ? [
    { name: "Lucas M.", role: "Usa para si mesmo", avatar: "L", bg: C.primary, content: "Tomo 3 medicamentos diários para tireoide e pressão. Antes esquecia direto. Com o HoraMed, minha adesão chegou a 100%. É literalmente transformador.", rating: 5 },
    { name: "Maria Helena", role: "Cuida dos pais idosos", avatar: "M", bg: "hsl(152 60% 42%)", content: "Minha mãe tem 78 anos e toma 6 medicamentos com horários diferentes. Agora tenho paz de saber que ela está cuidada, sem ligar 3 vezes por dia.", rating: 5 },
    { name: "Roberto S.", role: "Paciente cardíaco", avatar: "R", bg: "hsl(0 65% 52%)", content: "Depois do infarto, perder uma dose pode custar a vida. O HoraMed me dá essa segurança todo dia. É como ter um enfermeiro 24h no bolso.", rating: 5 },
    { name: "Dra. Fernanda", role: "Cardiologista", avatar: "F", bg: "hsl(38 92% 50%)", content: "Recomendo para todos os meus pacientes. A adesão ao tratamento melhora visivelmente. Já vi casos em que o HoraMed evitou internações.", rating: 5 },
  ] : [
    { name: "Lucas M.", role: "Uses for himself", avatar: "L", bg: C.primary, content: "I take 3 daily meds for thyroid and blood pressure. I used to forget constantly. With HoraMed, my adherence reached 100%. It's life-changing.", rating: 5 },
    { name: "Mary H.", role: "Cares for elderly parents", avatar: "M", bg: "hsl(152 60% 42%)", content: "My mom is 78 and takes 6 medications at different times. Now I have peace of mind without calling 3 times a day.", rating: 5 },
    { name: "Robert S.", role: "Heart patient", avatar: "R", bg: "hsl(0 65% 52%)", content: "After my heart attack, missing a dose can cost your life. HoraMed gives me that security every day. It's like having a nurse 24/7 in my pocket.", rating: 5 },
    { name: "Dr. Fernanda", role: "Cardiologist", avatar: "F", bg: "hsl(38 92% 50%)", content: "I recommend it to all my patients. Medication adherence improves visibly. I've seen cases where HoraMed prevented hospitalizations.", rating: 5 },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  const features = [
    { icon: Bell, title: isPt ? "Lembretes precisos" : "Precise reminders", desc: isPt ? "Push, som ou vibração na hora certa. Nunca mais esqueça." : "Push, sound or vibration on time. Never forget again." },
    { icon: Users, title: isPt ? "Família inteira" : "Whole family", desc: isPt ? "Até 5 perfis. Pais, filhos e cônjuge num só app." : "Up to 5 profiles. All family in one app." },
    { icon: Brain, title: isPt ? "IA Clara" : "Clara AI", desc: isPt ? "Tira dúvidas, explica bulas e organiza sua saúde." : "Answers questions and explains prescriptions." },
    { icon: Camera, title: isPt ? "Scan de receita" : "Prescription scan", desc: isPt ? "Fotografe a receita — a IA extrai o remédio e a dose." : "Photograph it — AI extracts drug and dosage." },
    { icon: FileText, title: isPt ? "Carteira de Saúde" : "Health Wallet", desc: isPt ? "Exames, vacinas e receitas guardados com segurança." : "Exams, vaccines, and prescriptions stored securely." },
    { icon: Activity, title: isPt ? "Dashboard de adesão" : "Adherence dashboard", desc: isPt ? "Sequências, histórico e evolução visual da sua saúde." : "Streaks, history and visual health progress." },
    { icon: Shield, title: isPt ? "Alerta de interações" : "Interaction alerts", desc: isPt ? "Combinações perigosas detectadas automaticamente." : "Dangerous combinations detected automatically." },
    { icon: CalendarCheck, title: isPt ? "Modo viagem" : "Travel mode", desc: isPt ? "Ajuste horários por fuso automaticamente ao viajar." : "Auto-adjust schedules by timezone when traveling." },
  ];

  const freeFeatures = isPt
    ? ["1 medicamento", "Lembretes básicos", "1 perfil", "Histórico limitado"]
    : ["1 medication", "Basic reminders", "1 profile", "Limited history"];

  const premiumFeatures = isPt
    ? ["Medicamentos ilimitados", "Lembretes inteligentes", "Até 5 perfis", "Histórico completo", "IA Clara", "Scan de receitas", "Carteira de Saúde", "Alerta de interações", "Dashboard completo", "Modo viagem", "Gamificação", "Suporte prioritário"]
    : ["Unlimited medications", "Smart reminders", "Up to 5 profiles", "Full history", "Clara AI", "Prescription scanner", "Health Wallet", "Interactions check", "Complete dashboard", "Travel mode", "Gamification", "Priority support"];

  const stats = [
    { value: 50000, suffix: "+", label: isPt ? "doses lembradas/mês" : "doses/month reminded" },
    { value: 5000, suffix: "+", label: isPt ? "famílias protegidas" : "families protected" },
    { value: 98, suffix: "%", label: isPt ? "adesão média" : "avg. adherence" },
    { value: "4.9", suffix: "★", label: isPt ? "avaliação" : "rating" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: C.bgFlat }}>
      <ScrollProgress />
      <CursorGlow />
      <SEOHead
        title={isPt ? "HoraMed — Gestão Completa da Sua Saúde" : "HoraMed — Complete Health Management"}
        description={isPt
          ? "Pare de esquecer medicamentos. HoraMed cuida de você e da sua família com lembretes inteligentes, IA e histórico médico digital."
          : "Stop forgetting medications. HoraMed takes care of you and your family with smart reminders, AI, and digital medical history."}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ background: "rgba(240,248,255,0.92)", backdropFilter: "blur(16px)", borderColor: C.border }}
      >
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between max-w-7xl">
          <img src={logo} alt="HoraMed" className="h-9 w-auto" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = authUrl}
              className="hidden sm:block h-9 px-4 text-sm font-medium rounded-xl border transition-all hover:bg-slate-50"
              style={{ color: C.muted, borderColor: C.border }}
            >
              {isPt ? "Entrar" : "Login"}
            </button>
            <button
              onClick={() => window.location.href = authUrl}
              className="h-9 px-5 text-sm font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: C.grad, boxShadow: "0 4px 14px hsl(199 89% 48% / 0.4)" }}
            >
              {isPt ? "Começar Grátis" : "Start Free"}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO — fundo foto desfocada + paleta azul real do app
      ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} onMouseMove={onHeroMouseMove} className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Foto de fundo desfocada */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="HoraMed Health Management"
            className="w-full h-full object-cover"
            style={{ filter: "blur(4px) brightness(1.05) saturate(0.8)" }}
          />
          {/* Overlay gradiente com azul do app */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, hsl(204 90% 95% / 0.90) 0%, hsl(199 89% 48% / 0.08) 40%, hsl(210 60% 98% / 0.88) 100%)",
            }}
          />
        </div>
        <FloatingParticles />

        {/* Animated gradient orbs — depth & immersion */}
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 600, height: 600, top: "-20%", left: "-10%",
            background: "radial-gradient(circle, hsl(199 89% 72% / 0.18) 0%, transparent 65%)"
          }}
          animate={{ scale: [1, 1.12, 1], x: [0, 30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 400, height: 400, bottom: "5%", right: "-5%",
            background: "radial-gradient(circle, hsl(207 89% 68% / 0.14) 0%, transparent 65%)"
          }}
          animate={{ scale: [1, 1.08, 1], y: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* LEFT: copy */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
                style={{ background: "hsl(199 89% 48% / 0.12)", color: C.primary, border: `1px solid hsl(199 89% 48% / 0.25)` }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isPt ? "7 dias Premium grátis · Sem cartão" : "7 days Premium free · No card"}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black tracking-tight leading-[1.07] mb-5"
                style={{ color: C.text }}
              >
                {isPt ? (
                  <>
                    O app que cuida da{" "}
                    <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      sua saúde
                    </span>{" "}
                    com você.
                  </>
                ) : (
                  <>
                    The app that cares for{" "}
                    <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      your health
                    </span>{" "}
                    with you.
                  </>
                )}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg leading-relaxed mb-8"
                style={{ color: C.muted }}
              >
                {isPt
                  ? "Lembretes inteligentes, assistente IA, histórico médico e família inteira num único app. Feito para quem leva a saúde a sério."
                  : "Smart reminders, AI assistant, medical history and the whole family in one app. Built for those who take health seriously."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                <MagneticBtn
                  onClick={() => window.location.href = authUrl}
                  className="group h-14 px-8 text-base font-bold text-white rounded-2xl flex items-center justify-center gap-2 shadow-xl"
                  style={{ background: C.grad, boxShadow: "0 8px 28px hsl(199 89% 48% / 0.40)" }}
                >
                  {isPt ? "Começar agora, grátis" : "Start now, for free"}
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </MagneticBtn>
                <MagneticBtn
                  onClick={() => window.location.href = authUrl}
                  className="h-14 px-8 text-base font-semibold rounded-2xl border-2 backdrop-blur-sm"
                  style={{ color: C.primary, borderColor: C.primary + "55", background: "rgba(255,255,255,0.5)" }}
                >
                  {isPt ? "Já tenho conta" : "I have an account"}
                </MagneticBtn>
              </motion.div>

              {/* Social proof avatars */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3 mt-7 justify-center lg:justify-start"
              >
                <div className="flex -space-x-2">
                  {[C.primary, C.success, "hsl(38 92% 50%)", "hsl(0 65% 52%)"].map((bg, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: bg }}>
                      {["L", "M", "R", "F"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {isPt ? "5.000+ famílias protegidas" : "5,000+ families protected"}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* RIGHT: carrossel com screenshots reais do app */}
            <div className="flex items-center justify-center lg:justify-end relative">
              {/* glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, hsl(199 89% 48% / 0.18) 0%, transparent 70%)", filter: "blur(50px)" }} />

              <motion.div
                initial={{ opacity: 0, y: 36, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ x: phoneX, y: phoneY }}
                className="relative z-10"
              >
                {/* Floating badge: lembrete */}
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="absolute -left-8 top-10 z-20 flex items-center gap-2.5 rounded-2xl px-3 py-2.5 border shadow-lg"
                  style={{ background: C.card, borderColor: C.border, minWidth: "160px" }}
                >
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.grad }}>
                    <Alarm className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: C.text }}>{isPt ? "Hora do remédio!" : "Time for meds!"}</p>
                    <p className="text-[10px]" style={{ color: C.muted }}>Omeprazol · 20:00</p>
                  </div>
                </motion.div>

                {/* Carrossel com telas reais */}
                <PhoneCarousel />

                {/* Floating badge: streak */}
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="absolute -right-8 bottom-16 z-20 flex items-center gap-2.5 rounded-2xl px-3 py-2.5 border shadow-lg"
                  style={{ background: C.card, borderColor: C.border }}
                >
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(28 92% 52%))" }}>
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: C.text }}>30 {isPt ? "dias" : "days"}</p>
                    <p className="text-[10px]" style={{ color: C.muted }}>{isPt ? "Sequência perfeita!" : "Perfect streak!"}</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="flex justify-center mt-16 cursor-pointer"
            onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })}
          >
            <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}
              className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.muted }}>
                {isPt ? "ver mais" : "see more"}
              </span>
              <ChevronDown className="h-4 w-4" style={{ color: C.muted }} />
            </motion.div>
          </motion.div>
        </div>
      </section >

      {/* ═══════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════ */}
      < section className="py-14 px-4 border-y" style={{ background: C.card, borderColor: C.border }}>
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <Reveal key={i} delay={i * 0.08} className="text-center">
                <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color: C.primary }}>
                  {typeof s.value === "number" && s.value > 100
                    ? <Counter to={s.value} suffix={s.suffix} />
                    : `${s.value}${s.suffix}`}
                </p>
                <p className="text-sm" style={{ color: C.muted }}>{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section >

      {/* ═══════════════════════════════════════════════
          PROBLEM HOOK
      ═══════════════════════════════════════════════ */}
      < section className="py-24 px-4" style={{ background: C.bgFlat }}>
        <div className="container mx-auto max-w-4xl">
          <Reveal className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
              style={{ background: "hsl(0 65% 52% / 0.1)" }}>
              <HeartPulse className="h-7 w-7" style={{ color: "hsl(0 65% 52%)" }} />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>
              {isPt ? "Por que o HoraMed existe" : "Why HoraMed exists"}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-6" style={{ color: C.text }}>
              {isPt ? (
                <>"Esqueci o remédio."<br /><span style={{ color: "hsl(0 65% 52%)" }}>Três palavras que mudam tudo.</span></>
              ) : (
                <>"I forgot my medication."<br /><span style={{ color: "hsl(0 65% 52%)" }}>Three words that change everything.</span></>
              )}
            </h2>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed mb-8" style={{ color: C.muted }}>
              {isPt
                ? "Metade dos pacientes crônicos não toma os medicamentos corretamente. O resultado? Internações evitáveis e piora de doenças. O HoraMed é a solução simples e humana."
                : "Half of chronic patients don't take their medications correctly. The result? Preventable hospitalizations. HoraMed is the simple, human solution."}
            </p>
            <button
              onClick={() => window.location.href = authUrl}
              className="h-12 px-8 font-bold text-white rounded-2xl inline-flex items-center gap-2 transition-all hover:scale-105"
              style={{ background: C.grad, boxShadow: "0 6px 20px hsl(199 89% 48% / 0.35)" }}
            >
              {isPt ? "Começar agora, de graça" : "Start now, for free"}
            </button>
          </Reveal>
        </div>
      </section >

      {/* ═══════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════ */}
      < section className="py-24 px-4 border-t" style={{ background: C.card, borderColor: C.border }}>
        <div className="container mx-auto max-w-6xl">
          <Reveal className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>
              {isPt ? "Recursos" : "Features"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: C.text }}>
              {isPt ? "Feito para quem leva a sério" : "Built for those who take it seriously"}
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: C.muted }}>
              {isPt ? "Não é um alarme. É um ecossistema completo de cuidado." : "Not just an alarm. A complete care ecosystem."}
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div
                  className="group p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  style={{ background: C.bgFlat, borderColor: C.border }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "hsl(199 89% 48% / 0.35)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: "hsl(199 89% 48% / 0.1)" }}>
                    <f.icon className="h-5 w-5" style={{ color: C.primary }} />
                  </div>
                  <h3 className="font-bold text-sm mb-2" style={{ color: C.text }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section >

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      < section className="py-24 px-4" style={{ background: C.bgFlat }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>
                {isPt ? "Como funciona" : "How it works"}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black mb-8" style={{ color: C.text }}>
                {isPt ? "Pronto em 2 minutos.\nEfetivo para sempre." : "Ready in 2 minutes.\nEffective forever."}
              </h2>
              {[
                { n: "01", icon: Camera, title: isPt ? "Adicione ou fotografe" : "Add or photograph", desc: isPt ? "Busque o nome, fotografe a receita ou escreva. A IA faz o resto." : "Search, photograph or type. AI does the rest." },
                { n: "02", icon: Bell, title: isPt ? "Configure em segundos" : "Set up in seconds", desc: isPt ? "Escolha horários, frequência e modo de alerta. Simples assim." : "Choose times, frequency and alert mode. That simple." },
                { n: "03", icon: TrendingUp, title: isPt ? "Evolua todo dia" : "Improve every day", desc: isPt ? "Um toque confirma a dose. Veja sua adesão crescer." : "One tap confirms the dose. Watch your adherence grow." },
              ].map((s, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="flex gap-4 mb-6">
                    <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center relative border"
                      style={{ background: "hsl(199 89% 48% / 0.08)", borderColor: "hsl(199 89% 48% / 0.2)" }}>
                      <s.icon className="h-5 w-5" style={{ color: C.primary }} />
                      <span className="absolute -top-2 -right-2 text-[9px] font-black px-1.5 rounded-full text-white"
                        style={{ background: C.primary }}>{s.n}</span>
                    </div>
                    <div>
                      <h3 className="font-bold mb-0.5" style={{ color: C.text }}>{s.title}</h3>
                      <p className="text-sm" style={{ color: C.muted }}>{s.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </Reveal>

            {/* Segunda tela real — Rotina */}
            <Reveal delay={0.2} className="flex justify-center relative">
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, hsl(199 89% 48% / 0.15) 0%, transparent 70%)", filter: "blur(30px)" }} />
              <div className="relative z-10">
                <div
                  className="rounded-[2.8rem] overflow-hidden border-[6px] border-white shadow-2xl w-[230px] sm:w-[260px]"
                  style={{ boxShadow: "0 40px 100px rgba(41,171,226,0.22), 0 8px 24px rgba(0,0,0,0.10)" }}
                >
                  <div className="flex items-center justify-between px-5 py-2 bg-white">
                    <span className="text-[10px] font-semibold text-slate-400">09:41</span>
                    <div className="w-14 h-4 rounded-full bg-slate-900" />
                    <span className="text-[10px] text-slate-400">100%</span>
                  </div>
                  <img
                    src={appScreenRotina}
                    alt="HoraMed - Tela Rotina"
                    className="w-full object-cover object-top"
                    style={{ aspectRatio: "9/19" }}
                  />
                  <div className="flex justify-center items-center py-2 bg-white">
                    <div className="w-24 h-1 rounded-full bg-slate-300" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section >

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      < section className="py-24 px-4 border-t" style={{ background: C.card, borderColor: C.border }}>
        <div className="container mx-auto max-w-4xl">
          <Reveal className="text-center mb-12">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>
              {isPt ? "O que dizem" : "What they say"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ color: C.text }}>
              {isPt ? "Vidas transformadas." : "Transformed lives."}
            </h2>
          </Reveal>

          <div className="relative" style={{ minHeight: "230px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                <div className="rounded-2xl p-8 border h-full" style={{ background: C.bgFlat, borderColor: C.border }}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) =>
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-base leading-relaxed mb-6 italic" style={{ color: C.text }}>
                    "{testimonials[activeTestimonial].content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: testimonials[activeTestimonial].bg }}>
                      {testimonials[activeTestimonial].avatar}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: C.text }}>{testimonials[activeTestimonial].name}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{testimonials[activeTestimonial].role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex gap-2 mt-60 justify-center">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === activeTestimonial ? "28px" : "8px", background: i === activeTestimonial ? C.primary : "hsl(215 16% 80%)" }}
              />
            ))}
          </div>
        </div>
      </section >

      {/* ═══════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════ */}
      < section className="py-24 px-4" style={{ background: C.bgFlat }}>
        <div className="container mx-auto max-w-4xl">
          <Reveal className="text-center mb-12">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>
              {isPt ? "Planos" : "Pricing"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: C.text }}>
              {isPt ? "Sua saúde não tem preço.\nMas cabe no bolso." : "Your health is priceless.\nBut affordable."}
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <Reveal delay={0.1}>
              <div className="p-8 rounded-3xl border h-full" style={{ background: C.card, borderColor: C.border }}>
                <h3 className="text-xl font-bold mb-1" style={{ color: C.text }}>{isPt ? "Gratuito" : "Free"}</h3>
                <p className="text-sm mb-6" style={{ color: C.muted }}>{isPt ? "Para começar hoje" : "To start today"}</p>
                <div className="mb-8">
                  <span className="text-4xl font-black" style={{ color: C.text }}>{pricing.symbol}0</span>
                  <span className="text-sm ml-1" style={{ color: C.muted }}>{isPt ? "/mês" : "/month"}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {freeFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: C.muted }}>
                      <Check className="h-4 w-4 shrink-0" style={{ color: C.primary }} />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => window.location.href = authUrl}
                  className="w-full h-12 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-slate-50"
                  style={{ color: C.primary, borderColor: C.primary + "55" }}>
                  {isPt ? "Começar grátis" : "Start free"}
                </button>
              </div>
            </Reveal>

            {/* Premium */}
            <Reveal delay={0.2}>
              <div className="p-8 rounded-3xl h-full relative overflow-hidden text-white"
                style={{ background: C.grad, boxShadow: "0 20px 60px hsl(199 89% 48% / 0.40)" }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)" }} />
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-black"
                  style={{ background: "rgba(255,255,255,0.2)" }}>
                  ✦ {isPt ? "Recomendado" : "Recommended"}
                </div>
                <h3 className="text-xl font-black mb-1">Premium</h3>
                <p className="text-sm mb-6 text-white/70">{isPt ? "Cuidado sem limites" : "Unlimited care"}</p>
                <div className="mb-1">
                  <span className="text-4xl font-black">{priceDisplay}</span>
                  <span className="text-sm text-white/70 ml-1">{isPt ? "/mês" : "/month"}</span>
                </div>
                <p className="text-xs text-white/60 mb-8">{isPt ? "7 dias gratuitos para experimentar" : "7 free days to try"}</p>
                <ul className="space-y-2.5 mb-8">
                  {premiumFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-white/80" />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => window.location.href = authUrl}
                  className="w-full h-12 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "white", color: C.primary }}>
                  {isPt ? "Testar 7 dias grátis" : "Try 7 days free"}
                </button>
                <p className="text-xs text-center text-white/50 mt-3">
                  {isPt ? "Cancele quando quiser" : "Cancel anytime"}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section >

      {/* TRUST BADGES */}
      < section className="py-10 px-4 border-t" style={{ background: C.card, borderColor: C.border }}>
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              { icon: Shield, label: isPt ? "Dados nunca vendidos" : "Data never sold" },
              { icon: Lock, label: isPt ? "Criptografia ponta a ponta" : "End-to-end encryption" },
              { icon: Smartphone, label: "iOS & Android" },
              { icon: MessageCircle, label: isPt ? "Suporte em português" : "Support in English" },
              { icon: Stethoscope, label: isPt ? "Aprovado por médicos" : "Doctor-approved" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <t.icon className="h-4 w-4" style={{ color: C.primary }} />
                <span className="text-sm font-medium" style={{ color: C.muted }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* FINAL CTA */}
      < section className="relative py-28 px-4 overflow-hidden" style={{ background: C.bgFlat }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, hsl(199 89% 48% / 0.08) 0%, transparent 65%)" }} />
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <Reveal>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
              style={{ background: C.grad, boxShadow: "0 8px 24px hsl(199 89% 48% / 0.40)" }}>
              <HeartPulse className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-5 leading-tight" style={{ color: C.text }}>
              {isPt ? (
                <>Sua saúde merece{" "}
                  <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    o melhor cuidado.
                  </span>
                </>
              ) : (
                <>Your health deserves{" "}
                  <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    the best care.
                  </span>
                </>
              )}
            </h2>
            <p className="text-xl mb-10 leading-relaxed" style={{ color: C.muted }}>
              {isPt
                ? "Não deixe para amanhã. Comece agora — é grátis e simples."
                : "Don't leave for tomorrow. Start now — it's free and simple."}
            </p>
            <button
              onClick={() => window.location.href = authUrl}
              className="group h-16 px-14 text-lg font-black text-white rounded-2xl inline-flex items-center gap-2 transition-all hover:scale-[1.04] hover:shadow-2xl active:scale-[0.97]"
              style={{ background: C.grad, boxShadow: "0 12px 40px hsl(199 89% 48% / 0.45)" }}
            >
              {isPt ? "Criar conta grátis agora" : "Create free account now"}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-4 text-sm" style={{ color: C.muted }}>
              {isPt ? "Sem cartão · 7 dias Premium incluso · Cancele quando quiser" : "No card · 7 days Premium included · Cancel anytime"}
            </p>
          </Reveal>
        </div>
      </section >

      {/* FOOTER */}
      < footer className="py-10 px-4 border-t" style={{ background: C.card, borderColor: C.border }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <img src={logo} alt="HoraMed" className="h-8 w-auto" />
            <div className="flex gap-6 text-sm" style={{ color: C.muted }}>
              <a href="/termos" className="hover:underline">{isPt ? "Termos de Uso" : "Terms of Use"}</a>
              <a href="/privacidade" className="hover:underline">{isPt ? "Privacidade" : "Privacy"}</a>
              <button onClick={() => window.location.href = authUrl} className="hover:underline">{isPt ? "Entrar" : "Login"}</button>
            </div>
          </div>
          <div className="mt-6 pt-6 text-center text-sm border-t" style={{ borderColor: C.border, color: C.muted }}>
            © {new Date().getFullYear()} HoraMed. {isPt ? "Todos os direitos reservados." : "All rights reserved."}
          </div>
        </div>
      </footer >
    </div >
  );
};

export default Landing;
