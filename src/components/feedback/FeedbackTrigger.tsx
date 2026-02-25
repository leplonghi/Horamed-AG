import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDocument } from "@/integrations/firebase";
import FeedbackQuest from "./FeedbackQuest";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

export default function FeedbackTrigger() {
    const { user } = useAuth();
    const [showQuest, setShowQuest] = useState(false);

    useEffect(() => {
        const checkEligibility = async () => {
            if (!user) return;

            try {
                // 1. Check Profile (Already feedback'd?)
                const { data: profile } = await fetchDocument<any>(`users/${user.uid}/profile`, 'me');
                if (profile?.feedbackCompleted) return;

                // 2. Check Timing (e.g., 4 days since creation)
                if (user.metadata.creationTime) {
                    const creationDate = safeDateParse(user.metadata.creationTime);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - creationDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Logic: Show on Day 4 onwards
                    // Also check for debug param to force show: ?debug_feedback=true
                    const isDebug = new URLSearchParams(window.location.search).has("debug_feedback");

                    if (diffDays >= 4 || isDebug) {
                        setShowQuest(true);
                    }
                }
            } catch (err) {
                console.error("Error checking feedback eligibility:", err);
            }
        };

        checkEligibility();
    }, [user]);

    if (!showQuest) return null;

    return <FeedbackQuest isOpen={showQuest} onComplete={() => setShowQuest(false)} />;
}
