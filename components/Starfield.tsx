// components/Starfield.tsx
//
// Animated starfield background for the Mask stage view.
// Matches the reference image: deep teal background with multi-colored
// speckle stars (cyan, yellow, green, orange) scattered randomly.
//
// Design notes:
//   - Stars are rendered to a <canvas> for perf (many stars, smooth animation)
//   - Subtle drift: each star slowly twinkles (opacity oscillation) + slow drift
//   - Background never changes between modes — only foreground composition shifts
//   - Pure CSS would be simpler but doesn't scale to 200+ stars cleanly
//
// Usage:
//   <div className="relative w-screen h-screen">
//     <Starfield />
//     <div className="absolute inset-0 flex items-center justify-center">
//       <Mask />
//     </div>
//   </div>

'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
  baseOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

// Star colors pulled from the Faceless reference image — cyan/yellow/green
// dominate, with occasional orange/pink accent. Numbers are rough percentages.
const STAR_COLORS = [
  '#7dd3c0', // cyan-green   (most common)
  '#7dd3c0',
  '#7dd3c0',
  '#fbbf24', // yellow
  '#fbbf24',
  '#84cc16', // lime green
  '#fb923c', // orange       (rare)
  '#f472b6', // pink         (rare)
  '#ffffff', // white         (rare, for sparkle)
];

const STAR_DENSITY = 0.0008; // stars per pixel — tweak for more/fewer
const BACKGROUND_COLOR = '#1a3a4a'; // deep teal from reference

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler — regenerate stars on size change so density stays consistent
    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.scale(dpr, dpr);

      // Generate stars with random positions, sizes, colors
      const starCount = Math.floor(width * height * STAR_DENSITY);
      starsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.5 + Math.random() * 2.5, // 0.5px to 3px radius
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        baseOpacity: 0.4 + Math.random() * 0.6,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.3 + Math.random() * 0.7,
      }));
    }

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // Animation loop — twinkle each star slowly via opacity oscillation
    let lastTime = performance.now();
    function animate(currentTime: number) {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Paint background
      ctx!.fillStyle = BACKGROUND_COLOR;
      ctx!.fillRect(0, 0, width, height);

      // Paint each star with twinkle
      for (const star of starsRef.current) {
        star.twinklePhase += delta * star.twinkleSpeed;
        const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase);
        const opacity = star.baseOpacity * (0.6 + 0.4 * twinkle);

        ctx!.globalAlpha = opacity;
        ctx!.fillStyle = star.color;
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', setupCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen -z-10"
      style={{ backgroundColor: BACKGROUND_COLOR }}
    />
  );
}
