import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, X, Volume2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { processVoiceCommand, speak, VoiceAction } from '@/ai/voiceCommandProcessor';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';

interface VoiceControlButtonProps {
  className?: string;
  onAction?: (action: VoiceAction) => void;
  onAssistantQuery?: (query: string) => void;
  floating?: boolean;
}

export default function VoiceControlButton({
  className,
  onAction,
  onAssistantQuery,
  floating = false
}: VoiceControlButtonProps) {
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [intelligentMode, setIntelligentMode] = useState(false);

  // Handle Intelligent Results (from Gemini Backend)
  const handleSmartCommand = async (data: any) => {
    console.log('🧠 AI Smart Command:', data);
    setIntelligentMode(true);

    const intent = data.intent;
    const spokenResponse = intent?.spokenResponse || "Comando processado.";

    setFeedbackText(spokenResponse);
    setShowFeedback(true);

    setIsSpeaking(true);
    await speak(spokenResponse);
    setIsSpeaking(false);

    if (intent?.action_path) {
      navigate(intent.action_path);
    } else if (intent?.type === 'ADD_MEDICATION') {
      navigate('/adicionar', { state: { prefillName: intent.entities?.medication } });
    } else if (intent?.type === 'CHECK_STOCK') {
      navigate('/estoque');
    } else if (intent?.type === 'HEALTH_QUERY') {
      navigate('/saude');
    }

    // Execute the action callback
    if (onAction) {
      onAction({
        type: intent?.type || 'UNKNOWN',
        ...intent
      } as VoiceAction);
    }

    setTimeout(() => setShowFeedback(false), 4000);
  };

  // Handle Simple Transcription (Native / Fallback)
  const handleTranscription = async (text: string) => {
    // If we just handled a smart command, ignore plain text fallback to avoid double processing
    if (intelligentMode) {
      setIntelligentMode(false);
      return;
    }

    console.log('Voice transcription:', text);

    const result = processVoiceCommand(text);
    console.log('Processed command (Regex):', result);

    setFeedbackText(result.spokenResponse);
    setShowFeedback(true);

    // Speak the response
    setIsSpeaking(true);
    await speak(result.spokenResponse);
    setIsSpeaking(false);

    // Execute the action
    executeAction(result.action);

    // Hide feedback after a delay
    setTimeout(() => setShowFeedback(false), 3000);
  };

  const executeAction = (action: VoiceAction) => {
    onAction?.(action);

    switch (action.type) {
      case 'NAVIGATE':
        navigate(action.path);
        break;

      case 'ADD_MEDICATION':
        navigate('/adicionar', {
          state: { prefillName: action.name }
        });
        break;

      case 'MARK_DOSE_TAKEN':
        toast.success('Dose marcada como tomada');
        break;

      case 'SKIP_DOSE':
        toast.info('Dose pulada');
        break;

      case 'CHECK_STOCK':
        navigate('/estoque');
        break;

      case 'OPEN_SEARCH':
        document.dispatchEvent(new CustomEvent('open-spotlight-search'));
        break;

      case 'OPEN_ASSISTANT':
        onAssistantQuery?.(action.query);
        break;

      case 'UNKNOWN':
        toast.error('Comando não reconhecido');
        break;
    }
  };

  const {
    isRecording,
    isProcessing,
    toggleRecording,
    stream // Now available from useVoiceInputAI
  } = useVoiceInput({
    onTranscription: handleTranscription,
    onCommandResult: handleSmartCommand, // New intelligent handler
    onError: (error) => {
      toast.error(`Erro: ${error}`);
    }
  });

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const isActive = isRecording || isProcessing;

  if (floating) {
    return (
      <>
        {/* Floating button */}
        <motion.div
          className={cn(
            "fixed z-50",
            className || "bottom-24 right-4"
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Button
            size="lg"
            onClick={toggleRecording}
            disabled={isProcessing}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all duration-300 border-2",
              isRecording && "animate-pulse bg-red-500 hover:bg-red-600 border-red-300",
              isProcessing && "bg-indigo-600 hover:bg-indigo-700 border-indigo-400", // New "Thinking" color
              !isActive && "bg-primary hover:bg-primary/90 border-transparent"
            )}
          >
            {isProcessing ? (
              <Sparkles className="h-6 w-6 animate-spin text-white" /> // Sparkles for AI
            ) : isRecording ? (
              <MicOff className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          {/* Recording indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full"
              >
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Feedback overlay */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-44 left-4 right-4 z-50 flex justify-center"
            >
              <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center">
                <div className="flex flex-col items-center gap-3">
                  {isSpeaking && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                      <Volume2 className="relative h-8 w-8 text-blue-400 animate-pulse" />
                    </div>
                  )}
                  <p className="text-lg font-medium text-white/90 leading-relaxed">
                    "{feedbackText}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen Recording Overlay with Visualizer */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={toggleRecording} // Click anywhere to stop
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-red-900/20 pointer-events-none" />

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-md aspect-square flex items-center justify-center"
              >
                {/* The Dynamic Visualizer */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <VoiceVisualizer stream={stream as MediaStream} isRecording={isRecording} />
                </div>

                <div className="relative z-10 text-center mt-60 pointer-events-none">
                  <p className="text-2xl font-bold text-white drop-shadow-lg mb-2">
                    Estou ouvindo...
                  </p>
                  <p className="text-white/70 text-sm">
                    Toque para enviar
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing State Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
            >
              <div className="bg-white/10 p-8 rounded-full backdrop-blur-md shadow-2xl border border-white/20">
                <Sparkles className="h-12 w-12 text-indigo-400 animate-spin" />
              </div>
              <p className="mt-4 text-white font-medium animate-pulse">Processando com Gemini AI...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Non-floating inline button
  return (
    <Button
      variant={isActive ? "destructive" : "outline"}
      size="icon"
      onClick={toggleRecording}
      disabled={isProcessing}
      className={cn(
        "transition-all duration-300",
        isRecording && "animate-pulse",
        className
      )}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
