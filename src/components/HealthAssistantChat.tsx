import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Heart, PaperPlaneRight as Send, X, Spinner as Loader2, Sparkle as Sparkles } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAILimits } from "@/hooks/useAILimits";
import { PremiumPaywall } from "./PremiumPaywall";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { auth, fetchCollection, where, functions, httpsCallable } from "@/integrations/firebase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface HealthAssistantChatProps {
  onClose?: () => void;
}

export default function HealthAssistantChat({ onClose }: HealthAssistantChatProps = {}) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiLimits = useAILimits();
  // Initialize greeting message with translation
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: t('chat.greeting'),
      }]);
    }
  }, [t, messages.length]);

  const quickChips = [
    t('chat.organizeRoutine'),
    t('chat.viewStock'),
    t('chat.doseQuestion'),
    t('chat.adjustSchedules')
  ];

  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build medication context to personalise Clara's responses
      let userMedications = '';
      const user = auth.currentUser;
      if (user) {
        const { data: meds } = await fetchCollection<{ name: string; doseText?: string; dose_text?: string }>(
          `users/${user.uid}/medications`,
          [where('isActive', '==', true)]
        );
        if (meds && meds.length > 0) {
          userMedications = meds
            .map(m => `${m.name}${m.doseText || m.dose_text ? ` (${m.doseText || m.dose_text})` : ''}`)
            .join(', ');
        }
      }

      const callHealthAssistant = httpsCallable<object, { response: string; rateLimitExceeded?: boolean }>(
        functions, 'healthAssistant'
      );
      const result = await callHealthAssistant({
        messages: [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        userMedications,
      });

      if (result.data.rateLimitExceeded) {
        toast.error(t('chat.rateLimitError'));
        setIsLoading(false);
        return;
      }

      const assistantContent = result.data.response || t('chat.fallbackResponse');

      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);

      await aiLimits.recordAIUsage({
        message_length: userMessage.length,
        response_length: assistantContent.length,
      });



    } catch (error) {
      console.error("Chat error:", error);
      toast.error(t('chat.messageError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!aiLimits.canUseAI) {
      setShowPaywall(true);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    await streamChat(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <>
      <Card className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[600px] h-[100dvh] w-full rounded-none sm:rounded-2xl shadow-2xl z-[100] flex flex-col animate-in slide-in-from-bottom-2 sm:zoom-in-95 duration-200 border-0 sm:border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shrink-0 sm:pt-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-primary-foreground/20">
              <img
                src="/images/clara.jpg"
                alt="Clara"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Clara</h3>
              <p className="text-xs opacity-80">{t('chat.assistant')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* AI Limit Warning (Free users) */}
        {!aiLimits.isPremium && !aiLimits.isLoading && (
          <Alert className="mx-2 mt-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 shrink-0">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-xs">
              {aiLimits.canUseAI ? (
                <span>
                  {t('chat.youHave')} <strong>{aiLimits.remainingToday}</strong> {t('chat.of')} {aiLimits.dailyLimit} {t('chat.queriesRemaining')}
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  {t('chat.dailyLimitReached')}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-3 sm:p-4 min-h-0" ref={scrollRef}>
          <div className="space-y-3 sm:space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end pl-12" : "justify-start pr-12"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

          </div>
        </ScrollArea>

        {/* Quick Chips */}
        <div className="px-2 sm:px-4 py-3 border-t shrink-0 bg-muted/20">
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x px-2 sm:px-0">
            {quickChips.map((chip, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="shrink-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-xs px-3 py-1.5 rounded-full snap-start font-medium bg-background border shadow-sm"
                onClick={() => setInput(chip)}
              >
                {chip}
              </Badge>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t shrink-0 bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2 items-end">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={aiLimits.canUseAI ? t('chat.placeholder') : t('chat.limitReached')}
              disabled={isLoading || !aiLimits.canUseAI}
              className="flex-1 text-base sm:text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !aiLimits.canUseAI}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <PremiumPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="ai"
      />
    </>
  );
}
