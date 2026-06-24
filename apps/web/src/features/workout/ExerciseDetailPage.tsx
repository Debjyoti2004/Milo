import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Repeat,
  Star,
  Timer,
  TrendingUp,
  Trash2,
  Upload,
  Watch,
} from "lucide-react";
import { useRef, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ExerciseThumbnail } from "@/components/workout/ExerciseThumbnail";
import { EditableNumber, EditableRepsRange, NumberStepper, PlanPill } from "@/components/workout/PlanControls";
import { RotationPickerSheet } from "@/components/workout/RotationPickerSheet";
import { StopwatchSheet } from "@/components/workout/StopwatchSheet";
import { ApiClientError } from "@/lib/api";
import { formatFriendlyDate, formatNumber } from "@/lib/format";
import { useToastStore } from "@/stores/toastStore";
import {
  useActiveRoutine,
  useDeleteExercise,
  useDeleteExerciseMedia,
  useExercise,
  useExerciseProgress,
  useLastPerformance,
  useRotateRoutineExercise,
  useSetPrimaryExerciseMedia,
  useUpdateRoutineExercise,
  useUploadExerciseMedia,
} from "./api";

export function ExerciseDetailPage() {
  const { exerciseId } = useParams();
  const [searchParams] = useSearchParams();
  const routineExerciseId = searchParams.get("routineExerciseId") ?? undefined;
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);

  const { data, isLoading } = useExercise(exerciseId);
  const { data: routineData } = useActiveRoutine();
  const { data: lastPerformance } = useLastPerformance(exerciseId);
  const [frame, setFrame] = useState(0);
  const [trackedExerciseId, setTrackedExerciseId] = useState(exerciseId);
  if (exerciseId !== trackedExerciseId) {
    setTrackedExerciseId(exerciseId);
    setFrame(0);
  }
  const [showRotationPicker, setShowRotationPicker] = useState(false);
  const [showStopwatch, setShowStopwatch] = useState(false);
  const [sameForOther, setSameForOther] = useState(false);
  const [deletingExercise, setDeletingExercise] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMedia = useUploadExerciseMedia(exerciseId ?? "");
  const deleteMedia = useDeleteExerciseMedia(exerciseId ?? "");
  const setPrimaryMedia = useSetPrimaryExerciseMedia(exerciseId ?? "");
  const deleteExercise = useDeleteExercise();
  const updateRoutineExercise = useUpdateRoutineExercise(routineExerciseId ?? "");
  const rotateExercise = useRotateRoutineExercise(routineExerciseId ?? "");

  const routineExercise = routineExerciseId
    ? routineData?.routine.days
        .flatMap((d) => d.exercises)
        .find((ex) => ex.id === routineExerciseId)
    : undefined;

  const userMedia = data?.exercise.media ?? [];
  const userMediaUrls = new Set(userMedia.map((m) => m.url));
  const defaultImages = (data?.exercise.images ?? []).filter((url) => !userMediaUrls.has(url));
  const frames = [
    ...userMedia.map((m) => ({ url: m.url, type: m.type, mediaId: m.id, isPrimary: m.isPrimary })),
    ...defaultImages.map((url) => ({ url, type: "IMAGE" as const, mediaId: undefined, isPrimary: false })),
  ];

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const { exercise } = data;
  const current = frames[frame];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMedia.mutate(file, {
      onSuccess: () => showToast("Media uploaded", "success"),
      onError: () => showToast("Couldn't upload media", "error"),
    });
    e.target.value = "";
  };

  const handleDeleteCurrent = () => {
    if (!current?.mediaId) return;
    deleteMedia.mutate(current.mediaId, {
      onSuccess: () => {
        showToast("Media removed", "success");
        setFrame(0);
      },
      onError: () => showToast("Couldn't remove media", "error"),
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
        <button
          onClick={() => setShowStopwatch(true)}
          className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text"
        >
          <Watch className="size-4" /> Stopwatch
        </button>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-surface-2">
        {current && current.type === "VIDEO" ? (
          <video src={current.url} className="size-full object-cover" controls playsInline muted />
        ) : current ? (
          <img
            src={current.url}
            alt={exercise.name}
            className="size-full cursor-pointer object-cover"
            onClick={() => setFrame((f) => (f + 1) % Math.max(frames.length, 1))}
          />
        ) : (
          <ExerciseThumbnail
            exercise={{ images: [], media: [], name: exercise.name }}
            className="size-full"
            textClassName="text-6xl"
          />
        )}

        {current?.mediaId && (
          <button
            onClick={() => setDeletingMedia(true)}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Delete this media"
          >
            <Trash2 className="size-4" />
          </button>
        )}

        {current?.mediaId && current.isPrimary && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            <Star className="size-3 fill-current" /> Main
          </span>
        )}

        {current?.mediaId && !current.isPrimary && (
          <button
            onClick={() =>
              setPrimaryMedia.mutate(current.mediaId!, {
                onSuccess: () => showToast("Set as main image", "success"),
                onError: () => showToast("Couldn't set main image", "error"),
              })
            }
            disabled={setPrimaryMedia.isPending}
            className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black/80 disabled:opacity-50"
          >
            <Star className="size-3" /> Set as main
          </button>
        )}

        {frames.length > 1 && (
          <>
            <button
              onClick={() => setFrame((f) => (f - 1 + frames.length) % frames.length)}
              className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              aria-label="Previous media"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setFrame((f) => (f + 1) % frames.length)}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              aria-label="Next media"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {frames.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFrame(i)}
                  aria-label={`Show media ${i + 1}`}
                  className={`size-1.5 rounded-full transition ${i === frame ? "bg-accent" : "bg-white/40"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMedia.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-text-secondary hover:border-accent hover:text-text disabled:opacity-50"
        >
          <Upload className="size-4" />
          {uploadMedia.isPending ? "Uploading…" : "Upload your own photo or GIF/video"}
        </button>
      </div>

      {routineExercise && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Plan</h2>
            <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
              {(["REPS", "TIME", "BOTH"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateRoutineExercise.mutate({ trackingMode: mode })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    routineExercise.trackingMode === mode
                      ? "bg-accent text-accent-foreground"
                      : "text-text-secondary"
                  }`}
                >
                  {mode === "REPS" ? "Reps" : mode === "TIME" ? "Time" : "Both"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <PlanPill icon={Repeat} label="Set">
              <NumberStepper
                value={routineExercise.targetSets}
                onCommit={(v) =>
                  updateRoutineExercise.mutate({ targetSets: v, applyToOtherDayExercises: sameForOther })
                }
              />
            </PlanPill>

            {routineExercise.trackingMode !== "TIME" && (
              <PlanPill icon={Repeat} label="Reps">
                <EditableRepsRange
                  min={routineExercise.targetRepsMin}
                  max={routineExercise.targetRepsMax}
                  onCommit={(min, max) =>
                    updateRoutineExercise.mutate({
                      targetRepsMin: min,
                      targetRepsMax: max,
                      applyToOtherDayExercises: sameForOther,
                    })
                  }
                />
              </PlanPill>
            )}

            {routineExercise.trackingMode !== "REPS" && (
              <PlanPill icon={Watch} label="Hold">
                <EditableNumber
                  value={routineExercise.targetHoldSeconds ?? 0}
                  suffix="s"
                  onCommit={(v) =>
                    updateRoutineExercise.mutate({
                      targetHoldSeconds: v,
                      applyToOtherDayExercises: sameForOther,
                    })
                  }
                />
              </PlanPill>
            )}

            <PlanPill icon={Repeat} label="Rotation">
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => {
                    if (routineExercise.alternativeExerciseIds.length > 1) {
                      rotateExercise.mutate("prev");
                    } else {
                      showToast("Add alternatives to enable rotation", "info");
                      setShowRotationPicker(true);
                    }
                  }}
                  className="flex size-7 items-center justify-center rounded-lg bg-surface text-text-secondary hover:text-text"
                  aria-label="Previous variation"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  onClick={() => setShowRotationPicker(true)}
                  className="max-w-[6.5rem] truncate text-xs font-semibold text-text"
                >
                  {routineExercise.exercise.name}
                </button>
                <button
                  onClick={() => {
                    if (routineExercise.alternativeExerciseIds.length > 1) {
                      rotateExercise.mutate("next");
                    } else {
                      showToast("Add alternatives to enable rotation", "info");
                      setShowRotationPicker(true);
                    }
                  }}
                  className="flex size-7 items-center justify-center rounded-lg bg-surface text-text-secondary hover:text-text"
                  aria-label="Next variation"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </PlanPill>

            <PlanPill icon={Timer} label="Rest">
              <EditableNumber
                value={routineExercise.restSeconds}
                suffix="s"
                onCommit={(v) =>
                  updateRoutineExercise.mutate({
                    restSeconds: v,
                    applyToOtherDayExercises: sameForOther,
                  })
                }
              />
            </PlanPill>

            <PlanPill icon={Dumbbell} label="KG">
              <EditableNumber
                value={routineExercise.defaultWeightKg ?? 0}
                suffix="kg"
                onCommit={(v) =>
                  updateRoutineExercise.mutate({
                    defaultWeightKg: v,
                    applyToOtherDayExercises: sameForOther,
                  })
                }
              />
            </PlanPill>
          </div>

          {lastPerformance?.progressionSuggestion && (
            <p className="mt-3 text-xs font-semibold text-met">
              💪 Add +{lastPerformance.progressionSuggestion.incrementKg}kg next time — you've topped your rep
              range two sessions running.
            </p>
          )}

          <label className="mt-4 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
            <span className="text-sm text-text-secondary">Same for other exercises today</span>
            <button
              role="switch"
              aria-checked={sameForOther}
              onClick={() => setSameForOther((v) => !v)}
              className={`relative h-6 w-10 shrink-0 rounded-full transition ${
                sameForOther ? "bg-accent" : "bg-surface"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition ${
                  sameForOther ? "left-[1.125rem]" : "left-0.5"
                }`}
              />
            </button>
          </label>
        </Card>
      )}

      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-text">{exercise.name}</h1>
          {exercise.isCustom && (
            <button
              onClick={() => setDeletingExercise(true)}
              className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/10"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {exercise.primaryMuscles.map((m) => (
            <Tag key={m} label={m} accent />
          ))}
          {exercise.secondaryMuscles.map((m) => (
            <Tag key={m} label={m} />
          ))}
          {exercise.equipment && <Tag label={exercise.equipment} />}
          {exercise.level && <Tag label={exercise.level} />}
        </div>
      </div>

      <ExerciseHistoryCard exerciseId={exercise.id} />

      {exercise.instructions.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            How to do it
          </h2>
          <ol className="flex flex-col gap-3">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-secondary">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-text">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {showRotationPicker && routineExercise && (
        <RotationPickerSheet
          routineExerciseId={routineExercise.id}
          currentExerciseId={routineExercise.exerciseId}
          currentExerciseName={routineExercise.exercise.name}
          pool={routineExercise.alternativeExerciseIds}
          onClose={() => setShowRotationPicker(false)}
        />
      )}

      {showStopwatch && <StopwatchSheet onClose={() => setShowStopwatch(false)} />}

      {deletingMedia && (
        <ConfirmSheet
          title="Delete this media?"
          description="This removes the photo or video. This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteCurrent}
          onClose={() => setDeletingMedia(false)}
        />
      )}

      {deletingExercise && (
        <ConfirmSheet
          title="Delete this exercise?"
          description="This permanently removes the exercise and any photos/videos you uploaded for it. This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            deleteExercise.mutate(exercise.id, {
              onSuccess: () => {
                showToast("Exercise deleted", "success");
                navigate("/workout/library");
              },
              onError: (err) => {
                const message = err instanceof ApiClientError ? err.message : "Couldn't delete exercise";
                showToast(message, "error");
              },
            });
          }}
          onClose={() => setDeletingExercise(false)}
        />
      )}
    </div>
  );
}

