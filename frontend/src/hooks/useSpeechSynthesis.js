import { useState, useCallback, useEffect } from 'react';

export const useSpeechSynthesis = () => {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  
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

  const speak = useCallback((text, options = {}) => {
    if (!supported) return;
    
    // Cancel any ongoing speech so it doesn't queue up
    window.speechSynthesis.cancel();

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
  }, [supported, voices]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
  }, [supported]);

  return { speak, cancel, supported, voices };
};

export default useSpeechSynthesis;
