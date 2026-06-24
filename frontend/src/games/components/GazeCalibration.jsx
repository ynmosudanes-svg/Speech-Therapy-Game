import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CALIBRATION_POINTS = [
  { top: '10%', left: '10%' },
  { top: '10%', left: '50%' },
  { top: '10%', left: '90%' },
  { top: '50%', left: '10%' },
  { top: '50%', left: '50%' },
  { top: '50%', left: '90%' },
  { top: '90%', left: '10%' },
  { top: '90%', left: '50%' },
  { top: '90%', left: '90%' },
];

const GazeCalibration = ({ onComplete, isReady }) => {
  const [pointsClicked, setPointsClicked] = useState(
    Array(CALIBRATION_POINTS.length).fill(0)
  );
  
  // A point needs 3 clicks to be fully calibrated in WebGazer (but let's do 1 or 2 for kids to keep it fast, Webgazer recommends clicking multiple times, we can simulate by sending multiple click events or just asking to click once if it's enough)
  const CLICKS_REQUIRED = 2;

  const handleClick = (index, event) => {
    // Notify webgazer of the click to train the model
    if (window.webgazer) {
      window.webgazer.recordScreenPosition(event.clientX, event.clientY, 'click');
    }

    setPointsClicked(prev => {
      const newClicks = [...prev];
      newClicks[index] += 1;
      return newClicks;
    });
  };

  useEffect(() => {
    // Check if all points are fully clicked
    if (pointsClicked.every(clicks => clicks >= CLICKS_REQUIRED)) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [pointsClicked, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <h2 className="text-white text-3xl font-black text-center mt-12 drop-shadow-lg">
          {isReady ? 'انظر للنجوم واضغط عليها لتدريب الكاميرا! ✨' : 'جاري تحميل كاميرا الذكاء الاصطناعي... ⏳'}
        </h2>
        {!isReady && (
          <p className="text-slate-300 text-center mt-4 font-bold text-lg">يرجى الانتظار، قد يستغرق الأمر عدة ثوانٍ في المرة الأولى</p>
        )}
      </div>

      {isReady && CALIBRATION_POINTS.map((pos, index) => {
        const clicks = pointsClicked[index];
        const isDone = clicks >= CLICKS_REQUIRED;
        
        if (isDone) return null;

        return (
          <motion.button
            key={index}
            className="absolute flex items-center justify-center outline-none"
            style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleClick(index, e)}
          >
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${clicks > 0 ? 'bg-green-400' : 'bg-yellow-400'} shadow-[0_0_20px_rgba(250,204,21,0.6)]`}>
              <span className="text-2xl">{clicks === 0 ? '⭐' : '🌟'}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default GazeCalibration;
