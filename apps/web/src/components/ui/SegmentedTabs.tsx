import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface SegmentedTabOption {
  value: string;
  label: string;
}

interface SegmentedTabsProps {
  options: SegmentedTabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedTabs({ options, value, onChange, className }: SegmentedTabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto no-scrollbar rounded-2xl bg-surface-2 p-1",
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "text-accent-foreground" : "text-text-secondary hover:text-text",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-tab-bg"
                className="absolute inset-0 rounded-xl bg-accent"
                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
