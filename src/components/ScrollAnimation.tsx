'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { Sparkles, ArrowDown } from 'lucide-react';

const TOTAL_FRAMES = 300;

export default function ScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Preload Images
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    const preloadImages = async () => {
      const promises = Array.from({ length: TOTAL_FRAMES }).map((_, i) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          const frameNum = String(i + 1).padStart(3, '0');
          img.src = `/frames/ezgif-frame-${frameNum}.jpg`;
          img.onload = () => {
            loadedCount++;
            setLoadProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100));
            resolve();
          };
          img.onerror = () => {
            // resolve anyway to not block
            resolve();
          };
          loadedImages[i] = img;
        });
      });

      await Promise.all(promises);
      setImages(loadedImages);
      setIsLoaded(true);
    };

    preloadImages();
  }, []);

  // Listen to Scroll Progress
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isLoaded) return;
    const index = Math.min(
      TOTAL_FRAMES - 1,
      Math.floor(latest * TOTAL_FRAMES)
    );
    setFrameIndex(index);
  });

  // Render Frame on Canvas
  useEffect(() => {
    if (!isLoaded || images.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const currentImage = images[frameIndex];
    if (!currentImage) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate aspect ratios to make image object-fit contain/cover in canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imageWidth = currentImage.width;
    const imageHeight = currentImage.height;

    const ratio = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
    const newWidth = imageWidth * ratio;
    const newHeight = imageHeight * ratio;

    const x = (canvasWidth - newWidth) / 2;
    const y = (canvasHeight - newHeight) / 2;

    // Draw frame
    context.drawImage(currentImage, x, y, newWidth, newHeight);
  }, [frameIndex, isLoaded, images]);

  // Handle canvas resize to maintain high quality
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      // Set internal resolution matching bounding size
      canvas.width = rect.width * 2; // retina scaling
      canvas.height = rect.height * 2;
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // call initially

    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded]);

  return (
    <div ref={containerRef} className="relative h-[250vh] bg-black/40">
      
      {/* Sticky Frame Viewer */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        {/* Scroll Helper Hint */}
        <div className="absolute top-24 z-10 flex flex-col items-center gap-1.5 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Demonstration
          </span>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-2">
            Scroll down to operate the QueueFlow device
          </h3>
          <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
            See the real-time line management terminal process queue tokens interactively.
          </p>
        </div>

        {/* Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-[#030303] z-20 flex flex-col items-center justify-center gap-4">
            <div className="relative w-44 h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              ></div>
            </div>
            <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase font-bold animate-pulse">
              Buffering Interactive Demo... {loadProgress}%
            </span>
          </div>
        )}

        {/* Canvas Render Panel */}
        <div className="w-full max-w-4xl aspect-video px-6 relative flex items-center justify-center">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full rounded-3xl border border-white/10 bg-black/80 shadow-2xl glass-panel relative"
            style={{ maxHeight: '70vh' }}
          />
        </div>

        {/* Bottom Scroll Guide */}
        <div className="absolute bottom-12 flex flex-col items-center text-zinc-500 text-[10px] uppercase font-bold tracking-wider gap-1.5 animate-bounce">
          <span>Scroll progress</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
