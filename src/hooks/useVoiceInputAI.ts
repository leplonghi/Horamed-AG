import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';

interface UseVoiceInputAIOptions {
  onTranscription?: (text: string) => void;
  onCommandResult?: (result: any) => void; // Support for intelligent result
  onError?: (error: string) => void;
  language?: string;
}

export function useVoiceInputAI(options: UseVoiceInputAIOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const dispatchError = (message: string) => {
    toast.error(message);
    options.onError?.(message);
  };

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone permission for AI transcription...');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
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

      const mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
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

              // Call cloud function
              const voiceToText = httpsCallable(functions, 'voiceToText');
              const result = await voiceToText({
                audio: base64Audio,
                mimeType: audioBlob.type,
                mode: 'intelligent' // Hint for backend to use smart mode
              });
              const data = result.data as any;

              if (data?.text || data?.intent) {
                // Handle simple text or structured intelligent response
                const text = data.text || data.intent?.spokenResponse;
                setTranscription(text);

                if (options.onCommandResult && data.intent) {
                  options.onCommandResult(data);
                } else if (options.onTranscription) {
                  options.onTranscription(text);
                }

                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
              } else if (data?.error) {
                throw new Error(data.error);
              } else {
                dispatchError('Não foi possível entender. Tente novamente.');
              }
            } catch (err) {
              console.error('Transcription error:', err);
              const errorMessage = err instanceof Error ? err.message : 'Erro na transcrição';
              dispatchError(errorMessage);
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

      mediaRecorder.start(1000);
      setIsRecording(true);

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);

    } catch (error) {
      console.error('Error starting recording:', error);
      let errorMessage = 'Erro ao iniciar gravação';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatchError(errorMessage);
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
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

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
    stream,
    isSupported: true,
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscription,
  };
}
