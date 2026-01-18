import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseVoiceInputAIOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

export function useVoiceInputAI(options: UseVoiceInputAIOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone permission for AI transcription...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });
      
      streamRef.current = stream;
      console.log('Microphone permission granted');

      // Reset state
      audioChunksRef.current = [];
      setTranscription('');

      // Determine best supported format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      console.log('Using MIME type:', mimeType || 'default');

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, processing audio...');
        setIsRecording(false);
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorder.mimeType || 'audio/webm' 
          });
          
          console.log('Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);

          if (audioBlob.size < 1000) {
            toast.info('Áudio muito curto. Tente falar por mais tempo.');
            setIsProcessing(false);
            return;
          }

          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              console.log('Audio converted to base64, length:', base64Audio.length);

              // Call edge function
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { 
                  audio: base64Audio, 
                  mimeType: audioBlob.type 
                }
              });

              if (error) {
                console.error('Edge function error:', error);
                throw new Error(error.message || 'Erro na transcrição');
              }

              if (data?.text) {
                console.log('Transcription received:', data.text);
                setTranscription(data.text);
                options.onTranscription?.(data.text);
                toast.success('Voz transcrita com IA!', { duration: 1500 });
                
                // Haptic feedback
                if (navigator.vibrate) {
                  navigator.vibrate([50, 50, 50]);
                }
              } else if (data?.error) {
                throw new Error(data.error);
              } else {
                toast.info('Não foi possível entender o áudio. Tente novamente.');
              }
            } catch (err) {
              console.error('Transcription error:', err);
              const errorMessage = err instanceof Error ? err.message : 'Erro na transcrição';
              toast.error(errorMessage);
              options.onError?.(errorMessage);
            } finally {
              setIsProcessing(false);
            }
          };

          reader.readAsDataURL(audioBlob);
        } catch (err) {
          console.error('Audio processing error:', err);
          setIsProcessing(false);
          toast.error('Erro ao processar áudio');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        setIsProcessing(false);
        toast.error('Erro na gravação');
      };

      // Start recording with timeslice for periodic data
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      console.log('Recording started');
      toast.info('Ouvindo... Fale agora', { duration: 2000 });
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Erro ao iniciar gravação';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissão de microfone negada';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Microfone não encontrado';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      options.onError?.(errorMessage);
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    console.log('Stopping AI recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      streamRef.current = null;
    }
  }, []);

  const toggleRecording = useCallback(() => {
    console.log('Toggle AI recording, current state:', isRecording);
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
    isSupported: true, // MediaRecorder is widely supported
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscription,
  };
}
