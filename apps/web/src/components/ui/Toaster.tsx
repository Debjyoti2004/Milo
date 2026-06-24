import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToastStore } from "@/stores/toastStore";
import { cn } from "@/lib/cn";

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = { success: "text-met", error: "text-danger", info: "text-accent" };

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              onClick={() => dismiss(toast.id)}
              className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-medium text-text shadow-lg"
            >
              <Icon className={cn("size-4 shrink-0", COLORS[toast.variant])} />
              {toast.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
