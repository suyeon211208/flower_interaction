import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Cloud, SwayingFlower, FlowerStamp, PetalParticle, TouchRipple, HandPosition } from '../types';
import { drawLandscape } from '../utils/mediaArtRenderer';
import bgImgUrl from '../assets/images/media_art_bg_1785375717721.jpg';

export interface MediaArtCanvasHandle {
  spawnFlower: (x: number, y: number) => void;
}

interface MediaArtCanvasProps {
  handPositions?: HandPosition[];
  onStampCreated?: () => void;
  showHint?: boolean;
}

export const MediaArtCanvas = forwardRef<MediaArtCanvasHandle, MediaArtCanvasProps>(({
  handPositions = [],
  onStampCreated,
  showHint = true,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Persistent States in Refs for high performance 60fps rendering without React re-render overhead
  const cloudsRef = useRef<Cloud[]>([]);
  const swayingFlowersRef = useRef<SwayingFlower[]>([]);
  const stampsRef = useRef<FlowerStamp[]>([]);
  const ripplesRef = useRef<TouchRipple[]>([]);
  const isPointerDownRef = useRef<boolean>(false);
  const lastStampPosRef = useRef<{ x: number; y: number } | null>(null);
  const handPositionsRef = useRef<HandPosition[]>(handPositions);

  const [hintVisible, setHintVisible] = useState(showHint);

  // Keep hand positions ref synced
  useEffect(() => {
    handPositionsRef.current = handPositions;
  }, [handPositions]);

  // Load Background Image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
    };
    img.onerror = (err) => {
      console.error('Failed to load background image:', bgImgUrl, err);
    };
    img.src = bgImgUrl;
    if (img.complete && img.naturalWidth > 0) {
      bgImageRef.current = img;
    }
  }, []);

  // Clear procedural clouds and base flowers
  const initClouds = useCallback(() => {
    cloudsRef.current = [];
  }, []);

  const initSwayingFlowers = useCallback(() => {
    swayingFlowersRef.current = [];
  }, []);

  // Spawn Flower Stamp on Touch/Click/Camera
  const createFlowerStamp = useCallback((x: number, y: number) => {
    // Prevent flowers from overlapping closely with existing active stamps (minimum 85px gap)
    const MIN_FLOWER_SPACING = 85;
    const isTooClose = stampsRef.current.some((stamp) => {
      const dist = Math.hypot(stamp.x - x, stamp.y - y);
      return dist < MIN_FLOWER_SPACING;
    });

    if (isTooClose) {
      return;
    }

    // Hide touch hint when user stamps
    if (hintVisible) {
      setHintVisible(false);
    }

    const flowerTypes: Array<'coralDaisy' | 'whiteDaisy' | 'redPoppy' | 'goldenDaisy' | 'blossom'> = [
      'coralDaisy',
      'whiteDaisy',
      'redPoppy',
      'goldenDaisy',
      'blossom',
    ];
    const randomType = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];

    // Random scale range from small (0.4) to extra large (1.8) for diverse flower sizes
    const minScale = 0.4;
    const maxScale = 1.8;
    const randomScale = minScale + Math.random() * (maxScale - minScale);

    // Scale particle burst according to flower size
    const particles: PetalParticle[] = [];
    const colors = ['#FFFFFF', '#EF5E40', '#F2AB31', '#E34127', '#E98D25'];
    const numParticles = Math.floor(6 + randomScale * 4);
    for (let i = 0; i < numParticles; i++) {
      const angle = (i * Math.PI * 2) / numParticles + Math.random() * 0.2;
      const speed = (2.0 + Math.random() * 2.5) * randomScale;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2 * randomScale,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: (4 + Math.random() * 4) * Math.sqrt(randomScale),
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        life: 1,
        maxLife: 0.8 + Math.random() * 0.4,
      });
    }

    const newStamp: FlowerStamp = {
      id: `stamp_${Date.now()}_${Math.random()}`,
      x,
      y,
      flowerType: randomType,
      scale: 0.05, // starts small for pop animation
      targetScale: randomScale,
      rotation: (Math.random() - 0.5) * 0.6,
      createdAt: performance.now(),
      duration: 2500 + Math.random() * 1200, // 2.5s - 3.7s display time before disappearing
      fadeDuration: 800, // 0.8s fade out
      opacity: 1,
      swayPhase: Math.random() * Math.PI * 2,
      particles,
    };

    stampsRef.current.push(newStamp);

    // Add touch ripple ring sized to flower scale
    ripplesRef.current.push({
      x,
      y,
      radius: 5,
      maxRadius: (35 + Math.random() * 25) * Math.sqrt(randomScale),
      opacity: 0.8,
    });

    if (onStampCreated) {
      onStampCreated();
    }
  }, [hintVisible, onStampCreated]);

  // Expose spawnFlower handle for external camera tracking triggers
  useImperativeHandle(ref, () => ({
    spawnFlower: (x: number, y: number) => {
      createFlowerStamp(x, y);
    },
  }));

  // Pointer & Touch Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastStampPosRef.current = { x, y };
    createFlowerStamp(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Minimum distance threshold between drag stamps to prevent crowding
    if (lastStampPosRef.current) {
      const dist = Math.hypot(x - lastStampPosRef.current.x, y - lastStampPosRef.current.y);
      if (dist > 45) {
        lastStampPosRef.current = { x, y };
        createFlowerStamp(x, y);
      }
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    lastStampPosRef.current = null;
  };

  // Multi-Touch Handlers for mobile/tablet screens
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      createFlowerStamp(x, y);
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    initClouds();
    initSwayingFlowers();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas Resizing with high DPI support
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const render = (time: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update Flower Stamps (Pop bloom scale, life duration, fade out)
      const now = performance.now();
      stampsRef.current = stampsRef.current.filter((stamp) => {
        const age = now - stamp.createdAt;

        // Pop Bloom Scaling: 0 -> targetScale * 1.25 -> targetScale
        if (age < 200) {
          const progress = age / 200;
          stamp.scale = progress * stamp.targetScale * 1.2;
        } else if (age < 350) {
          const progress = (age - 200) / 150;
          stamp.scale = stamp.targetScale * 1.2 - progress * (stamp.targetScale * 0.2);
        } else {
          stamp.scale = stamp.targetScale;
        }

        // Fade Out after duration
        if (age > stamp.duration) {
          const fadeAge = age - stamp.duration;
          stamp.opacity = Math.max(0, 1 - fadeAge / stamp.fadeDuration);
        }

        // Update stamp particles
        stamp.particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.08; // gravity
          p.rotation += p.vRot;
          p.life -= 0.025;
        });

        return stamp.opacity > 0;
      });

      // Update Touch Ripples
      ripplesRef.current = ripplesRef.current.filter((r) => {
        r.radius += 1.8;
        r.opacity -= 0.025;
        return r.opacity > 0;
      });

      // Draw whole landscape scene
      drawLandscape(
        ctx,
        width,
        height,
        time,
        cloudsRef.current,
        swayingFlowersRef.current,
        stampsRef.current,
        ripplesRef.current,
        bgImageRef.current,
        handPositionsRef.current
      );

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [initClouds, initSwayingFlowers]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-emerald-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        className="block w-full h-full cursor-pointer touch-none"
      />

      {/* Subtle indicator without text overlay */}
      {hintVisible && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-700">
          <div className="flex items-center justify-center p-3 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white/90 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
          </div>
        </div>
      )}
    </div>
  );
});

MediaArtCanvas.displayName = 'MediaArtCanvas';

