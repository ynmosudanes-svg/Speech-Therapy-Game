import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import birdAnimation from '../../assets/Animation/Bird.json';

export default function BirdHint({ className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: birdAnimation,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    });

    animation.setSpeed(0.8);

    return () => {
      animation.destroy();
    };
  }, []);

  return <div ref={containerRef} className={`pointer-events-none ${className}`} aria-hidden="true" />;
}
