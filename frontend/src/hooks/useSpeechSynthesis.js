import { useState, useCallback, useEffect, useRef } from 'react';
import { isGameAudioPlaying } from '../utils/soundEffects';

// تحويل بيانات الصوت (PCM) القادمة من Gemini إلى ملف صوتي قابل للتشغيل (WAV)
const pcmToWav = (pcmData, sampleRate = 24000) => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.byteLength;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const pcmView = new Uint8Array(pcmData);
    const targetView = new Uint8Array(buffer, 44);
    targetView.set(pcmView);

    return new Blob([buffer], { type: 'audio/wav' });
};

export const useSpeechSynthesis = () => {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const currentAudioRef = useRef(null);
  const speakGenerationRef = useRef(0);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSupported(true);
      
      // Load voices (some browsers load them asynchronously)
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback(async (text, options = {}) => {
    if (!supported || !text) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (options.respectGameAudio !== false && isGameAudioPlaying()) return;

    const generation = speakGenerationRef.current + 1;
    speakGenerationRef.current = generation;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    window.speechSynthesis.cancel();

    // Try ElevenLabs TTS first
    try {
        const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error("No ElevenLabs API Key found in env");

        // We use a simple fetch instead of installing new packages to keep the app fast
        // Voice ID 'JBFqnCBsd6RMkjVDRZzb' is used here, you can change it to any Arabic voice ID from ElevenLabs
        const url = `https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ElevenLabs TTS Failed: ${errorText}`);
        }

        const audioBlob = await response.blob();
        if (speakGenerationRef.current !== generation) return;
        if (options.respectGameAudio !== false && isGameAudioPlaying()) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        audio.onended = () => {
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
        return;
    } catch (error) {
        console.warn("ElevenLabs TTS Error, falling back to browser API:", error.message);
    }

    // Fallback to Browser Speech Synthesis

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set default Arabic properties, tailored for children
    utterance.lang = options.lang || 'ar-EG';
    utterance.rate = options.rate || 0.9; // Slightly slower
    utterance.pitch = options.pitch || 1.1; // Slightly higher, friendly
    utterance.volume = options.volume || 1;
    
    // Filter all Arabic voices
    const arabicVoices = voices.filter(v => v.lang.startsWith('ar') || v.name.includes('Arabic'));
    
    // Prioritize female voices (common names in Windows/Mac/Chrome)
    const femaleKeywords = ['zeina', 'hoda', 'laila', 'salma', 'noor', 'female'];
    let selectedVoice = arabicVoices.find(v => femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword)));
    
    // Fallback: If no explicit female voice, prioritize Google's voice (often better quality), else first available
    if (!selectedVoice) {
      selectedVoice = arabicVoices.find(v => v.name.includes('Google')) || arabicVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    if (speakGenerationRef.current !== generation) return;
    if (options.respectGameAudio !== false && isGameAudioPlaying()) return;

    window.speechSynthesis.speak(utterance);
  }, [supported, voices]);

  const cancel = useCallback(() => {
    speakGenerationRef.current += 1;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (!supported) return;
    window.speechSynthesis.cancel();
  }, [supported]);

  // Clean up on unmount and handle visibility change (pause when leaving tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        cancel();
      }
    };
    const handleBlurAndHide = () => {
      cancel();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlurAndHide);
    window.addEventListener("pagehide", handleBlurAndHide);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlurAndHide);
      window.removeEventListener("pagehide", handleBlurAndHide);
      cancel();
    };
  }, [cancel]);

  return { speak, cancel, supported, voices };
};

export default useSpeechSynthesis;