function ExerciseHistoryCard({ exerciseId }: { exerciseId: string }) {
  const { data, isLoading } = useExerciseProgress(exerciseId);
  const points = data?.progress ?? [];

  if (isLoading) {
    return <Skeleton className="h-40" />;
  }

  if (points.length === 0) {
    return (
      <Card>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">History</h2>
        <EmptyState
          icon={TrendingUp}
          title="No history yet"
          description="Log this exercise in a workout to start tracking your progress."
        />
      </Card>
    );
  }

  const chartData = points.map((p) => ({
    date: formatFriendlyDate(new Date(p.date)),
    maxWeightKg: p.maxWeightKg,
  }));
  const recent = [...points].reverse().slice(0, 5);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">History</h2>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              contentStyle={{ background: "var(--color-surface-2)", border: "none", borderRadius: 12, fontSize: 12 }}
            />
            <Line type="monotone" dataKey="maxWeightKg" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-col divide-y divide-border">
        {recent.map((p, i) => (
          <div key={i} className="flex items-center justify-between py-2 text-sm">
            <span className="text-text-secondary">{formatFriendlyDate(new Date(p.date))}</span>
            <span className="text-text-muted">
              <span className="font-semibold text-text">{formatNumber(p.maxWeightKg, 1)}kg</span> max ·{" "}
              {formatNumber(p.totalVolumeKg)}kg volume · {p.totalReps} reps
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Tag({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        accent ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-secondary"
      }`}
    >
      {label}
    </span>
  );
}
