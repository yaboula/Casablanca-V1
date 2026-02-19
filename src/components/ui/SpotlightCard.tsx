"use client";

/**
 * SpotlightCard — ReactBits-style card with a radial light spotlight
 * that follows the cursor on hover. Creates a premium glassmorphic feel.
 */
import { useRef, useState } from "react";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightSize?: number;
}

export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(37, 99, 235, 0.12)",
  spotlightSize = 380,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setSpotlight({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => setSpotlight(null);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className}`}
      style={
        spotlight
          ? {
              background: `radial-gradient(${spotlightSize}px at ${spotlight.x}px ${spotlight.y}px, ${spotlightColor}, transparent 80%)`,
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
