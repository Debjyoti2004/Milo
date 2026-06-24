import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ProgressRingProps {
  progress: number; // 0-1, can exceed 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 140,
  strokeWidth = 12,
  color = "var(--color-accent)",
  trackClassName,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={cn("stroke-surface-2", trackClassName)}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
