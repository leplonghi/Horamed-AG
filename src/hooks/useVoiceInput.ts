// Re-export AI-powered voice input as the default
export { useVoiceInputAI as useVoiceInput } from './useVoiceInputAI';

// Also export the native Web Speech API version for fallback
export { useVoiceInputNative } from './useVoiceInputNative';
