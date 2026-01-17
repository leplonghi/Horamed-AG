import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface UseVoiceInputOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

type SpeechRecognitionType = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
};

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: SpeechRecognitionType; webkitSpeechRecognition?: SpeechRecognitionType }).SpeechRecognition || 
                              (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionType }).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('Web Speech API not supported in this browser');
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const SpeechRecognition = (window as unknown as { SpeechRecognition?: SpeechRecognitionType; webkitSpeechRecognition?: SpeechRecognitionType }).SpeechRecognition || 
                                (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionType }).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        toast.error('Reconhecimento de voz não suportado neste navegador');
        options.onError?.('Web Speech API not supported');
        return;
      }

      // Request microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch {
        toast.error('Não foi possível acessar o microfone');
        options.onError?.('Microphone access denied');
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = options.language || 'pt-BR';

      let finalTranscript = '';
      let interimTranscript = '';

      recognition.onstart = () => {
        setIsRecording(true);
        setIsProcessing(false);
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentText = (finalTranscript + interimTranscript).trim();
        if (currentText) {
          setTranscription(currentText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Erro no reconhecimento de voz';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Permissão de microfone negada';
            break;
          case 'no-speech':
            errorMessage = 'Nenhuma fala detectada';
            break;
          case 'network':
            errorMessage = 'Erro de conexão';
            break;
          case 'aborted':
            // User aborted, no need to show error
            return;
        }
        
        toast.error(errorMessage);
        options.onError?.(event.error);
        setIsRecording(false);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(false);
        
        const finalText = finalTranscript.trim();
        if (finalText) {
          setTranscription(finalText);
          options.onTranscription?.(finalText);
        }
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
      };

      recognition.start();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao iniciar gravação';
      toast.error('Não foi possível iniciar o reconhecimento de voz');
      options.onError?.(errorMessage);
      setIsRecording(false);
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      setIsProcessing(true);
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const clearTranscription = useCallback(() => {
    setTranscription('');
  }, []);

  return {
    isRecording,
    isProcessing,
    transcription,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscription,
  };
}
