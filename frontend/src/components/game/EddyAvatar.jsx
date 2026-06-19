import React, { useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import lottie from 'lottie-web';
import { Check, X } from 'lucide-react';
import celebrationAnimation from '../../assets/Animation/Celebration.json';
import learningAnimation from '../../assets/Animation/Learning.json';
import owlBirdAnimation from '../../assets/Animation/sleeping bird.json';
import parrotAnimation from '../../assets/Animation/Parroto ( Animation ).json';

const AVATAR_ANIMATIONS = {
  celebration: celebrationAnimation,
  error: parrotAnimation,
  learning: learningAnimation,
  owl: owlBirdAnimation,
};

export default function EddyAvatar({ className = '', mode = 'owl' }) {
  const containerRef = useRef(null);
  const animationData = useMemo(
    () => AVATAR_ANIMATIONS[mode] || AVATAR_ANIMATIONS.owl,
    [mode],
  );
  const animationAdjustments =
    mode === 'celebration'
      ? 'translate-y-0 scale-[1.02]'
      : mode === 'learning'
        ? 'translate-y-0 scale-[1.02]'
        : mode === 'error'
          ? 'translate-y-1 scale-[0.98]'
          : 'scale-[1.02]';
  const statusBadge =
    mode === 'celebration'
      ? {
          label: 'صحيح',
          className: 'bg-emerald-500 text-white',
          icon: <Check className="h-3.5 w-3.5" strokeWidth={3.5} />,
        }
      : mode === 'error'
        ? {
            label: 'خطأ',
            className: 'bg-rose-500 text-white',
            icon: <X className="h-3.5 w-3.5" strokeWidth={3.5} />,
          }
        : null;
  useEffect(() => {
    if (!containerRef.current) return undefined;

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    });

    return () => {
      animation.destroy();
    };
  }, [animationData]);

  useEffect(() => {
    if (mode !== 'celebration') return undefined;
    if (typeof window === 'undefined') return undefined;

    const burst = (origin) => {
      confetti({
        particleCount: 10,
        spread: 52,
        startVelocity: 18,
        gravity: 1.05,
        ticks: 140,
        decay: 0.92,
        scalar: 0.8,
        shapes: ['square'],
        colors: ['#fde68a', '#fca5a5', '#86efac', '#93c5fd', '#f9a8d4'],
        origin,
        disableForReducedMotion: true,
      });
    };

    burst({ x: 0.42, y: 0.28 });
    burst({ x: 0.58, y: 0.28 });

    const timer = window.setTimeout(() => {
      burst({ x: 0.5, y: 0.35 });
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mode]);

  return (
    <div className={`relative isolate overflow-visible rounded-[1.4rem] bg-transparent ${className}`} aria-hidden="true">
      <div className="relative h-full w-full overflow-visible rounded-[1.4rem]">
        <div
          ref={containerRef}
          className={`h-full w-full origin-center ${animationAdjustments}`}
        />
      </div>
      {statusBadge && (
        <div
          className={`absolute right-0 top-0 z-10 flex h-8 w-8 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full border-2 border-white shadow-[0_8px_20px_-10px_rgba(15,23,42,0.65)] ${statusBadge.className}`}
          title={statusBadge.label}
        >
          {statusBadge.icon}
        </div>
      )}
    </div>
  );
}
