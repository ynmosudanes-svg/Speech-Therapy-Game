import { useState, useCallback, useEffect } from 'react';

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
  const [currentAudio, setCurrentAudio] = useState(null);
  
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
    if (!supported) return;
    
    // Stop previous Gemini audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Cancel any ongoing browser speech
    window.speechSynthesis.cancel();

    // Try Gemini TTS first
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("No Gemini API Key found in env");

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: `انطق هذه الكلمة بوضوح وبحماس وبطريقة لطيفة جدا للأطفال: ${text}` }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Aoede" }
                    }
                }
            }
        };

        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
        if (!response.ok) throw new Error("Gemini TTS Failed");
        const data = await response.json();
        
        const pcmBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!pcmBase64) throw new Error("No Audio Data");

        const binaryString = window.atob(pcmBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const wavBlob = pcmToWav(bytes.buffer, 24000);
        const audioUrl = URL.createObjectURL(wavBlob);
        const audio = new Audio(audioUrl);
        setCurrentAudio(audio);
        audio.play();
        return; // Success, don't use fallback
    } catch (error) {
        console.warn("Gemini TTS Error, falling back to browser API:", error.message);
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

    window.speechSynthesis.speak(utterance);
  }, [supported, voices, currentAudio]);

  const cancel = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    if (!supported) return;
    window.speechSynthesis.cancel();
  }, [supported, currentAudio]);

  return { speak, cancel, supported, voices };
};

export default useSpeechSynthesis;
