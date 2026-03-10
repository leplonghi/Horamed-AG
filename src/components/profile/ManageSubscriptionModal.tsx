
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import { functions } from "@/integrations/firebase/client";
import { httpsCallable } from "firebase/functions";

import { motion, AnimatePresence } from "framer-motion";
import { Spinner as Loader2, Warning as AlertTriangle, Gift, CheckCircle, XCircle } from "@phosphor-icons/react";
import { PRICING } from "@/lib/stripeConfig";

interface ManageSubscriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Step = 'overview' | 'warning' | 'offer' | 'canceled' | 'claimed';

export default function ManageSubscriptionModal({ open, onOpenChange }: ManageSubscriptionModalProps) {
    const { t } = useTranslation();
    const { subscription, daysLeft } = useSubscription();
    const [step, setStep] = useState<Step>('overview');
    const [loading, setLoading] = useState(false);

    const handleApplyOffer = async () => {
        setLoading(true);
        try {
            const applyRetentionOffer = httpsCallable(functions, 'applyRetentionOffer');
            await applyRetentionOffer();
            setStep('claimed');
            toast.success(t('plans.offerApplied'));
        } catch (error: any) {
            toast.error(t('common.error'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        setLoading(true);
        try {
            const cancelSubscription = httpsCallable(functions, 'cancelSubscription');
            await cancelSubscription();
            setStep('canceled');
            toast.success(t('plans.subscriptionCanceled'));
        } catch (error: any) {
            toast.error(t('common.error'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        onOpenChange(false);
        setTimeout(() => setStep('overview'), 300);
    };

    return (
        <Dialog open={open} onOpenChange={reset}>
            <DialogContent className="sm:max-w-md overflow-hidden">
                <AnimatePresence mode="wait">

                    {/* STEP 1: OVERVIEW */}
                    {step === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <DialogHeader>
                                <DialogTitle>{t('plans.manageSubscription')}</DialogTitle>
                                <DialogDescription>{t('plans.manageDesc')}</DialogDescription>
                            </DialogHeader>

                            <div className="bg-muted/50 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('plans.currentPlan')}</span>
                                    <span className="font-semibold text-primary">Premium</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('plans.status')}</span>
                                    <span className="text-green-600 font-medium">{t('plans.active')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('plans.renewal')}</span>
                                    <span>{daysLeft} {t('profile.daysRemaining')}</span>
                                </div>

                                {subscription?.discountApplied && (
                                    <div className="flex justify-between items-center text-sm text-green-600 bg-green-500/10 p-2 rounded-lg border border-green-500/20 mt-2">
                                        <span className="flex items-center gap-1.5 font-medium"><Gift className="h-3.5 w-3.5" /> Desconto Ativo</span>
                                        <span className="font-bold">{subscription.discountPercent}% OFF</span>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex-col sm:justify-between gap-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    {t('common.close')}
                                </Button>
                                <div className="flex flex-col gap-2 w-full sm:flex-row">
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={async () => {
                                            setLoading(true);
                                            try {
                                                const createPortal = httpsCallable(functions, 'createCustomerPortal');
                                                const { data }: any = await createPortal({ returnUrl: window.location.href });
                                                if (data.url) window.location.href = data.url;
                                            } catch (error) {
                                                toast.error(t('plans.portalError'));
                                                console.error(error);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('plans.manageBilling')}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-0 w-full"
                                        onClick={() => setStep('warning')}
                                        disabled={loading}
                                    >
                                        {t('plans.cancelSubscription')}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </motion.div>
                    )}

                    {/* STEP 2: WARNING */}
                    {step === 'warning' && (
                        <motion.div
                            key="warning"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex flex-col items-center text-center space-y-2 pt-4">
                                <div className="p-3 bg-red-100 rounded-full text-red-600 mb-2">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold">{t('plans.areYouSure')}</h3>
                                <p className="text-sm text-muted-foreground max-w-[280px]">
                                    {t('plans.loseBenefitsWarning')}
                                </p>
                            </div>

                            <ul className="space-y-2 text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl">
                                <li className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400" /> {t('plans.noMoreAI')}</li>
                                <li className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400" /> {t('plans.limitedMeds')}</li>
                                <li className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400" /> {t('plans.adsReturn')}</li>
                            </ul>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setStep('overview')}>
                                    {t('plans.keepPlan')}
                                </Button>
                                <Button variant="destructive" className="flex-1" onClick={() => setStep('offer')}>
                                    {t('plans.confirmCancel')}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: FOMO OFFER */}
                    {step === 'offer' && (
                        <motion.div
                            key="offer"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-6 pt-4 text-center"
                        >
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                <Gift className="h-16 w-16 text-primary relative z-10 mx-auto" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                                    {t('plans.waitForIt')}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {t('plans.retentionOfferText')}
                                </p>

                                {(() => {
                                    const isAnnual = subscription?.interval === 'year';
                                    const isUSD = subscription?.currency === 'usd';
                                    const config = isUSD ? PRICING.usd : PRICING.brl;
                                    const originalPrice = isAnnual ? config.annual : config.monthly;
                                    const period = isAnnual ? (isUSD ? 'year' : 'ano') : (isUSD ? 'mo' : 'mês');
                                    const symbol = config.symbol;
                                    const discountedPrice = originalPrice * 0.85;

                                    return (
                                        <div className="py-4 bg-primary/5 rounded-xl border border-primary/10 mb-4">
                                            <div className="text-sm text-muted-foreground mb-1">
                                                {t('plans.discountDetails')}
                                            </div>
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="text-muted-foreground line-through text-lg decoration-red-500/50">
                                                    {symbol} {originalPrice.toFixed(2).replace('.', ',')}
                                                </div>
                                                <div className="text-3xl font-bold text-primary">
                                                    {symbol} {discountedPrice.toFixed(2).replace('.', ',')}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                                                /{period} • {t('plans.validFor12Months')}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full bg-gradient-to-r from-primary to-teal-600 hover:opacity-90 transition-opacity h-12 text-lg"
                                    onClick={handleApplyOffer}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : t('plans.claimDiscount')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-destructive text-xs"
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    {t('plans.rejectAndCancel')}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: CLAIMED */}
                    {step === 'claimed' && (
                        <motion.div
                            key="claimed"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center text-center space-y-4 py-8"
                        >
                            <div className="p-4 bg-green-100 rounded-full text-green-600">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-green-700">{t('plans.offerClaimed')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('plans.offerClaimedDesc')}
                            </p>
                            <Button className="mt-4" onClick={reset}>
                                {t('common.great')}
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 5: CANCELED */}
                    {step === 'canceled' && (
                        <motion.div
                            key="canceled"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center text-center space-y-4 py-8"
                        >
                            <div className="p-4 bg-muted rounded-full text-muted-foreground">
                                <XCircle className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-semibold">{t('plans.subscriptionCanceled')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('plans.canceledDesc', { date: String(daysLeft || 0) })}
                            </p>
                            <Button variant="outline" className="mt-4" onClick={reset}>
                                {t('common.close')}
                            </Button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
