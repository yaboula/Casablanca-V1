/**
 * Noise — Grain / film-noise texture overlay.
 * Adds depth and a tactile, premium feel to dark sections.
 */
interface NoiseProps {
  opacity?: number;
  className?: string;
}

export default function Noise({ opacity = 0.04, className = "" }: NoiseProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[2] ${className}`}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
      }}
    />
  );
}
