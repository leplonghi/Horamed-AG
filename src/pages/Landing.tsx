import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import logo from "@/assets/logo_HoraMed.png";
import heroBg from "@/assets/landing-hero-bg-new.png";
import appScreenHoje from "@/assets/app-screen-hoje.png";
import appScreenRotina from "@/assets/app-screen-rotina.png";
import appScreenPerfil from "@/assets/app-screen-perfil.png";
import { 
  Bell, FileText, Users, Shield, Brain, DeviceMobile as Smartphone, 
  Star, Check, ArrowRight, Camera, Heartbeat as HeartPulse, Trophy, 
  Pill, CaretDown as ChevronDown, Lock, Clock, Heartbeat as Activity, 
  CalendarCheck, Sparkle as Sparkles, CheckCircle as CheckCircle2, 
  TrendUp as TrendingUp, Stethoscope, ChatCircle as MessageCircle, 
  Syringe, Heart, Alarm, BookBookmark 
} from "@phosphor-icons/react";
import { getAuthRedirectUrl } from "@/lib/domainConfig";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { PRICING, BRL_COUNTRIES } from "@/lib/stripeConfig";

/* ─── Design tokens — azul real do app ───────────────────────────── */
const C = {
  primary: "hsl(199 89% 48%)",
  primaryDark: "hsl(199 89% 38%)",
  primaryLight: "hsl(199 89% 94%)",
  grad: "linear-gradient(135deg, hsl(199 89% 48%), hsl(207 89% 58%))",
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

/* ─── Section reveal ─────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
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

function PhoneCarousel({ autoPlay = true }: { autoPlay?: boolean }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if(!autoPlay) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % APP_SCREENS.length), 3200);
    return () => clearInterval(t);
  }, [autoPlay]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Phone shell */}
      <div
        className="relative rounded-[2.8rem] overflow-hidden border-[6px] border-white shadow-2xl w-[240px] sm:w-[270px] bg-slate-50"
        style={{ boxShadow: "0 40px 100px rgba(41,171,226,0.25), 0 8px 24px rgba(0,0,0,0.12)" }}
      >
        {/* Status bar imitation */}
        <div className="flex items-center justify-between px-5 py-2 bg-white absolute top-0 left-0 right-0 z-10">
          <span className="text-[10px] font-semibold text-slate-400">09:41</span>
          <div className="w-14 h-4 rounded-full bg-slate-900" />
          <span className="text-[10px] text-slate-400">100%</span>
        </div>
        {/* Actual app screenshot — animated carousel */}
        <div className="relative overflow-hidden w-full" style={{ aspectRatio: "9/19" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={APP_SCREENS[current].src}
              alt={APP_SCREENS[current].label}
              className="absolute inset-0 w-full h-full object-cover object-top pt-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            />
          </AnimatePresence>
        </div>
        {/* Home indicator */}
        <div className="flex justify-center items-center py-2 bg-white absolute bottom-0 left-0 right-0 z-10">
          <div className="w-24 h-1 rounded-full bg-slate-300" />
        </div>
      </div>
      {/* Dots */}
      <div className="flex gap-1.5 mt-5">
        {APP_SCREENS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? "24px" : "6px",
              background: i === current ? C.primary : "hsl(215 16% 78%)"
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
      className={`relative rounded-[2.5rem] overflow-hidden border-[6px] border-white bg-slate-50 ${className}`}
      style={{
        boxShadow: "0 30px 80px rgba(41,171,226,0.18), 0 8px 24px rgba(0,0,0,0.08)",
        aspectRatio: "9/19"
      }}
    >
        <div className="flex items-center justify-between px-5 py-2 bg-white absolute top-0 left-0 right-0 z-10">
          <span className="text-[10px] font-semibold text-slate-400">09:41</span>
          <div className="w-14 h-4 rounded-full bg-slate-900" />
          <span className="text-[10px] text-slate-400">100%</span>
        </div>
      <img src={src} alt={alt} className="w-full h-full object-cover object-top pt-8" />
      <div className="flex justify-center items-center py-2 bg-white absolute bottom-0 left-0 right-0 z-10">
        <div className="w-24 h-1 rounded-full bg-slate-300" />
      </div>
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
  const isPt = language === "pt";

  /* testimonials */
  const testimonials = isPt ? [
    { name: "Lucas M.", role: "Usa para si mesmo", avatar: "L", bg: C.primary, content: "Tomo 3 medicamentos diários para tireoide e pressão. Antes esquecia direto. Com o HoraMed, minha adesão chegou a 100%. É literalmente transformador.", rating: 5 },
    { name: "Maria Helena", role: "Cuida dos pais idosos", avatar: "M", bg: "hsl(152 60% 42%)", content: "Minha mãe tem 78 anos e toma 6 medicamentos com horários diferentes. Agora tenho paz de saber que ela está cuidada, sem ligar 3 vezes por dia.", rating: 5 },
    { name: "Roberto S.", role: "Paciente cardíaco", avatar: "R", bg: "hsl(0 65% 52%)", content: "Depois do infarto, perder uma dose pode custar a vida. O HoraMed me dá essa segurança todo dia. É como ter um enfermeiro 24h no bolso.", rating: 5 },
    { name: "Dra. Fernanda", role: "Cardiologista", avatar: "F", bg: "hsl(38 92% 50%)", content: "Recomendo para todos os meus pacientes. A adesão ao tratamento melhora visivelmente. Já vi casos em que o HoraMed evitou internações e unificou o prontuário.", rating: 5 },
  ] : [
    { name: "Lucas M.", role: "Uses for himself", avatar: "L", bg: C.primary, content: "I take 3 daily meds for thyroid and blood pressure. I used to forget constantly. With HoraMed, my adherence reached 100%. It's life-changing.", rating: 5 },
    { name: "Mary H.", role: "Cares for elderly parents", avatar: "M", bg: "hsl(152 60% 42%)", content: "My mom is 78 and takes 6 medications at different times. Now I have peace of mind without calling 3 times a day.", rating: 5 },
    { name: "Robert S.", role: "Heart patient", avatar: "R", bg: "hsl(0 65% 52%)", content: "After my heart attack, missing a dose can cost your life. HoraMed gives me that security every day. It's like having a nurse 24/7 in my pocket.", rating: 5 },
    { name: "Dr. Fernanda", role: "Cardiologist", avatar: "F", bg: "hsl(38 92% 50%)", content: "I recommend it to all my patients. Medication adherence improves visibly. I've seen cases where HoraMed prevented hospitalizations by merging data.", rating: 5 },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen overflow-x-hidden font-sans" style={{ background: C.bgFlat }}>
      <ScrollProgress />
      <SEOHead
        title={isPt ? "HoraMed — O Ecossistema Completo da sua Saúde" : "HoraMed — Your Complete Health Ecosystem"}
        description={isPt
          ? "Muito além de um lembrete. O HoraMed integra sua rotina de medicamentos, exames, consulta com médicos, IA Clara e saúde familiar em um só lugar."
          : "Far beyond a pill reminder. HoraMed integrates your medication routine, exams, doctor visits, Clara AI, and family health in one place."}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ background: "rgba(240,248,255,0.92)", backdropFilter: "blur(16px)", borderColor: C.border }}
      >
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <img src={logo} alt="HoraMed" className="h-9 w-auto" />
            <span className="font-extrabold text-[#0DAEED] tracking-tight text-xl hidden sm:block">HoraMed</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => window.location.href = authUrl}
              className="hidden sm:block h-9 px-4 text-sm font-semibold rounded-xl transition-all hover:bg-slate-100"
              style={{ color: C.text }}
            >
              {isPt ? "Entrar" : "Login"}
            </button>
            <button
              onClick={() => window.location.href = authUrl}
              className="h-9 px-5 text-sm font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md flex gap-2 items-center"
              style={{ background: C.grad, boxShadow: "0 4px 14px hsl(199 89% 48% / 0.4)" }}
            >
              {isPt ? "Começar Grátis" : "Start Free"}
              <ArrowRight weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} onMouseMove={onHeroMouseMove} className="relative min-h-[92vh] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="HoraMed Health Management"
            className="w-full h-full object-cover"
            style={{ filter: "blur(6px) brightness(1.08) saturate(0.9)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, hsl(204 90% 95% / 0.95) 0%, hsl(199 89% 48% / 0.05) 40%, hsl(210 60% 98% / 0.90) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-20 pb-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* LEFT: Copy */}
            <div className="text-center lg:text-left pt-6 pb-4">
              <Reveal>
                <div 
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wide shadow-sm uppercase"
                  style={{ background: "white", color: C.primary, border: `1px solid hsl(199 89% 48% / 0.2)` }}
                >
                  <Sparkles className="h-4 w-4" weight="fill" />
                  {isPt ? "Muito mais que um alarme de remédios" : "Much more than a pill reminder"}
                </div>

                <h1
                  className="text-[2.75rem] sm:text-6xl lg:text-[4.2rem] font-black tracking-tight leading-[1.05] mb-6"
                  style={{ color: C.text }}
                >
                  {isPt ? (
                    <>
                      O ecossistema<br />
                      da sua <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>saúde</span>.
                    </>
                  ) : (
                    <>
                      The ecosystem<br />
                      of your <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>health</span>.
                    </>
                  )}
                </h1>

                <p
                  className="text-lg sm:text-xl leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0 font-medium"
                  style={{ color: C.muted }}
                >
                  {isPt
                    ? "Organize seus tratamentos, guarde histórico de eventos e exames, converse com a IA Clara e acesse a sua rede de médicos. Em um único lugar."
                    : "Organize treatments, keep history of events and exams, talk to Clara AI and access your healthcare providers. All in one place."}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <MagneticBtn
                    onClick={() => window.location.href = authUrl}
                    className="group h-14 px-8 text-base font-bold text-white rounded-2xl flex items-center justify-center gap-2"
                    style={{ background: C.grad, boxShadow: "0 10px 30px hsl(199 89% 48% / 0.45)" }}
                  >
                    {isPt ? "Experimentar gratuitamente" : "Try it out for free"}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" weight="bold" />
                  </MagneticBtn>
                  <MagneticBtn
                    onClick={() => window.location.href = authUrl}
                    className="h-14 px-8 text-base font-bold rounded-2xl flex items-center justify-center gap-2 border-[1.5px] transition-all hover:bg-slate-50"
                    style={{ color: C.primary, borderColor: "hsl(199 89% 48% / 0.3)", background: "white" }}
                  >
                    <Smartphone className="h-5 w-5" weight="bold" />
                    {isPt ? "Acessar Plataforma" : "Access Platform"}
                  </MagneticBtn>
                </div>

                <div className="flex items-center gap-3 justify-center lg:justify-start mt-10">
                  <div className="flex -space-x-2">
                    {[C.primary, C.success, "hsl(38 92% 50%)", "hsl(0 65% 52%)", "hsl(215 60% 60%)"].map((bg, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: bg }}>
                         {["L", "M", "R", "F", "P"][i]}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: C.muted }}>
                  {isPt ? (
                    <>Mais de <span style={{ color: C.primary, fontWeight: 800 }}><Counter to={2500} suffix="+" /> rotinas</span> geradas.</>
                  ) : (
                    <>Over <span style={{ color: C.primary, fontWeight: 800 }}><Counter to={2500} suffix="+" /> routines</span> created.</>
                  )}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* RIGHT: Main Phone visual */}
            <div className="flex items-center justify-center relative perspective-1000 mt-10 lg:mt-0">
              <div className="absolute inset-0 pointer-events-none z-0"
                style={{ background: "radial-gradient(ellipse at center, hsl(199 89% 48% / 0.15) 0%, transparent 60%)", filter: "blur(60px)" }} />

              <motion.div
                initial={{ opacity: 0, y: 30, rotateY: 15, rotateX: 5 }}
                animate={{ opacity: 1, y: 0, rotateY: 0, rotateX: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                style={{ x: phoneX, y: phoneY }}
                className="relative z-10 drop-shadow-2xl"
              >
                {/* Floating IA Bubble */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.5, type: "spring" }}
                  className="absolute -left-12 top-20 z-20 flex items-center gap-3 rounded-[1.2rem] px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.12)] border"
                  style={{ background: C.card, borderColor: C.border }}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, hsl(199 89% 48%), hsl(152 60% 42%))" }}>
                    <Brain className="h-5 w-5 text-white" weight="fill"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight mb-0.5" style={{ color: C.text }}>{isPt ? "Clara AI" : "Clara AI"}</p>
                    <p className="text-xs font-medium" style={{ color: C.muted }}>{isPt ? "Rotina médica atualizada." : "Medical routine updated."}</p>
                  </div>
                </motion.div>

                {/* Floating Event Bubble */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3, duration: 0.5, type: "spring" }}
                  className="absolute -right-8 bottom-28 z-20 flex items-center gap-3 rounded-[1.2rem] px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.12)] border"
                  style={{ background: C.card, borderColor: C.border }}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, hsl(245 60% 55%), hsl(245 60% 45%))" }}>
                    <Stethoscope className="h-5 w-5 text-white" weight="fill"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight mb-0.5" style={{ color: C.text }}>{isPt ? "Consulta" : "Appointment"}</p>
                    <p className="text-xs font-medium" style={{ color: C.muted }}>{isPt ? "Dr. Rafael amanhã" : "Dr. Rafael tomorrow"}</p>
                  </div>
                </motion.div>

                {/* Carrossel App */}
                <PhoneCarousel autoPlay={true} />

              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          BENTO GRID: "NOT JUST A REMINDER"
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-4 relative z-20 border-t" style={{ background: C.card, borderColor: C.border }}>
        <div className="container mx-auto max-w-6xl">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>
              {isPt ? "Funcionalidades Principais" : "Core Features"}
            </p>
            <h2 className="text-3xl lg:text-5xl font-black mb-6 leading-tight" style={{ color: C.text }}>
              {isPt ? "Muito mais do que\num simples lembrete." : "Much more than a\nsimple pill reminder."}
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: C.muted }}>
              {isPt 
                ? "O HoraMed integra a gestão de medicamentos, exames, histórico e provedores num ecossistema completo." 
                : "HoraMed integrates medication management, exams, history and healthcare providers in a complete ecosystem."}
            </p>
          </Reveal>

          {/* Bento UI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
            
            {/* Bento Item 1 - IA Clara */}
            <Reveal delay={0} className="md:col-span-2 relative p-8 sm:p-10 rounded-[2rem] overflow-hidden border shadow-sm group" style={{ background: "#f8fbff", borderColor: C.border }}>
              <div className="absolute right-0 bottom-0 opacity-[0.03] translate-x-1/4 translate-y-1/4 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-12">
                <Brain weight="fill" size={320} color={C.primary} />
              </div>
              <div className="relative z-10 max-w-md">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md" style={{ background: C.grad }}>
                  <Brain size={28} weight="fill" color="white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-4 text-slate-800">{isPt ? "Conheça a Clara. Sua nova assistente." : "Meet Clara. Your AI assistant."}</h3>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                  {isPt 
                  ? "A Clara tira dúvidas sobre bulas de forma segura, orienta sobre interações medicamentosas de risco e alerta imediatamente se você esquecer uma dose importante."
                  : "Clara safely answers questions about medication leaflets, guides you through risky drug interactions, and immediately alerts you if you miss an important dose."}
                </p>
              </div>
            </Reveal>

            {/* Bento Item 2 - Meds */}
            <Reveal delay={0.1} className="relative p-8 sm:p-10 rounded-[2rem] overflow-hidden border shadow-sm group" style={{ background: "#fff", borderColor: C.border }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-emerald-100 text-emerald-600 shadow-sm">
                <Pill size={28} weight="fill" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-800">{isPt ? "Rotina Inteligente" : "Smart Routine"}</h3>
              <p className="text-base text-slate-500 font-medium leading-relaxed relative z-10">
                {isPt 
                ? "Lembretes com haptics e voz. Controle seu estoque e saiba quando visitar a farmácia antes que o remédio acabe." 
                : "Reminders with haptics and voice. Track your inventory and know when to visit the pharmacy before you run out."}
              </p>
              <div className="absolute -right-4 -bottom-4 opacity-[0.05] transition-transform duration-700 ease-out group-hover:scale-110">
                <Alarm weight="fill" size={160} className="text-emerald-500" />
              </div>
            </Reveal>

            {/* Bento Item 3 - Carteira & Exames */}
            <Reveal delay={0.2} className="relative p-8 sm:p-10 rounded-[2rem] overflow-hidden border shadow-sm group" style={{ background: "#fff", borderColor: C.border }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-indigo-100 text-indigo-600 shadow-sm">
                <BookBookmark size={28} weight="fill" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-800">{isPt ? "Carteira Médica" : "Medical Wallet"}</h3>
              <p className="text-base text-slate-500 font-medium leading-relaxed relative z-10">
                {isPt 
                ? "Armazene as receitas médicas, arquive exames em PDF e crie o seu histórico oficial consolidado no seu bolso." 
                : "Store prescriptions securely, archive PDF exam results and create your official health history in your pocket."}
              </p>
              <div className="absolute -left-6 -bottom-6 opacity-[0.05] transition-transform duration-700 ease-out group-hover:scale-110">
                <FileText size={180} weight="fill" className="text-emerald-600" />
              </div>
            </Reveal>

            {/* Bento Item 4 - Eventos e Medicos */}
            <Reveal delay={0.3} className="md:col-span-2 relative p-8 sm:p-10 rounded-[2rem] overflow-hidden border shadow-sm bg-slate-900 group">
              <div className="absolute inset-0 z-0">
                <div className="absolute w-full h-full opacity-60 transition-opacity duration-700 group-hover:opacity-100" style={{ background: "radial-gradient(circle at right bottom, hsl(199 89% 48% / 0.5) 0%, transparent 70%)" }} />
              </div>
              <div className="relative z-10 flex flex-col justify-center h-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-slate-800 text-white shadow-md border border-slate-700">
                  <Stethoscope size={28} weight="fill" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-4 text-white leading-tight">{isPt ? "Seus Médicos e Eventos." : "Your Doctors & Events."}</h3>
                <p className="text-base sm:text-lg text-slate-300 max-w-lg font-medium leading-relaxed">
                  {isPt 
                  ? "Crie sua própria rede de provedores (Hospitais, Especialistas e Farmácias). Associe médicos aos seus eventos (consultas e exames)." 
                  : "Create your own network of providers (Hospitals, Specialists and Pharmacies). Link doctors to your medical events."}
                </p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-[0.1] translate-x-1/4 translate-y-1/4 transition-transform duration-700 ease-out group-hover:scale-110">
                <Stethoscope weight="fill" size={320} color="white" />
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FAMILY / CARETAKER FEATURE OVERVIEW
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-4" style={{ background: C.bgFlat }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center flex-col-reverse lg:flex-row">
            
            <Reveal className="flex justify-center relative lg:order-1 order-2">
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, hsl(152 60% 42% / 0.15) 0%, transparent 70%)", filter: "blur(30px)" }} />
              <PhoneFrame src={appScreenPerfil} alt="HoraMed Perfil e Família" />
            </Reveal>

            <div className="lg:order-2 order-1">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase mb-6 shadow-sm border border-emerald-100" style={{ background: "hsl(152 60% 42% / 0.1)", color: "hsl(152 60% 35%)" }}>
                  <Users size={16} weight="fill"/>
                  {isPt ? "Para quem precisa de ajuda" : "For those who need help"}
                </div>
                <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight" style={{ color: C.text }}>
                  {isPt ? "Não cuide da sua família sozinho." : "Don't care for your family alone."}
                </h2>
                <p className="text-lg mb-10 font-medium" style={{ color: C.muted }}>
                  {isPt 
                  ? "Adicione dependentes, como pais idosos ou filhos. Monitore os remédios que seus pais tomam na casa deles, diretamente pelo seu aplicativo. Nunca mais ligue preocupado." 
                  : "Add dependents, like elderly parents or children. Monitor the meds your parents take at their house from your app. Never call them out of worry again."}
                </p>

                <ul className="space-y-6">
                  {[
                    { title: isPt ? "Múltiplos Perfis Familiares" : "Multi-Profiles", desc: isPt ? "Alterne entre os registros de saúde de quem você cuida com apenas 1 clique." : "Switch between loved ones' health records with 1 click." },
                    { title: isPt ? "Histórico de Vacinas" : "Unified Logging", desc: isPt ? "Carteiras de vacina de todas as crianças seguras e disponíveis a qualquer hora." : "Kids' vaccine cards secured and available anytime." },
                    { title: isPt ? "Rede Compartilhada" : "Shared Network", desc: isPt ? "Tenha acesso imediato aos médicos e telefones de emergência dos seus pais." : "Instant access to your parents' doctors and emergency contacts." },
                  ].map((s, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-emerald-100 text-emerald-600">
                        <Check size={20} weight="bold" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg mb-0.5">{s.title}</h4>
                        <p className="text-base font-medium text-slate-500 leading-relaxed">{s.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-4 border-t" style={{ background: C.card, borderColor: C.border }}>
        <div className="container mx-auto max-w-4xl">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.primary }}>
              {isPt ? "O que dizem" : "What they say"}
            </p>
            <h2 className="text-3xl sm:text-5xl font-black" style={{ color: C.text }}>
              {isPt ? "Vidas transformadas." : "Quality of life restored."}
            </h2>
          </Reveal>

          <div className="relative" style={{ minHeight: "260px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                <div className="rounded-[2rem] p-8 sm:p-10 border h-full shadow-sm" style={{ background: C.bgFlat, borderColor: C.border }}>
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) =>
                      <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xl sm:text-2xl leading-relaxed mb-8 font-semibold text-slate-700">
                    "{testimonials[activeTestimonial].content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm"
                      style={{ background: testimonials[activeTestimonial].bg }}>
                      {testimonials[activeTestimonial].avatar}
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-800">{testimonials[activeTestimonial].name}</p>
                      <p className="text-sm text-slate-500 font-medium">{testimonials[activeTestimonial].role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex gap-2 mt-72 sm:mt-64 justify-center">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: i === activeTestimonial ? "32px" : "8px", background: i === activeTestimonial ? C.primary : "hsl(215 16% 80%)" }}
                aria-label={`Show testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA / FINAL
      ═══════════════════════════════════════════════ */}
      <section className="relative py-28 px-4 overflow-hidden border-t" style={{ background: C.card, borderColor: C.border }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center top, hsl(199 89% 48% / 0.05) 0%, transparent 65%)" }} />
        <div className="container mx-auto max-w-4xl text-center relative z-10 flex flex-col items-center">
          <Reveal>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] mb-8"
              style={{ background: C.grad, boxShadow: "0 10px 30px hsl(199 89% 48% / 0.40)" }}>
              <HeartPulse className="h-10 w-10 text-white" weight="fill" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight text-slate-800">
              {isPt ? (
                <>Sua saúde merece <br />
                  <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    o melhor cuidado.
                  </span>
                </>
              ) : (
                <>Your health deserves <br />
                  <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    the best care.
                  </span>
                </>
              )}
            </h2>
            <p className="text-xl mb-10 leading-relaxed font-medium text-slate-500 max-w-2xl mx-auto">
              {isPt
                ? "Dê o primeiro passo para uma vida mais organizada. Cadastre seus medicamentos, adicione seus médicos provedores e conheça a IA Clara."
                : "Take the first step to an organized life. Register routines, meet Clara AI, and manage your entire family in HoraMed."}
            </p>
            <button
              onClick={() => window.location.href = authUrl}
              className="group h-16 px-12 text-lg font-black text-white rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98] mx-auto w-full sm:w-auto"
              style={{ background: C.grad, boxShadow: "0 14px 40px hsl(199 89% 48% / 0.45)" }}
            >
              <Smartphone weight="fill" size={24} />
              {isPt ? "Começar Agora Gratuitamente" : "Start Now For Free"}
            </button>
            <p className="mt-6 text-sm font-semibold text-slate-400">
              {isPt ? "Sem cartão de crédito · Completamente grátis" : "No credit card required · Completely free"}
            </p>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 border-t" style={{ background: C.bgFlat, borderColor: C.border }}>
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <img src={logo} alt="HoraMed" className="h-8 w-auto grayscale opacity-70" />
               <span className="font-bold text-slate-400 text-lg">HoraMed</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm font-semibold text-slate-500">
              <a href="/termos" className="hover:text-slate-800 transition-colors">{isPt ? "Termos de Uso" : "Terms of Use"}</a>
              <a href="/privacidade" className="hover:text-slate-800 transition-colors">{isPt ? "Privacidade" : "Privacy"}</a>
              <button onClick={() => window.location.href = authUrl} className="hover:text-slate-800 transition-colors">{isPt ? "Entrar na sua conta" : "Login to account"}</button>
            </div>
          </div>
          <div className="mt-8 pt-8 text-center text-sm border-t" style={{ borderColor: C.border, color: C.muted }}>
            © {new Date().getFullYear()} HoraMed. {isPt ? "Nenhum dado é vendido. Construído por e para pacientes." : "No data is sold. Built by and for patients."}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
