'use client';

import React, { useEffect, useRef } from 'react';

interface NeuralBannerProps {
  height?: number | string;
  className?: string;
  interactive?: boolean;
}

interface Node {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  radius: number;
  pulsePhase: number;
}

export function NeuralBanner({
  height = '100%',
  className = '',
  interactive = true,
}: NeuralBannerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 280);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette: deep blue, cyan, hot magenta, electric violet
    const colors = [
      '#3b82f6', // deep blue
      '#06b6d4', // cyan
      '#ec4899', // hot magenta
      '#f43f5e', // vivid rose
      '#a855f7', // violet
    ];

    // Generate 3D nodes
    const nodeCount = 42;
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * width * 1.2,
        y: (Math.random() - 0.5) * height * 1.2,
        z: Math.random() * 400 - 200,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        vz: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: Math.random() * 2.2 + 1.2,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Floating digital dust particles
    const particleCount = 65;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.35 - 0.1,
      size: Math.random() * 1.6 + 0.6,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? '#ec4899' : '#38bdf8',
    }));

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left - width / 2) * 0.08,
        y: (e.clientY - rect.top - height / 2) * 0.08,
      };
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    const fov = 350;
    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Deep Unreal cyberspace backdrop gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#060a17');
      bgGrad.addColorStop(0.5, '#0b1026');
      bgGrad.addColorStop(1, '#04060e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Volumetric atmospheric glow rings
      const glow1 = ctx.createRadialGradient(
        width * 0.75,
        height * 0.25,
        10,
        width * 0.75,
        height * 0.25,
        width * 0.6
      );
      glow1.addColorStop(0, 'rgba(236, 72, 153, 0.25)'); // hot magenta
      glow1.addColorStop(0.6, 'rgba(168, 85, 247, 0.08)');
      glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(
        width * 0.2,
        height * 0.8,
        10,
        width * 0.2,
        height * 0.8,
        width * 0.7
      );
      glow2.addColorStop(0, 'rgba(59, 130, 246, 0.3)'); // deep blue
      glow2.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
      glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // Render floating digital particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      });

      // Update & project 3D nodes
      const projectedNodes: { x: number; y: number; scale: number; color: string; pulse: number }[] = [];

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;

        // Bounce within 3D volume
        const boundX = width * 0.6;
        const boundY = height * 0.6;
        if (n.x < -boundX || n.x > boundX) n.vx *= -1;
        if (n.y < -boundY || n.y > boundY) n.vy *= -1;
        if (n.z < -200 || n.z > 200) n.vz *= -1;

        // Interactive tilt
        const rotX = n.x + mouseRef.current.x;
        const rotY = n.y + mouseRef.current.y;
        const scale = fov / (fov + n.z);

        const projX = width / 2 + rotX * scale;
        const projY = height / 2 + rotY * scale;

        const pulse = Math.sin(time * 2 + n.pulsePhase) * 0.5 + 0.5;

        projectedNodes.push({
          x: projX,
          y: projY,
          scale: Math.max(0.2, scale),
          color: n.color,
          pulse,
        });
      });

      // Draw neural network synapse connections
      const maxDist = 95;
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const a = projectedNodes[i];
          const b = projectedNodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.45;
            const lineGrad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            lineGrad.addColorStop(0, a.color);
            lineGrad.addColorStop(1, b.color);

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = Math.min(a.scale, b.scale) * 1.4;
            ctx.globalAlpha = alpha;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }

      // Draw projected nodes with hot glow
      projectedNodes.forEach((node) => {
        ctx.save();
        ctx.beginPath();
        const r = (node.scale * 3.5 + node.pulse * 1.5);
        ctx.arc(node.x, node.y, Math.max(1, r), 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 12;
        ctx.fill();

        // White hot center
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(0.5, r * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      });

      // Cinematic Vignette Overlay
      const vig = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(4, 6, 14, 0.7)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [interactive]);

  return (
    <div className={`relative overflow-hidden w-full ${className}`} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle scanline overlay for futuristic terminal feel */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent opacity-75"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 0, 0, 0.25) 3px, rgba(0, 0, 0, 0.25) 4px)',
        }}
      />
    </div>
  );
}
