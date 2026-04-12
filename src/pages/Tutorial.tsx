import { useState, type CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Pill, Package, Folder as FolderHeart, CalendarBlank as Calendar, Bell, Camera, ShareNetwork as Share2, WarningCircle as AlertCircle, CheckCircle as CheckCircle2, ArrowRight, Gift, Users } from "@phosphor-icons/react";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type TutorialCardTheme = {
  backgroundStyle: CSSProperties;
  glowStyle: CSSProperties;
  textureStyle: CSSProperties;
  badgeClassName: string;
  iconShellClassName: string;
  stepClassName: string;
  tipClassName: string;
};

const tutorialCardThemes: Record<string, TutorialCardTheme> = {
  addMedication: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 14% 20%, rgba(16, 185, 129, 0.28), transparent 28%), radial-gradient(circle at 86% 16%, rgba(59, 130, 246, 0.14), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(236, 253, 245, 0.95) 44%, rgba(240, 253, 250, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(16, 185, 129, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(125deg, transparent 18%, rgba(255, 255, 255, 0.64) 50%, transparent 82%)",
    },
    badgeClassName: "border border-emerald-200/90 bg-emerald-500/12 text-emerald-800",
    iconShellClassName: "border border-emerald-200/80 bg-white/78 text-emerald-700",
    stepClassName: "bg-emerald-500 text-white shadow-[0_12px_24px_-12px_rgba(16,185,129,0.85)]",
    tipClassName: "border border-emerald-200/90 bg-emerald-50/90",
  },
  confirmDose: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 18% 18%, rgba(14, 165, 233, 0.24), transparent 26%), radial-gradient(circle at 90% 18%, rgba(37, 99, 235, 0.18), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.95) 52%, rgba(224, 242, 254, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(14, 165, 233, 0.42) 0%, rgba(14, 165, 233, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(135deg, transparent 12%, rgba(255, 255, 255, 0.6) 46%, transparent 82%)",
    },
    badgeClassName: "border border-sky-200/90 bg-sky-500/12 text-sky-800",
    iconShellClassName: "border border-sky-200/80 bg-white/78 text-sky-700",
    stepClassName: "bg-sky-500 text-white shadow-[0_12px_24px_-12px_rgba(14,165,233,0.85)]",
    tipClassName: "border border-sky-200/90 bg-sky-50/90",
  },
  schedule: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 16% 22%, rgba(59, 130, 246, 0.26), transparent 28%), radial-gradient(circle at 88% 12%, rgba(99, 102, 241, 0.18), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.96) 54%, rgba(238, 242, 255, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(120deg, transparent 18%, rgba(255, 255, 255, 0.58) 50%, transparent 82%)",
    },
    badgeClassName: "border border-blue-200/90 bg-blue-500/12 text-blue-800",
    iconShellClassName: "border border-blue-200/80 bg-white/78 text-blue-700",
    stepClassName: "bg-blue-500 text-white shadow-[0_12px_24px_-12px_rgba(59,130,246,0.85)]",
    tipClassName: "border border-blue-200/90 bg-blue-50/90",
  },
  stock: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 18% 20%, rgba(245, 158, 11, 0.3), transparent 28%), radial-gradient(circle at 86% 16%, rgba(249, 115, 22, 0.16), transparent 22%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 251, 235, 0.96) 50%, rgba(255, 247, 237, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(245, 158, 11, 0.44) 0%, rgba(245, 158, 11, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(130deg, transparent 22%, rgba(255, 255, 255, 0.58) 48%, transparent 78%)",
    },
    badgeClassName: "border border-amber-200/90 bg-amber-500/12 text-amber-900",
    iconShellClassName: "border border-amber-200/80 bg-white/80 text-amber-700",
    stepClassName: "bg-amber-500 text-white shadow-[0_12px_24px_-12px_rgba(245,158,11,0.88)]",
    tipClassName: "border border-amber-200/90 bg-amber-50/90",
  },
  duration: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 15% 20%, rgba(13, 148, 136, 0.26), transparent 28%), radial-gradient(circle at 88% 14%, rgba(6, 182, 212, 0.16), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 250, 0.96) 48%, rgba(236, 254, 255, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(13, 148, 136, 0.4) 0%, rgba(13, 148, 136, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(125deg, transparent 20%, rgba(255, 255, 255, 0.55) 48%, transparent 84%)",
    },
    badgeClassName: "border border-teal-200/90 bg-teal-500/12 text-teal-800",
    iconShellClassName: "border border-teal-200/80 bg-white/78 text-teal-700",
    stepClassName: "bg-teal-500 text-white shadow-[0_12px_24px_-12px_rgba(13,148,136,0.85)]",
    tipClassName: "border border-teal-200/90 bg-teal-50/90",
  },
  documents: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 18% 18%, rgba(244, 63, 94, 0.24), transparent 28%), radial-gradient(circle at 88% 14%, rgba(236, 72, 153, 0.14), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 241, 242, 0.96) 48%, rgba(253, 242, 248, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(244, 63, 94, 0.38) 0%, rgba(244, 63, 94, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(125deg, transparent 18%, rgba(255, 255, 255, 0.56) 48%, transparent 82%)",
    },
    badgeClassName: "border border-rose-200/90 bg-rose-500/12 text-rose-800",
    iconShellClassName: "border border-rose-200/80 bg-white/78 text-rose-700",
    stepClassName: "bg-rose-500 text-white shadow-[0_12px_24px_-12px_rgba(244,63,94,0.85)]",
    tipClassName: "border border-rose-200/90 bg-rose-50/90",
  },
  sharing: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 18% 20%, rgba(168, 85, 247, 0.18), transparent 26%), radial-gradient(circle at 88% 14%, rgba(59, 130, 246, 0.18), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(238, 242, 255, 0.95) 46%, rgba(239, 246, 255, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(59, 130, 246, 0.38) 0%, rgba(59, 130, 246, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(130deg, transparent 18%, rgba(255, 255, 255, 0.56) 50%, transparent 84%)",
    },
    badgeClassName: "border border-indigo-200/90 bg-indigo-500/12 text-indigo-800",
    iconShellClassName: "border border-indigo-200/80 bg-white/78 text-indigo-700",
    stepClassName: "bg-indigo-500 text-white shadow-[0_12px_24px_-12px_rgba(99,102,241,0.85)]",
    tipClassName: "border border-indigo-200/90 bg-indigo-50/90",
  },
  notifications: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 16% 20%, rgba(251, 146, 60, 0.28), transparent 26%), radial-gradient(circle at 88% 16%, rgba(250, 204, 21, 0.18), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 247, 237, 0.96) 50%, rgba(254, 252, 232, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(251, 146, 60, 0.42) 0%, rgba(251, 146, 60, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(125deg, transparent 20%, rgba(255, 255, 255, 0.6) 50%, transparent 82%)",
    },
    badgeClassName: "border border-orange-200/90 bg-orange-500/12 text-orange-900",
    iconShellClassName: "border border-orange-200/80 bg-white/80 text-orange-700",
    stepClassName: "bg-orange-500 text-white shadow-[0_12px_24px_-12px_rgba(249,115,22,0.88)]",
    tipClassName: "border border-orange-200/90 bg-orange-50/90",
  },
  referral: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 16% 20%, rgba(250, 204, 21, 0.3), transparent 28%), radial-gradient(circle at 88% 14%, rgba(249, 115, 22, 0.16), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(254, 252, 232, 0.96) 52%, rgba(255, 247, 237, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(250, 204, 21, 0.42) 0%, rgba(250, 204, 21, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(126deg, transparent 18%, rgba(255, 255, 255, 0.58) 49%, transparent 82%)",
    },
    badgeClassName: "border border-yellow-200/90 bg-yellow-500/12 text-yellow-900",
    iconShellClassName: "border border-yellow-200/80 bg-white/80 text-yellow-700",
    stepClassName: "bg-yellow-500 text-slate-900 shadow-[0_12px_24px_-12px_rgba(234,179,8,0.88)]",
    tipClassName: "border border-yellow-200/90 bg-yellow-50/90",
  },
  streak: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 16% 22%, rgba(34, 197, 94, 0.24), transparent 28%), radial-gradient(circle at 88% 14%, rgba(132, 204, 22, 0.16), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 244, 0.96) 50%, rgba(247, 254, 231, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(128deg, transparent 18%, rgba(255, 255, 255, 0.56) 50%, transparent 82%)",
    },
    badgeClassName: "border border-lime-200/90 bg-lime-500/12 text-lime-900",
    iconShellClassName: "border border-lime-200/80 bg-white/80 text-lime-700",
    stepClassName: "bg-lime-500 text-slate-900 shadow-[0_12px_24px_-12px_rgba(132,204,22,0.88)]",
    tipClassName: "border border-lime-200/90 bg-lime-50/90",
  },
  symptoms: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 18% 18%, rgba(248, 113, 113, 0.24), transparent 28%), radial-gradient(circle at 88% 14%, rgba(251, 146, 60, 0.12), transparent 22%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(254, 242, 242, 0.96) 48%, rgba(255, 247, 237, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(248, 113, 113, 0.38) 0%, rgba(248, 113, 113, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(125deg, transparent 18%, rgba(255, 255, 255, 0.55) 48%, transparent 82%)",
    },
    badgeClassName: "border border-red-200/90 bg-red-500/12 text-red-800",
    iconShellClassName: "border border-red-200/80 bg-white/80 text-red-700",
    stepClassName: "bg-red-500 text-white shadow-[0_12px_24px_-12px_rgba(239,68,68,0.85)]",
    tipClassName: "border border-red-200/90 bg-red-50/90",
  },
  report: {
    backgroundStyle: {
      backgroundImage:
        "radial-gradient(circle at 18% 18%, rgba(71, 85, 105, 0.18), transparent 28%), radial-gradient(circle at 88% 14%, rgba(6, 182, 212, 0.14), transparent 24%), linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.97) 52%, rgba(236, 254, 255, 0.9) 100%)",
    },
    glowStyle: {
      background: "radial-gradient(circle, rgba(71, 85, 105, 0.28) 0%, rgba(71, 85, 105, 0) 68%)",
    },
    textureStyle: {
      backgroundImage:
        "linear-gradient(130deg, transparent 18%, rgba(255, 255, 255, 0.6) 48%, transparent 82%)",
    },
    badgeClassName: "border border-slate-200/90 bg-slate-500/10 text-slate-800",
    iconShellClassName: "border border-slate-200/80 bg-white/80 text-slate-700",
    stepClassName: "bg-slate-700 text-white shadow-[0_12px_24px_-12px_rgba(51,65,85,0.85)]",
    tipClassName: "border border-slate-200/90 bg-slate-50/90",
  },
};

