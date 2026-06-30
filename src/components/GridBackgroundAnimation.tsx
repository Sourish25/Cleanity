import React, { useEffect, useRef } from 'react';

interface GridNode {
  x: number;
  y: number;
  size: number;
  pulseSpeed: number;
  pulsePhase: number;
  opacity: number;
}

export const GridBackgroundAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = window.devicePixelRatio || 1;

    // Initialize clean, slow-pulsing monitoring nodes (active hazard points, utility junctions)
    const nodes: GridNode[] = [];
    const nodeCount = 15;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random(),
        y: Math.random(),
        size: 1.5 + Math.random() * 2,
        pulseSpeed: 0.01 + Math.random() * 0.015,
        pulsePhase: Math.random() * Math.PI * 2,
        opacity: 0.15 + Math.random() * 0.25,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width * dpr, height * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw a highly precise, clean municipal coordinate grid (zero gradients)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;

      const gridSpacing = 64;
      
      // Vertical grid lines
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw subtle, slow-pulsing ambient sensor nodes (representing reported hazards & utility junctions)
      nodes.forEach((node) => {
        node.pulsePhase += node.pulseSpeed;
        const currentScale = 1 + Math.sin(node.pulsePhase) * 0.35;
        const currentOpacity = node.opacity * (0.6 + Math.sin(node.pulsePhase) * 0.4);

        const px = node.x * width;
        const py = node.y * height;

        // Draw outer concentric pulse ring (clean, thin vector style)
        ctx.strokeStyle = `rgba(245, 158, 11, ${currentOpacity * 0.4})`; // soft amber
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, node.size * 5 * currentScale, 0, Math.PI * 2);
        ctx.stroke();

        // Draw center solid node core
        ctx.fillStyle = `rgba(245, 158, 11, ${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(px, py, node.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};
