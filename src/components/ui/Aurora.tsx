/**
 * Aurora — ReactBits-style animated gradient background.
 * Uses three large blurred orbs with CSS keyframe animations
 * defined in globals.css (@keyframes aurora-drift-*).
 */
interface AuroraProps {
  className?: string;
}

export default function Aurora({ className = "" }: AuroraProps) {
  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Orb 1 — electric blue, top-left */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full bg-blue-600/20 -top-60 -left-60 blur-[120px]"
        style={{ animation: "aurora-drift-1 24s ease-in-out infinite" }}
      />
      {/* Orb 2 — violet, bottom-right */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full bg-violet-600/18 -bottom-48 -right-48 blur-[100px]"
        style={{ animation: "aurora-drift-2 30s ease-in-out infinite" }}
      />
      {/* Orb 3 — cyan, center */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/12 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[90px]"
        style={{ animation: "aurora-drift-3 20s ease-in-out infinite" }}
      />
    </div>
  );
}