export default function Tutorial() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("inicio");

  const tutorials = [
    {
      id: "inicio",
      title: t('tutorial.firstSteps'),
      icon: CheckCircle2,
      sections: [
        {
          title: t('tutorial.addMedQ'),
          icon: Plus,
          theme: tutorialCardThemes.addMedication,
          steps: [
            t('tutorial.addMedStep1'),
            t('tutorial.addMedStep2'),
            t('tutorial.addMedStep3'),
            t('tutorial.addMedStep4'),
            t('tutorial.addMedStep5'),
            t('tutorial.addMedStep6'),
          ],
          tip: t('tutorial.addMedTip'),
        },
        {
          title: t('tutorial.confirmDoseQ'),
          icon: CheckCircle2,
          theme: tutorialCardThemes.confirmDose,
          steps: [
            t('tutorial.confirmDoseStep1'),
            t('tutorial.confirmDoseStep2'),
            t('tutorial.confirmDoseStep3'),
            t('tutorial.confirmDoseStep4'),
          ],
          tip: t('tutorial.confirmDoseTip'),
        },
      ],
    },
    {
      id: "medicamentos",
      title: t('tutorial.manageMeds'),
      icon: Pill,
      sections: [
        {
          title: t('tutorial.editScheduleQ'),
          icon: Clock,
          theme: tutorialCardThemes.schedule,
          steps: [
            t('tutorial.editScheduleStep1'),
            t('tutorial.editScheduleStep2'),
            t('tutorial.editScheduleStep3'),
            t('tutorial.editScheduleStep4'),
          ],
        },
        {
          title: t('tutorial.stockQ'),
          icon: Package,
          theme: tutorialCardThemes.stock,
          steps: [
            t('tutorial.stockStep1'),
            t('tutorial.stockStep2'),
            t('tutorial.stockStep3'),
            t('tutorial.stockStep4'),
            t('tutorial.stockStep5'),
          ],
          tip: t('tutorial.stockTip'),
        },
        {
          title: t('tutorial.durationQ'),
          icon: Calendar,
          theme: tutorialCardThemes.duration,
          steps: [
            t('tutorial.durationStep1'),
            t('tutorial.durationStep2'),
            t('tutorial.durationStep3'),
            t('tutorial.durationStep4'),
            t('tutorial.durationStep5'),
          ],
        },
      ],
    },
    {
      id: "carteira",
      title: t('tutorial.wallet'),
      icon: FolderHeart,
      sections: [
        {
          title: t('tutorial.addDocsQ'),
          icon: Camera,
          theme: tutorialCardThemes.documents,
          steps: [
            t('tutorial.addDocsStep1'),
            t('tutorial.addDocsStep2'),
            t('tutorial.addDocsStep3'),
            t('tutorial.addDocsStep4'),
            t('tutorial.addDocsStep5'),
            t('tutorial.addDocsStep6'),
          ],
        },
        {
          title: t('tutorial.shareDocQ'),
          icon: Share2,
          theme: tutorialCardThemes.sharing,
          steps: [
            t('tutorial.shareDocStep1'),
            t('tutorial.shareDocStep2'),
            t('tutorial.shareDocStep3'),
            t('tutorial.shareDocStep4'),
            t('tutorial.shareDocStep5'),
            t('tutorial.shareDocStep6'),
          ],
          tip: t('tutorial.shareDocTip'),
        },
      ],
    },
    {
      id: "notificacoes",
      title: t('tutorial.notifications'),
      icon: Bell,
      sections: [
        {
          title: t('tutorial.enableNotifQ'),
          icon: Bell,
          theme: tutorialCardThemes.notifications,
          steps: [
            t('tutorial.enableNotifStep1'),
            t('tutorial.enableNotifStep2'),
            t('tutorial.enableNotifStep3'),
            t('tutorial.enableNotifStep4'),
            t('tutorial.enableNotifStep5'),
          ],
          tip: t('tutorial.enableNotifTip'),
        },
      ],
    },
    {
      id: "recompensas",
      title: t('tutorial.rewards'),
      icon: Gift,
      sections: [
        {
          title: t('tutorial.referralQ'),
          icon: Users,
          theme: tutorialCardThemes.referral,
          steps: [
            t('tutorial.referralStep1'),
            t('tutorial.referralStep2'),
            t('tutorial.referralStep3'),
          ],
          tip: t('tutorial.referralTip'),
        },
        {
          title: t('tutorial.streakQ'),
          icon: Gift,
          theme: tutorialCardThemes.streak,
          steps: [
            t('tutorial.streakStep1'),
            t('tutorial.streakStep2'),
            t('tutorial.streakStep3'),
          ],
        },
      ],
    },
    {
      id: "sintomas",
      title: t('tutorial.symptoms'),
      icon: AlertCircle,
      sections: [
        {
          title: t('tutorial.symptomsQ'),
          icon: AlertCircle,
          theme: tutorialCardThemes.symptoms,
          steps: [
            t('tutorial.symptomsStep1'),
            t('tutorial.symptomsStep2'),
            t('tutorial.symptomsStep3'),
          ],
          tip: t('tutorial.symptomsTip'),
        },
        {
          title: t('tutorial.clinicalBriefQ'),
          icon: FileText,
          theme: tutorialCardThemes.report,
          steps: [
            t('tutorial.clinicalBriefStep1'),
            t('tutorial.clinicalBriefStep2'),
            t('tutorial.clinicalBriefStep3'),
          ],
        },
      ],
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t('tutorial.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('tutorial.subtitle')}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-3xl bg-slate-100/80 p-1.5 md:grid-cols-6">
              {tutorials.map((tutorial) => (
                <TabsTrigger
                  key={tutorial.id}
                  value={tutorial.id}
                  className="gap-2 rounded-2xl px-2 py-3 text-xs text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm sm:text-sm sm:px-3"
                >
                  <tutorial.icon className="h-4 w-4" />
                  <span className="hidden sm:inline-block leading-none truncate max-w-[80px] md:max-w-[120px]">{tutorial.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {
              tutorials.map((tutorial) => (
                <TabsContent key={tutorial.id} value={tutorial.id} className="space-y-4">
                  {tutorial.sections.map((section, idx) => (
                    <Card
                      key={idx}
                      className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-transparent shadow-[0_24px_70px_-38px_rgba(15,23,42,0.5)]"
                    >
                      <div className="absolute inset-0" style={section.theme.backgroundStyle} />
                      <div className="absolute inset-0 opacity-80" style={section.theme.textureStyle} />
                      <div
                        className="absolute -right-14 top-0 h-40 w-40 opacity-90 blur-3xl"
                        style={section.theme.glowStyle}
                      />
                      <div className="absolute inset-[1px] rounded-[27px] bg-white/78 backdrop-blur-xl" />

                      <div
                        className={cn(
                          "absolute right-5 top-5 z-10 flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_16px_36px_-24px_rgba(15,23,42,0.55)] backdrop-blur-sm",
                          section.theme.iconShellClassName,
                        )}
                        aria-hidden="true"
                      >
                        <section.icon className="h-7 w-7" />
                      </div>

                      <CardHeader className="relative z-10 space-y-4 pb-4 pr-24">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                              section.theme.badgeClassName,
                            )}
                          >
                            {tutorial.title}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <CardTitle className="text-xl leading-tight text-slate-900">
                          {section.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-5">
                        <ol className="relative space-y-4">
                          <div className="absolute bottom-3 left-4 top-3 w-px bg-slate-200/90" aria-hidden="true" />
                          {section.steps.map((step, stepIdx) => (
                            <li key={stepIdx} className="relative flex items-start gap-4">
                              <span
                                className={cn(
                                  "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
                                  section.theme.stepClassName,
                                )}
                              >
                                {stepIdx + 1}
                              </span>
                              <span className="pt-1 text-sm leading-6 text-slate-700">{step}</span>
                            </li>
                          ))}
                        </ol>

                        {section.tip && (
                          <div className={cn("rounded-2xl p-4", section.theme.tipClassName)}>
                            <div className="flex gap-3">
                              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-700" />
                              <p className="text-sm leading-6 text-slate-700">
                                <strong className="text-slate-900">{t('tutorial.tip')}</strong> {section.tip}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              ))
            }
          </Tabs >

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{t('tutorial.stillHaveQuestions')}</h3>
                  <p className="text-sm text-muted-foreground">{t('tutorial.visitHelp')}</p>
                </div>
                <Button onClick={() => navigate("/ajuda")}>
                  {t('tutorial.helpBtn')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div >
      </div >
      <Navigation />
    </>
  );
}
