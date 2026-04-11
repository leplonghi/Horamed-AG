import { useVoiceInputAI } from "./useVoiceInputAI";
import { useVoiceInputNative } from "./useVoiceInputNative";

/**
 * Native voice input:
 * - Uses native Web Speech API for zero-cost transcription directly in the browser.
 * - AI integration (MediaRecorder + backend) is disabled to avoid costs and improve reliability on mobile devices.
 */
export function useVoiceInput(options: Parameters<typeof useVoiceInputNative>[0] = {}) {
  // Always use the native free Web Speech API
  const native = useVoiceInputNative(options);

  return native;
}

export { useVoiceInputAI, useVoiceInputNative };
