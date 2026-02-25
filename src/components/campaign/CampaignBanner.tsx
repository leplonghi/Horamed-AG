import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Clock, ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDocument } from "@/integrations/firebase";
import FeedbackQuest from "@/components/feedback/FeedbackQuest";

export default function CampaignBanner() {
    const { user } = useAuth();
    const [showBanner, setShowBanner] = useState(false);
    const [daysLeft, setDaysLeft] = useState(0);
    const [showQuest, setShowQuest] = useState(false);
    const [campaignType, setCampaignType] = useState("");

    useEffect(() => {
        const checkStatus = async () => {
            if (!user) return;

            try {
                const { data: profile } = await fetchDocument<any>(`users/${user.uid}/profile`, 'me');

                // Only show if user came from a campaign and hasn't completed feedback
                if (profile?.campaignSource && profile.campaignSource !== 'organic' && !profile.feedbackCompleted) {

                    // Calculate days left of the 7-day trial before lock
                    const creationTime = new Date(user.metadata.creationTime || Date.now());
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - creationTime.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const remaining = 7 - diffDays;

                    if (remaining >= 0) {
                        setDaysLeft(remaining);
                        setCampaignType(profile.campaignSource);
                        setShowBanner(true);
                    }
                }
            } catch (e) {
                console.error("Error checking campaign banner:", e);
            }
        };

        checkStatus();
    }, [user]);

    if (!showBanner) return null;

    return (
        <>
            <div className="px-4 pt-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 p-4 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 p-1 bg-amber-200 rounded-bl-lg">
                            <Crown className="w-4 h-4 text-amber-700" />
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-100 rounded-full hidden sm:block">
                                <Lock className="w-6 h-6 text-amber-600" />
                            </div>

                            <div className="flex-1 space-y-1">
                                <h4 className="font-bold text-amber-900 flex items-center gap-2">
                                    Missão Beta Ativa
                                    <span className="text-xs font-normal px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">
                                        {daysLeft} dias restantes
                                    </span>
                                </h4>
                                <p className="text-sm text-amber-700 leading-relaxed">
                                    Você ganhou <strong>7 dias</strong> de teste. Responda nossa pesquisa rápida para desbloquear o restante do seu prêmio (Premium/Vitalício).
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => setShowQuest(true)}
                            size="sm"
                            className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-none"
                        >
                            Desbloquear Agora <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Card>
                </motion.div>
            </div>

            <FeedbackQuest isOpen={showQuest} onComplete={() => {
                setShowQuest(false);
                setShowBanner(false);
            }} />
        </>
    );
}
