import { motion } from "framer-motion";
import { ArrowRight, Droplets, Footprints, Moon, Salad, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { WorkoutPreviewSheet } from "@/components/workout/WorkoutPreviewSheet";
import { cn } from "@/lib/cn";
import { formatFriendlyDate, formatNumber } from "@/lib/format";
import { useMe } from "@/lib/useAuth";
import { useAdherence, useAcknowledgeDeload } from "@/features/progress/api";
import { CardioLogSheet } from "@/features/cardio/CardioLogSheet";
import { useTodaySummary } from "./api";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

function sectionTransition(index: number) {
  return { type: "spring" as const, duration: 0.5, bounce: 0.15, delay: index * 0.07 };
}

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function TodayPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const today = new Date();
  const { data, isLoading } = useTodaySummary(today);
  const [previewing, setPreviewing] = useState(false);
  const [loggingCardio, setLoggingCardio] = useState(false);
  const [deloadDismissed, setDeloadDismissed] = useState(false);
  const acknowledgeDeload = useAcknowledgeDeload();

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const firstName = me?.user.name.split(" ")[0] ?? "there";
  const plan = data.todayPlan;
  const calorieTarget = data.targets?.calories ?? 0;
  const calorieProgress = calorieTarget > 0 ? data.consumed.calories / calorieTarget : 0;
  const showDeloadBanner = data.deloadDue && !deloadDismissed;

  return (
    <div className="flex flex-col gap-5">
      <motion.div {...fadeUp} transition={sectionTransition(0)}>
        <p className="text-sm text-text-secondary">{formatFriendlyDate(today)}</p>
        <h1 className="text-2xl font-bold text-text">
          {getGreeting(today)}, {firstName} 👋
        </h1>
      </motion.div>

      <motion.div {...fadeUp} transition={sectionTransition(1)}>
        <WeekStreak />
      </motion.div>

      {showDeloadBanner && (
        <motion.div {...fadeUp} transition={sectionTransition(1)}>
          <div className="rounded-card border border-partial/40 bg-partial/10 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-partial">Deload week due 💤</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  7+ weeks of consistent training — take it easy this week. Use ~60% of your usual weights and half the sets. Your body will thank you.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => acknowledgeDeload.mutate(undefined, { onSuccess: () => setDeloadDismissed(true) })}
                    className="rounded-lg bg-partial px-3 py-1.5 text-xs font-semibold text-bg"
                  >
                    Got it — starting deload
                  </button>
                  <button
                    onClick={() => setDeloadDismissed(true)}
                    className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text-secondary"
                  >
                    Remind me later
                  </button>
                </div>
              </div>
              <button onClick={() => setDeloadDismissed(true)} className="mt-0.5 text-text-muted">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div {...fadeUp} transition={sectionTransition(2)}>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Today's session
              </p>
              <h2 className="mt-1 text-lg font-bold text-text">
                {plan?.isRestDay ? "Rest day" : plan?.label ?? "No plan yet"}
              </h2>
              {!plan?.isRestDay && plan && (
                <p className="mt-0.5 text-sm text-text-secondary">{plan.exercises.length} exercises</p>
              )}
            </div>
            {plan?.isRestDay ? (
              <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-2">
                <Moon className="size-6 text-text-muted" />
              </div>
            ) : data.session ? (
              <Button onClick={() => navigate(`/workout/session/${data.session!.id}`)}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => setPreviewing(true)} disabled={!plan || plan.exercises.length === 0}>
                Start
              </Button>
            )}
          </div>
          {!plan?.isRestDay && plan && plan.exercises.length === 0 && (
            <p className="mt-3 text-sm text-text-muted">
              No exercises added yet — head to the Plan tab to add some.
            </p>
          )}
        </Card>
      </motion.div>

      <motion.div {...fadeUp} transition={sectionTransition(3)}>
        <Card className="flex items-center gap-5">
          <ProgressRing progress={calorieProgress} size={104} strokeWidth={10}>
            <div className="text-center">
              <p className="text-lg font-bold text-text">{formatNumber(data.consumed.calories)}</p>
              <p className="text-[11px] text-text-muted">/ {formatNumber(calorieTarget)} kcal</p>
            </div>
          </ProgressRing>
          <div className="flex-1 space-y-2.5">
            <MacroBar label="Protein" value={data.consumed.proteinG} target={data.targets?.proteinG ?? 0} color="bg-met" />
            <MacroBar label="Carbs" value={data.consumed.carbsG} target={data.targets?.carbsG ?? 0} color="bg-accent" />
            <MacroBar label="Fat" value={data.consumed.fatG} target={data.targets?.fatG ?? 0} color="bg-partial" />
          </div>
        </Card>
      </motion.div>

      <motion.div {...fadeUp} transition={sectionTransition(4)} className="grid grid-cols-2 gap-3">
        <QuickAction
          onClick={() => navigate("/food")}
          icon={Salad}
          iconClassName="text-met"
          title="Log food"
          subtitle="Add a meal"
        />
        <QuickAction
          onClick={() => navigate("/food")}
          icon={Droplets}
          iconClassName="text-accent"
          title={`${formatNumber(data.waterMl)} ml`}
          subtitle="Water today"
        />
        <QuickAction
          onClick={() => setLoggingCardio(true)}
          icon={Footprints}
          iconClassName="text-partial"
          title={data.cardio?.steps ? `${formatNumber(data.cardio.steps)} steps` : "Log steps"}
          subtitle="Cardio today"
        />
      </motion.div>

      {plan && !plan.isRestDay && previewing && (
        <WorkoutPreviewSheet day={plan} onClose={() => setPreviewing(false)} />
      )}

      {loggingCardio && (
        <CardioLogSheet date={today} current={data.cardio} onClose={() => setLoggingCardio(false)} />
      )}
    </div>
  );
}

function QuickAction({
  onClick,
  icon: Icon,
  iconClassName,
  title,
  subtitle,
}: {
  onClick: () => void;
  icon: typeof Salad;
  iconClassName: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -2 }}
      className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 text-left"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-surface-2">
        <Icon className={cn("size-5", iconClassName)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-text">{title}</p>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
    </motion.button>
  );
}

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function WeekStreak() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const { data } = useAdherence(monday, sunday);
  const byDate = new Map((data?.adherence ?? []).map((e) => [new Date(e.date).toDateString(), e.status]));

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  return (
    <div className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3">
      {days.map((day, i) => {
        const status = byDate.get(day.toDateString());
        const isToday = day.toDateString() === today.toDateString();
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className={cn("text-[10px] font-medium", isToday ? "text-accent" : "text-text-muted")}>
              {WEEKDAY_LABELS[i]}
            </span>
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3, delay: i * 0.04 }}
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-[10px] font-bold",
                status === "COMPLETED" && "bg-met text-bg",
                status === "STARTED" && "bg-partial text-bg",
                !status && isToday && "border-2 border-accent text-accent",
                !status && !isToday && "bg-surface-2 text-text-muted",
              )}
            >
              {day.getDate()}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const progress = target > 0 ? Math.min(value / target, 1) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-muted">
          {formatNumber(value)}/{formatNumber(target)}g
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.1 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}
