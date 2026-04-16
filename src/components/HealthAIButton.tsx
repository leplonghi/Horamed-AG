import { useState, useEffect, useMemo, useRef } from "react";
import { X, PaperPlaneRight as Send, Camera, Microphone, Sparkle as Sparkles, PlusCircle, Image as ImageIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHealthAgent } from "@/hooks/useHealthAgent";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import FloatingActionHub from "./FloatingActionHub";
import { cn } from "@/lib/utils";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";

// Clara avatar loaded via URL to reduce bundle size
const claraAvatarUrl = "/images/clara.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

export default function HealthAIButton() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [hasUnreadSuggestion, setHasUnreadSuggestion] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { shouldReduceEffects } = useDeviceCapability();
  
  const {
    processQuery,
    isProcessing
  } = useHealthAgent();
  const location = useLocation();

  // Initialize welcome message with translation
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: t('clara.welcomeMessage'),
        id: 'welcome'
      }]);
    }
  }, [t, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: shouldReduceEffects ? 'auto' : 'smooth'
        });
      }
    }
  }, [messages, isProcessing, shouldReduceEffects]);

  // Dynamic quick suggestions based on time of day
  const quickSuggestions = useMemo(() => {
    const hour = new Date().getHours();
    const baseSuggestions = [
      t('clara.addMed'),
      t('clara.myProgress'),
      t('clara.whereStock'),
      t('clara.howWallet'),
    ];

    const contextual: string[] = [];
    if (hour < 10) {
      contextual.push(language === 'pt' ? "O que devo tomar pela manhã?" : "What should I take in the morning?");
    } else if (hour >= 12 && hour < 14) {
      contextual.push(language === 'pt' ? "Quais remédios tomo com comida?" : "Which meds do I take with food?");
    } else if (hour >= 20) {
      contextual.push(language === 'pt' ? "Posso tomar todos os da noite juntos?" : "Can I take all my night meds together?");
    }

    return [...contextual, ...baseSuggestions].slice(0, 4);
  }, [t, language]);

  // Listen for external open events
  useEffect(() => {
    const handleOpenClara = () => setIsOpen(true);
    window.addEventListener('openClara', handleOpenClara);
    return () => window.removeEventListener('openClara', handleOpenClara);
  }, []);

  // Hide on auth and onboarding pages
  const hiddenRoutes = ["/auth", "/onboarding", "/"];
  const shouldHide = hiddenRoutes.some(route =>
    route === "/" ? location.pathname === "/" : location.pathname.startsWith(route)
  );
  if (shouldHide) return null;

  const handleSend = async (message?: string) => {
    const userMessage = (message || input).trim();
    if (!userMessage || isProcessing) return;

    setInput("");
    setShowSuggestions(false);
    
    const newUserMsg: Message = {
      role: "user",
      content: userMessage,
      id: Date.now().toString()
    };
    
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const response = await processQuery(userMessage);
      if (typeof response === 'string') {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: response,
          id: (Date.now() + 1).toString()
        }]);
      }
    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: t('clara.errorMessage'),
        id: (Date.now() + 2).toString()
      }]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleOpenAssistant = () => {
    setIsOpen(true);
    setHasUnreadSuggestion(false);
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Logic to process file would go here
      // For now, redirect to scan page or inform Clara
      setIsOpen(false);
      navigate("/scan");
    }
  };

  return (
    <>
      <FloatingActionHub
        onOpenAssistant={handleOpenAssistant}
        isAssistantOpen={isOpen}
        hasUnreadSuggestion={hasUnreadSuggestion}
      />

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={cameraInputRef}
        onChange={handleCameraCapture}
      />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with stronger blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className={cn(
                "fixed inset-0 bg-background/40 z-[60]",
                shouldReduceEffects ? "backdrop-blur-none bg-background/60" : "backdrop-blur-md"
              )}
            />
            
            <motion.div
              initial={shouldReduceEffects ? { opacity: 0, y: 20 } : { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={shouldReduceEffects ? { opacity: 0, y: 20 } : { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
              transition={shouldReduceEffects ? { duration: 0.2 } : { type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-[10%] md:inset-auto md:bottom-24 md:right-6 z-[70] md:w-[420px] md:max-w-[calc(100vw-3rem)] md:h-[650px]"
            >
              <Card className={cn(
                "overflow-hidden h-full flex flex-col border-primary/20 shadow-2xl rounded-t-[2.5rem] md:rounded-[2rem]",
                !shouldReduceEffects && "glass-card"
              )}>
                
                {/* Premium Header */}
                <div className="bg-gradient-to-br from-primary/10 via-background/50 to-background p-5 pb-4 shrink-0 border-b border-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div 
                          className={cn(
                            "w-12 h-12 rounded-2xl overflow-hidden ring-4 ring-primary/20 shadow-lg",
                            !shouldReduceEffects && "animate-pulse" // Simple way to indicate life, or remove
                          )}
                        >
                          <img src={claraAvatarUrl} alt="Clara" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full ring-2 ring-green-500/20" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground tracking-tight">Clara AI</h3>
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{t('clara.assistant') || "Online"}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-all"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6">
                  <div className="space-y-6">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={shouldReduceEffects ? { opacity: 0 } : { opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.2, delay: shouldReduceEffects ? 0 : idx * 0.05 }}
                        className={cn(
                          "flex w-full mb-1",
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div className={cn(
                          "max-w-[82%] relative p-4",
                          msg.role === 'user' ? 'bubble-user' : 'bubble-clara'
                        )}>
                          {msg.role === 'assistant' && (
                            <div className="absolute -top-6 left-0 flex items-center gap-1 opacity-40">
                              <Sparkles className="h-3 w-3 text-primary" weight="fill" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">HoraMed AI</span>
                            </div>
                          )}
                          <p className="text-[15px] leading-[1.6] whitespace-pre-wrap font-book">
                            {msg.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isProcessing && (
                      <div className="flex justify-start pt-2">
                        <div className="bg-card border border-primary/10 rounded-2xl rounded-tl-none p-4 shadow-sm">
                          <div className="flex gap-1.5 items-center h-4">
                            {[0, 0.2, 0.4].map((delay, i) => (
                              <motion.span 
                                key={i}
                                animate={shouldReduceEffects ? { opacity: [0.3, 1, 0.3] } : { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                                transition={{ duration: 1, repeat: Infinity, delay }}
                                className="w-1.5 h-1.5 bg-primary rounded-full" 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom padding for scroll visibility */}
                  <div className="h-4" />
                </ScrollArea>

                {/* Suggestions and Input Fixed for premium feel */}
                <div className={cn(
                  "p-4 border-t border-primary/5 space-y-4",
                  shouldReduceEffects ? "bg-background" : "bg-background/80 backdrop-blur-xl"
                )}>
                  {/* Suggestion Chips */}
                  {showSuggestions && (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-2">
                      <AnimatePresence>
                        {quickSuggestions.map((suggestion, idx) => (
                          <motion.button
                            key={idx}
                            initial={shouldReduceEffects ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={shouldReduceEffects ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                            whileHover={shouldReduceEffects ? {} : { scale: 1.05 }}
                            whileTap={shouldReduceEffects ? {} : { scale: 0.95 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="whitespace-nowrap px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
                          >
                            <Sparkles className="h-3 w-3" />
                            {suggestion}
                          </motion.button>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Input Bar */}
                  <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-3xl border border-primary/10 focus-within:border-primary/30 transition-all shadow-inner">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 text-primary hover:bg-primary/10 rounded-full"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="h-5 w-5" weight="bold" />
                    </Button>
                    
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder={t('clara.typeMessage')}
                      disabled={isProcessing}
                      className="border-none bg-transparent focus-visible:ring-0 px-1 text-[15px]"
                    />
                    
                    <motion.div
                      animate={shouldReduceEffects ? {} : { scale: input.trim() ? 1 : 0.9 }}
                    >
                      <Button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isProcessing}
                        size="icon"
                        className="h-10 w-10 rounded-full bg-primary text-white shadow-lg disabled:opacity-50 disabled:bg-muted"
                      >
                        <Send className="h-5 w-5" weight="fill" />
                      </Button>
                    </motion.div>
                  </div>
                  
                  <p className="text-[10px] text-center text-muted-foreground/60 font-medium">
                    Clara AI utiliza tecnologia HoraMed Intelligence para suporte à saúde.
                  </p>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
