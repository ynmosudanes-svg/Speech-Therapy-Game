import { useEffect, useRef, useState, useCallback } from 'react';

// Import webgazer as a side-effect - it attaches itself to window.webgazer
let webgazerLoaded = false;
let webgazerLoadPromise = null;

const loadWebGazer = () => {
  if (webgazerLoadPromise) return webgazerLoadPromise;
  webgazerLoadPromise = import('webgazer').then(() => {
    webgazerLoaded = true;
    return window.webgazer;
  }).catch(err => {
    console.error('Failed to load webgazer module:', err);
    return null;
  });
  return webgazerLoadPromise;
};

export const useWebGazer = () => {
  const [isReady, setIsReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [gazeData, setGazeData] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  const isStoppedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadWebGazer().then((wg) => {
      if (!cancelled && wg) {
        setIsReady(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const startTracking = useCallback(async (showVideo = true) => {
    const wg = window.webgazer;
    if (!wg) return;
    isStoppedRef.current = false;

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('WebGazer initialization timed out')), 10000);
      });

      const beginPromise = wg
        .setGazeListener((data) => {
          if (data) {
            setGazeData({ x: data.x, y: data.y });
          }
        })
        .begin();

      // Race the begin() call against a 10-second timeout
      await Promise.race([beginPromise, timeoutPromise]);
      
      // If stopTracking was called while we were waiting for begin()
      if (isStoppedRef.current) {
        try { wg.end(); } catch(e) {}
        return;
      }

      wg.showVideo(showVideo);
      wg.showFaceOverlay(showVideo);
      wg.showFaceFeedbackBox(showVideo);
      
      // Hide the default red dot pointer - we draw our own
      const dot = document.getElementById('webgazerGazeDot');
      if (dot) {
        dot.style.display = 'none';
      }

      setIsTracking(true);
      setError(null);
    } catch (err) {
      console.error('Failed to start WebGazer:', err);
      setError('تعذر تشغيل الكاميرا. يتم تحويلك الآن للعب بالماوس...');
      
      // Clean up in case it partially loaded
      try { wg.end(); } catch(e) {}
    }
  }, []);

  const pauseTracking = useCallback(() => {
    const wg = window.webgazer;
    if (wg && isTracking) {
      wg.pause();
      setIsTracking(false);
    }
  }, [isTracking]);

  const resumeTracking = useCallback(() => {
    const wg = window.webgazer;
    if (wg && !isTracking) {
      wg.resume();
      setIsTracking(true);
    }
  }, [isTracking]);

  const stopTracking = useCallback(() => {
    isStoppedRef.current = true;
    const wg = window.webgazer;
    if (wg) {
      try {
        wg.end();
      } catch (err) {
        // Ignore errors if already ended
      }
      setIsTracking(false);
    }
  }, []);

  const clearCalibration = useCallback(() => {
    const wg = window.webgazer;
    if (wg) {
      wg.clearData();
    }
  }, []);

  return {
    isReady,
    isTracking,
    gazeData,
    error,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    clearCalibration,
  };
};
