import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronDown, ChevronUp, Plus, Ruler, Scale, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatFriendlyDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AdherenceHeatmap } from "./AdherenceHeatmap";
import { ExerciseProgressChart } from "./ExerciseProgressChart";
import { LogWaistSheet } from "./LogWaistSheet";
import { LogWeightSheet } from "./LogWeightSheet";
import {
  useAdherence,
  useBodyPhotos,
  useDeleteBodyPhoto,
  useDeleteWaistLog,
  useDeleteWeightLog,
  useUploadBodyPhoto,
  useWaistLogs,
  useWeightLogs,
} from "./api";

type Period = "7D" | "1M" | "3M" | "1Y" | "ALL";
type Angle = "FRONT" | "SIDE" | "BACK";

function dateOffset(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function computeRolling7(logs: { date: string; weightKg: number }[]) {
  return logs.map((point, i) => {
    const window = logs.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((s, p) => s + p.weightKg, 0) / window.length;
    return { ...point, rollingAvg: Math.round(avg * 10) / 10 };
  });
}

function filterByPeriod<T extends { rawDate: string }>(items: T[], period: Period): T[] {
  if (period === "ALL") return items;
  const days = period === "7D" ? 7 : period === "1M" ? 30 : period === "3M" ? 90 : 365;
  const cutoff = dateOffset(-days);
  return items.filter((i) => new Date(i.rawDate) >= cutoff);
}

const PERIODS: Period[] = ["7D", "1M", "3M", "1Y", "ALL"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 shadow-lg text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className={cn("font-semibold", p.name === "rollingAvg" ? "text-met" : "text-text-secondary")}>
          {p.name === "rollingAvg" ? "7-day avg: " : "Daily: "}{p.value} kg
        </p>
      ))}
    </div>
  );
};

const WaistTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 shadow-lg text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      <p className="font-semibold text-accent">{payload[0].value} cm</p>
    </div>
  );
};

