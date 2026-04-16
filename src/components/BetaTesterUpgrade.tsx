import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkle as Sparkles, HandHeart as HeartHandshake, Confetti as PartyPopper } from "@phosphor-icons/react";
import { motion, AnimatePresence } from 'framer-motion';

import { BETA_TESTER_EMAILS } from '@/config/betaTesters';

export function BetaTesterUpgrade() {
    const { user } = useAuth();
    const { subscription, refresh } = useSubscription();
    const [showModal, setShowModal] = useState(false);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        const checkAndUpgrade = async () => {
            // 1. Check if user matches and is logged in
            if (!user || !user.email || !BETA_TESTER_EMAILS.includes(user.email.toLowerCase())) {
                return;
            }

            // 2. Check if already upgraded to avoid infinite loops or unnecessary writes
            // We look for a specific flag or just check if they are already premium without expiration
            const isAlreadyLifetime =
                subscription?.planType === 'premium' &&
                subscription?.expiresAt === null &&
                subscription?.priceVariant === 'LIFETIME_GIFT';

            if (isAlreadyLifetime) {
                return;
            }

            // 3. Prevent double execution
            if (upgrading) return;

            // 4. Perform Upgrade
            setUpgrading(true);
            try {
                const subscriptionRef = doc(db, 'users', user.uid, 'subscription', 'current');

                await setDoc(subscriptionRef, {
                    planType: 'premium',
                    status: 'active',
                    startedAt: new Date().toISOString(),
                    expiresAt: null, // Lifetime
                    priceVariant: 'LIFETIME_GIFT',
                    trialUsed: true,
                    updatedAt: serverTimestamp(),
                    createdAt: subscription?.createdAt || new Date().toISOString(),
                    stripeCustomerId: subscription?.stripeCustomerId || null,
                    stripeSubscriptionId: null, // No Stripe subscription for this
                });

                // 5. Show Success Modal
                await refresh(); // Refresh context
                setShowModal(true);
                trackUpgradeEvent();
            } catch (error) {
                console.error('Failed to apply beta tester upgrade:', error);
            } finally {
                setUpgrading(false);
            }
        };

        checkAndUpgrade();
    }, [user, subscription, upgrading, refresh]);

    const trackUpgradeEvent = () => {
        // Optional: Analytics tracking here
    };

    return (
        <AnimatePresence>
            {showModal && (
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-b from-background to-primary/5">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {/* Confetti effect using simple CSS animations or just static decor */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10">
                                <div className="absolute top-10 left-10 text-4xl animate-bounce">🎉</div>
                                <div className="absolute top-20 right-10 text-4xl animate-pulse">✨</div>
                                <div className="absolute bottom-10 left-20 text-4xl animate-bounce delay-700">🎈</div>
                                <div className="absolute bottom-20 right-20 text-4xl animate-pulse delay-300">🎀</div>
                            </div>
                        </div>

                        <DialogHeader className="space-y-4 flex flex-col items-center text-center z-10">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-500 flex items-center justify-center shadow-lg mb-2 ring-4 ring-yellow-100">
                                <Crown className="h-10 w-10 text-white" />
                            </div>

                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                                Parabéns, Beta Tester!
                            </DialogTitle>

                            <div className="space-y-2 text-center">
                                <p className="text-muted-foreground">
                                    Como forma de agradecimento por nos ajudar a construir o <span className="font-semibold text-primary">HoraMed</span>,
                                    liberamos um presente especial para você:
                                </p>

                                <div className="py-4 px-6 bg-card border rounded-xl shadow-sm my-4 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                                    <div className="flex items-center justify-center space-x-2 text-xl font-bold text-primary">
                                        <Sparkles className="h-5 w-5 text-yellow-500" />
                                        <span>Premium Vitalício</span>
                                        <Sparkles className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Acesso ilimitado para sempre. Sem mensalidades.</p>
                                </div>

                                <p className="text-sm text-balance">
                                    Você agora tem acesso a relatórios avançados, IA ilimitada, gestão familiar e muito mais.
                                    Obrigado por fazer parte da nossa história! 🚀
                                </p>
                            </div>
                        </DialogHeader>

                        <DialogFooter className="sm:justify-center z-10 mt-4">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md hover:shadow-xl transition-all"
                                onClick={() => setShowModal(false)}
                            >
                                <HeartHandshake className="mr-2 h-5 w-5" />
                                Aceitar Presente
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
