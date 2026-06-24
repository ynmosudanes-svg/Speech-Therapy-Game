import { motion } from 'framer-motion';
import { useMemo } from 'react';

const AnimatedBackground = () => {
  // Generate random values once
  const elements = useMemo(() => {
    return [...Array(12)].map((_, i) => ({
      id: i,
      size: Math.random() * 30 + 15,
      left: Math.random() * 100,
      duration: Math.random() * 20 + 25,
      delay: Math.random() * -20, // Start at different times
      drift: Math.random() * 100 - 50,
      isStar: i % 3 === 0, // 1/3 of them are stars
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#e6f4fe] via-[#f0f9ff] to-[#e0f2fe]">
      {/* Background Blobs for color variation */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-sky-200/50 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-200/40 blur-[120px]" />

      {/* Floating Elements */}
      {elements.map((el) => (
        <motion.div
          key={`el-${el.id}`}
          className="absolute"
          style={{
            left: `${el.left}%`,
            top: '-20%', // Start slightly above to avoid pop-in if animation restarts
          }}
          animate={{
            y: ['130vh', '-10vh'],
            x: [0, el.drift, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            y: {
              duration: el.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: el.delay,
            },
            x: {
              duration: el.duration * 0.8,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            },
            rotate: {
              duration: el.duration * 1.5,
              repeat: Infinity,
              ease: 'linear',
            }
          }}
        >
          {el.isStar ? (
            <svg
              width={el.size}
              height={el.size}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-amber-400/40 drop-shadow-sm"
            >
              <path
                d="M12 2L14.8 9.2H22L16.2 13.6L18.4 20.8L12 16.4L5.6 20.8L7.8 13.6L2 9.2H9.2L12 2Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <div
              className="rounded-full bg-sky-300/20 backdrop-blur-sm border border-sky-200/40 shadow-[inset_0_0_12px_rgba(125,211,252,0.3)]"
              style={{
                width: `${el.size}px`,
                height: `${el.size}px`,
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default AnimatedBackground;