export function ProgressPage() {
  const [loggingWeight, setLoggingWeight] = useState(false);
  const [loggingWaist, setLoggingWaist] = useState(false);
  const [weightPeriod, setWeightPeriod] = useState<Period>("3M");
  const [waistPeriod, setWaistPeriod] = useState<Period>("3M");
  const [showWeightEntries, setShowWeightEntries] = useState(false);
  const [showWaistEntries, setShowWaistEntries] = useState(false);
  const [deletingWeightId, setDeletingWeightId] = useState<string | null>(null);
  const [deletingWaistId, setDeletingWaistId] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [compareAngle, setCompareAngle] = useState<Angle | null>(null);
  const [uploadAngle, setUploadAngle] = useState<Angle>("FRONT");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const oneYearAgo = dateOffset(-365);
  const twoYearsAgo = dateOffset(-730);
  const today = new Date();

  const { data: weightData } = useWeightLogs(oneYearAgo, today);
  const { data: waistData } = useWaistLogs(oneYearAgo, today);
  const { data: adherenceData } = useAdherence(twoYearsAgo, today);
  const { data: photosData } = useBodyPhotos();
  const uploadPhoto = useUploadBodyPhoto();
  const deletePhoto = useDeleteBodyPhoto();
  const deleteWeight = useDeleteWeightLog();
  const deleteWaist = useDeleteWaistLog();

  // Weight chart data
  const allWeightLogs = (weightData?.logs ?? []).map((l) => ({
    id: l.id,
    date: formatFriendlyDate(new Date(l.date)),
    rawDate: l.date,
    weightKg: l.weightKg,
  }));
  const filteredWeightLogs = filterByPeriod(allWeightLogs, weightPeriod);
  const weightChartData = computeRolling7(filteredWeightLogs);
  const latestAvg = weightChartData[weightChartData.length - 1]?.rollingAvg;
  const firstAvg = weightChartData[0]?.rollingAvg;
  const weightDelta = latestAvg != null && firstAvg != null ? Math.round((latestAvg - firstAvg) * 10) / 10 : null;

  // Waist chart data
  const allWaistLogs = (waistData?.logs ?? []).map((l) => ({
    id: l.id,
    date: formatFriendlyDate(new Date(l.date)),
    rawDate: l.date,
    waistCm: l.waistCm,
  }));
  const filteredWaistLogs = filterByPeriod(allWaistLogs, waistPeriod);
  const latestWaist = filteredWaistLogs[filteredWaistLogs.length - 1]?.waistCm;
  const firstWaist = filteredWaistLogs[0]?.waistCm;
  const waistDelta = latestWaist != null && firstWaist != null ? Math.round((latestWaist - firstWaist) * 10) / 10 : null;

  const allPhotos = photosData?.photos ?? [];
  const photosByAngle = (angle: Angle) => allPhotos.filter((p) => p.angle === angle);
  const currentAnglePhotos = compareAngle ? photosByAngle(compareAngle) : [];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("angle", uploadAngle);
    form.append("date", new Date().toISOString());
    uploadPhoto.mutate(form);
    e.target.value = "";
  };

  // Downsample for large datasets — show at most 150 points in chart
  const downsample = <T extends object>(arr: T[], max = 150): T[] => {
    if (arr.length <= max) return arr;
    const step = Math.ceil(arr.length / max);
    return arr.filter((_, i) => i % step === 0 || i === arr.length - 1);
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-text">Progress</h1>

      {/* ─── Body weight ─── */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-text">Body weight</h2>
            <div className="mt-0.5 flex items-center gap-2">
              {latestAvg != null && (
                <span className="text-sm font-bold text-text">{latestAvg} kg</span>
              )}
              {weightDelta != null && weightDelta !== 0 && (
                <span className={cn("flex items-center gap-0.5 text-xs font-semibold", weightDelta < 0 ? "text-met" : "text-danger")}>
                  {weightDelta < 0 ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
                  {Math.abs(weightDelta)} kg
                </span>
              )}
              <span className="text-xs text-text-muted">7-day avg</span>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setLoggingWeight(true)}>
            <Plus className="size-3.5" /> Log
          </Button>
        </div>

        {/* Period filter */}
        <div className="mt-3 flex gap-1 rounded-xl bg-surface-2 p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setWeightPeriod(p)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-semibold transition",
                weightPeriod === p ? "bg-accent text-accent-foreground" : "text-text-secondary hover:text-text",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {weightChartData.length === 0 ? (
          <EmptyState icon={Scale} title="No weight logged yet" />
        ) : (
          <>
            <div className="mt-3 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={downsample(weightChartData)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-met)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-met)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-border)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--color-border)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} width={34} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="weightKg" stroke="var(--color-border)" strokeWidth={1} fill="url(#dailyGrad)" dot={false} name="daily" isAnimationActive animationDuration={600} />
                  <Area type="monotone" dataKey="rollingAvg" stroke="var(--color-met)" strokeWidth={2.5} fill="url(#weightGrad)" dot={false} name="rollingAvg" isAnimationActive animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1.5 text-[11px] text-text-muted">
              Daily weight jumps are normal — watch the weekly average.
            </p>
          </>
        )}

        {/* Entry list with delete */}
        {allWeightLogs.length > 0 && (
          <button
            onClick={() => setShowWeightEntries((v) => !v)}
            className="mt-3 flex w-full items-center justify-between text-xs font-medium text-text-secondary hover:text-text"
          >
            <span>{showWeightEntries ? "Hide" : "Show"} {allWeightLogs.length} entries</span>
            {showWeightEntries ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        )}
        <AnimatePresence>
          {showWeightEntries && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-border rounded-xl border border-border">
                {[...allWeightLogs].reverse().map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-text">{log.weightKg} kg</p>
                      <p className="text-xs text-text-muted">{log.date}</p>
                    </div>
                    <button onClick={() => setDeletingWeightId(log.id)} className="text-text-muted hover:text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ─── Waist ─── */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-text">Waist</h2>
            <div className="mt-0.5 flex items-center gap-2">
              {latestWaist != null && (
                <span className="text-sm font-bold text-text">{latestWaist} cm</span>
              )}
              {waistDelta != null && waistDelta !== 0 && (
                <span className={cn("flex items-center gap-0.5 text-xs font-semibold", waistDelta < 0 ? "text-met" : "text-danger")}>
                  {waistDelta < 0 ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
                  {Math.abs(waistDelta)} cm
                </span>
              )}
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setLoggingWaist(true)}>
            <Plus className="size-3.5" /> Log
          </Button>
        </div>

        <div className="mt-3 flex gap-1 rounded-xl bg-surface-2 p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setWaistPeriod(p)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-semibold transition",
                waistPeriod === p ? "bg-accent text-accent-foreground" : "text-text-secondary hover:text-text",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {filteredWaistLogs.length === 0 ? (
          <EmptyState icon={Ruler} title="No waist logged yet" description="Measure at belly button, same time each week." />
        ) : (
          <div className="mt-3 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={downsample(filteredWaistLogs)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="waistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} width={34} domain={["auto", "auto"]} />
                <Tooltip content={<WaistTooltip />} />
                <Area type="monotone" dataKey="waistCm" stroke="var(--color-accent)" strokeWidth={2.5} fill="url(#waistGrad)" dot={false} isAnimationActive animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {allWaistLogs.length > 0 && (
          <button
            onClick={() => setShowWaistEntries((v) => !v)}
            className="mt-3 flex w-full items-center justify-between text-xs font-medium text-text-secondary hover:text-text"
          >
            <span>{showWaistEntries ? "Hide" : "Show"} {allWaistLogs.length} entries</span>
            {showWaistEntries ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        )}
        <AnimatePresence>
          {showWaistEntries && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-border rounded-xl border border-border">
                {[...allWaistLogs].reverse().map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-text">{log.waistCm} cm</p>
                      <p className="text-xs text-text-muted">{log.date}</p>
                    </div>
                    <button onClick={() => setDeletingWaistId(log.id)} className="text-text-muted hover:text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ─── Progress photos ─── */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-text">Progress photos</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-surface-2 p-0.5">
              {(["FRONT", "SIDE", "BACK"] as Angle[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setUploadAngle(a)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-xs font-medium transition",
                    uploadAngle === a ? "bg-accent text-accent-foreground" : "text-text-secondary",
                  )}
                >
                  {a[0] + a.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              className="flex items-center gap-1 rounded-xl bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-text disabled:opacity-50"
            >
              <Upload className="size-3.5" /> {uploadPhoto.isPending ? "…" : "Add"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>

        {allPhotos.length === 0 ? (
          <EmptyState icon={Camera} title="No photos yet" description="Take front, side, and back shots every 2 weeks — same spot, same light." />
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {(["FRONT", "SIDE", "BACK"] as Angle[]).map((angle) => {
              const anglePhotos = photosByAngle(angle);
              if (anglePhotos.length === 0) return null;
              return (
                <div key={angle}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      {angle[0] + angle.slice(1).toLowerCase()}
                    </p>
                    {anglePhotos.length >= 2 && (
                      <button onClick={() => setCompareAngle(angle)} className="text-xs font-semibold text-accent">
                        Compare before / now
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {anglePhotos.map((photo) => (
                      <div key={photo.id} className="relative shrink-0">
                        <img
                          src={photo.url}
                          alt={`${angle} ${formatFriendlyDate(new Date(photo.date))}`}
                          className="h-28 w-20 rounded-xl object-cover"
                        />
                        <p className="mt-0.5 text-center text-[10px] text-text-muted">
                          {formatFriendlyDate(new Date(photo.date))}
                        </p>
                        <button
                          onClick={() => setDeletingPhotoId(photo.id)}
                          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
                          aria-label="Delete photo"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ─── Strength ─── */}
      <Card>
        <h2 className="font-semibold text-text">Strength progress</h2>
        <div className="mt-3">
          <ExerciseProgressChart />
        </div>
      </Card>

      {/* ─── Consistency ─── */}
      <Card>
        <h2 className="font-semibold text-text">Consistency</h2>
        <div className="mt-3">
          <AdherenceHeatmap entries={adherenceData?.adherence ?? []} />
        </div>
      </Card>

      {/* ─── Fullscreen compare ─── */}
      {compareAngle && currentAnglePhotos.length >= 2 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">
              {compareAngle[0] + compareAngle.slice(1).toLowerCase()} — before vs now
            </h2>
            <button onClick={() => setCompareAngle(null)} className="text-sm font-semibold text-accent">Done</button>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-4">
            {[currentAnglePhotos[0], currentAnglePhotos[currentAnglePhotos.length - 1]].map((photo, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-xs text-text-muted">{i === 0 ? "Before" : "Now"}</p>
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={photo.url}
                  alt=""
                  className="min-h-0 flex-1 w-full rounded-2xl object-cover"
                />
                <p className="text-center text-[11px] text-text-muted">{formatFriendlyDate(new Date(photo.date))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loggingWeight && <LogWeightSheet onClose={() => setLoggingWeight(false)} />}
      {loggingWaist && <LogWaistSheet onClose={() => setLoggingWaist(false)} />}

      {deletingWeightId && (
        <ConfirmSheet
          title="Delete this entry?"
          description="This removes the weight log. You can log again anytime."
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteWeight.mutate(deletingWeightId)}
          onClose={() => setDeletingWeightId(null)}
        />
      )}

      {deletingWaistId && (
        <ConfirmSheet
          title="Delete this entry?"
          description="This removes the waist measurement."
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteWaist.mutate(deletingWaistId)}
          onClose={() => setDeletingWaistId(null)}
        />
      )}

      {deletingPhotoId && (
        <ConfirmSheet
          title="Delete this photo?"
          description="This permanently removes the progress photo. This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => deletePhoto.mutate(deletingPhotoId)}
          onClose={() => setDeletingPhotoId(null)}
        />
      )}
    </div>
  );
}
