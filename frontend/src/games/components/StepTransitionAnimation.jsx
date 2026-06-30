import { motion } from 'framer-motion';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function StepTransitionAnimation({
  fromRef,
  toRef,
  containerRef,
  runKey,
  duration = 0.6,
  onComplete,
}) {
  if (!fromRef?.current || !toRef?.current || !containerRef?.current) {
    return null;
  }

  const containerRect = containerRef.current.getBoundingClientRect();
  const fromRect = fromRef.current.getBoundingClientRect();
  const toRect = toRef.current.getBoundingClientRect();

  const startX = fromRect.left - containerRect.left + fromRect.width / 2;
  const startY = fromRect.top - containerRect.top + fromRect.height / 2;
  const endX = toRect.left - containerRect.left + toRect.width / 2;
  const endY = toRect.top - containerRect.top + toRect.height / 2;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const curveLift = clamp(Math.abs(deltaX) * 0.16 + Math.abs(deltaY) * 0.1, 34, 96);
  const controlX1 = startX + deltaX * 0.34;
  const controlY1 = startY - curveLift;
  const controlX2 = startX + deltaX * 0.66;
  const controlY2 = endY - curveLift;
  const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

  return (
    <svg
      key={runKey}
      className="pointer-events-none absolute inset-0 z-40 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <filter id={`step-transition-glow-${runKey}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.path
        d={path}
        fill="none"
        stroke="#19add6"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="12 12"
        filter={`url(#step-transition-glow-${runKey})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.95, 0.95, 0] }}
        transition={{
          pathLength: { duration, ease: 'easeInOut' },
          opacity: { duration: duration + 0.18, times: [0, 0.14, 0.78, 1], ease: 'easeInOut' },
        }}
        onAnimationComplete={onComplete}
      />

      <motion.circle
        r="8"
        fill="#19add6"
        stroke="#ffffff"
        strokeWidth="4"
        filter={`url(#step-transition-glow-${runKey})`}
        initial={{ offsetDistance: '0%', opacity: 0, scale: 0.7 }}
        animate={{ offsetDistance: '100%', opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 0.75] }}
        transition={{ duration: duration + 0.08, ease: 'easeInOut' }}
        style={{
          offsetPath: `path("${path}")`,
          offsetRotate: '0deg',
        }}
      />
    </svg>
  );
}
