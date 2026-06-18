import React, { useEffect, useState } from 'react';

const getProcessedImage = (src, threshold = 240) =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !src) {
      resolve('');
      return;
    }

    const image = new window.Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          resolve('');
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const frame = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = frame.data;

        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const alpha = pixels[index + 3];
          const isNearWhite = red >= threshold && green >= threshold && blue >= threshold;
          const isNearlyTransparent = alpha < 20;

          if (isNearWhite || isNearlyTransparent) {
            pixels[index + 3] = 0;
          }
        }

        context.putImageData(frame, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = reject;
    image.src = src;
  });

const GameImage = ({
  src,
  alt,
  className = '',
  removeWhiteBackground = true,
  whiteThreshold = 240,
  ...props
}) => {
  const [processedSrc, setProcessedSrc] = useState('');

  useEffect(() => {
    if (!removeWhiteBackground || !src) {
      setProcessedSrc('');
      return undefined;
    }

    let isCancelled = false;

    getProcessedImage(src, whiteThreshold)
      .then((nextSrc) => {
        if (!isCancelled) {
          setProcessedSrc(nextSrc);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setProcessedSrc('');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [removeWhiteBackground, src, whiteThreshold]);

  return <img src={processedSrc || src} alt={alt} className={className} {...props} />;
};

export default GameImage;
