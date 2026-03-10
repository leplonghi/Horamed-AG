import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { addDocument, setDocument, serverTimestamp } from "@/integrations/firebase";
import { toast } from "sonner";
import { Check, Star, Heart, Bug, Lightning as Zap, Clock, Package, Brain, ShieldCheck, ThumbsUp, ThumbsDown, SmileyMeh as Meh, SmileySad as Frown, Smiley as Smile } from "@phosphor-icons/react";

interface FeedbackQuestProps {
    onComplete: () => void;
    isOpen: boolean;
}

const questions = [
    {
        id: "impact",
        title: "O HoraMed te ajudou a lembrar?",
        icon: <Clock className="w-8 h-8 text-blue-500" />,
        options: [
            { label: "Sim, não esqueço mais!", value: "success", icon: <Star className="w-5 h-5 text-yellow-500" /> },
            { label: "Ajudou bastante", value: "partial", icon: <Check className="w-5 h-5 text-green-500" /> },
            { label: "Mais ou menos", value: "neutral", icon: <Meh className="w-5 h-5 text-slate-400" /> },
            { label: "Não ajudou", value: "fail", icon: <Frown className="w-5 h-5 text-red-500" /> },
        ]
    },
    {
        id: "usability",
        title: "Cadastrar remédios foi...",
        icon: <Zap className="w-8 h-8 text-yellow-500" />,
        options: [
            { label: "Super Rápido", value: "fast", icon: <Zap className="w-5 h-5 text-yellow-500" /> },
            { label: "Fácil", value: "easy", icon: <ThumbsUp className="w-5 h-5 text-blue-500" /> },
            { label: "Complicado", value: "hard", icon: <ThumbsDown className="w-5 h-5 text-red-500" /> },
        ]
    },
    {
        id: "favorite",
        title: "O que você mais curtiu?",
        icon: <Heart className="w-8 h-8 text-red-500" />,
        options: [
            { label: "Alarmes", value: "alarms", icon: <Clock className="w-5 h-5" /> },
            { label: "Estoque", value: "stock", icon: <Package className="w-5 h-5" /> },
            { label: "Gamificação", value: "game", icon: <Star className="w-5 h-5" /> },
            { label: "IA Clara", value: "ai", icon: <Brain className="w-5 h-5" /> },
        ]
    },
    {
        id: "stability",
        title: "O App travou alguma vez?",
        icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
        options: [
            { label: "Não, rodou liso", value: "stable", icon: <Check className="w-5 h-5 text-green-500" /> },
            { label: "Sim, travou", value: "crashed", icon: <Bug className="w-5 h-5 text-red-500" /> },
            { label: "Achei lento", value: "slow", icon: <Clock className="w-5 h-5 text-orange-500" /> },
        ]
    },
    {
        id: "nps",
        title: "Indicaria para um amigo?",
        icon: <Star className="w-8 h-8 text-teal-500" />,
        options: [
            { label: "Com certeza!", value: "promoter", icon: <Heart className="w-5 h-5 text-red-500" /> },
            { label: "Talvez", value: "neutral", icon: <Meh className="w-5 h-5" /> },
            { label: "Acho que não", value: "detractor", icon: <Frown className="w-5 h-5" /> },
        ]
    }
];

export default function FeedbackQuest({ onComplete, isOpen }: FeedbackQuestProps) {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSelect = (value: string) => {
        const currentQuestion = questions[step];
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));

        // Auto advance
        if (step < questions.length - 1) {
            setTimeout(() => setStep(s => s + 1), 250);
        } else {
            setStep(s => s + 1); // Move to final comment step
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            // 1. Save Feedback
            await addDocument("feedbacks", {
                userId: user.uid,
                answers,
                comment,
                timestamp: serverTimestamp(),
                appVersion: "1.0.0", // TODO: Get real version
                platform: "web",
                campaign: "feedback_quest"
            });

            // 2. Unlock Premium Reward
            await setDocument(`users/${user.uid}/profile`, "me", {
                feedbackCompleted: true,
                subscriptionStatus: 'premium',
                premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
            }, true);

            // 3. Victory!
            toast.success("Premium Liberado! Obrigado pelo feedback. 🎉");
            onComplete();

        } catch (error) {
            console.error("Error submitting feedback:", error);
            toast.error("Erro ao salvar feedback. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const progress = ((step) / (questions.length + 1)) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md"
            >
                <Card className="overflow-hidden border-2 border-primary/20 bg-white/95 backdrop-blur shadow-2xl">
                    {/* Header Progress */}
                    <div className="h-2 bg-slate-100">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-teal-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {step < questions.length ? (
                                <motion.div
                                    key={`step-${step}`}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center space-y-4">
                                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                                            {questions[step].icon}
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800">
                                            {questions[step].title}
                                        </h2>
                                    </div>

                                    <div className="grid gap-3">
                                        {questions[step].options.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleSelect(option.value)}
                                                className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-primary/50 hover:bg-blue-50 transition-all active:scale-[0.98] text-left group"
                                            >
                                                <span className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                    {option.icon}
                                                </span>
                                                <span className="font-medium text-slate-700">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="final"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="space-y-6 text-center"
                                >
                                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                                        <Star className="w-10 h-10 text-green-600" />
                                    </div>

                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-slate-900">Última coisa!</h2>
                                        <p className="text-slate-600">
                                            Se você pudesse mudar uma única coisa no app, o que seria? (Opcional)
                                        </p>
                                    </div>

                                    <Textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Sinto falta de..."
                                        className="min-h-[100px] border-slate-200 focus:border-primary"
                                    />

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-teal-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                                    >
                                        {isSubmitting ? "Ativando Premium..." : "Finalizar e Ganhar Premium 🎁"}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
