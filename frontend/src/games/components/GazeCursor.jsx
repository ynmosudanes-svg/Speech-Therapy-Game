import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const GazeCursor = ({ x, y, isVisible, progress = 0 }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999] flex items-center justify-center"
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
      style={{
        left: -24, // Offset by half width to center the cursor on x,y
        top: -24,
      }}
    >
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Magic sparkle icon */}
        <div className="absolute inset-0 bg-yellow-300 rounded-full blur-md opacity-50 animate-pulse" />
        <Sparkles size={28} className="text-amber-500 drop-shadow-md relative z-10" />
        
        {/* Progress ring when dwelling */}
        {progress > 0 && (
          <svg className="absolute -inset-2 w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#10b981"
              strokeWidth="4"
              fill="none"
              strokeDasharray="176" // 2 * pi * 28 = 175.9
              strokeDashoffset={176 - (176 * progress) / 100}
              className="transition-all duration-100 ease-linear"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    </motion.div>
  );
};

export default GazeCursor;
