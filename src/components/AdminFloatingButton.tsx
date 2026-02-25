import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/services/AdminService";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminFloatingButton() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdmin = async () => {
            if (user) {
                const adminStatus = await AdminService.isAdmin(user.uid);
                setIsAdmin(adminStatus);
            }
        };
        checkAdmin();
    }, [user]);

    if (!isAdmin || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed bottom-24 right-6 z-50 flex flex-col gap-2"
            >
                <Button
                    onClick={() => navigate("/internal/campaign-generator")}
                    className="h-14 w-14 rounded-full bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-lg shadow-teal-500/50 hover:shadow-xl hover:shadow-teal-500/60 transition-all"
                    size="icon"
                    title="Campaign Generator (App)"
                >
                    <Rocket className="w-6 h-6 text-white" />
                </Button>

                <Button
                    onClick={() => window.open("https://app.horamed.net/internal/campaign-generator", "_blank")}
                    className="h-14 w-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/60 transition-all"
                    size="icon"
                    title="Campaign Generator (Online)"
                >
                    <ExternalLink className="w-6 h-6 text-white" />
                </Button>

                <Button
                    onClick={() => setIsVisible(false)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300"
                >
                    <X className="w-4 h-4" />
                </Button>
            </motion.div>
        </AnimatePresence>
    );
}
