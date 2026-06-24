import { zodResolver } from "@hookform/resolvers/zod";
import {
  ACTIVITY_LEVELS,
  EXPERIENCE_LEVELS,
  GENDERS,
  GOALS,
  onboardingSchema,
  type OnboardingInput,
} from "@gym/shared";
import { calculateDailyTargets } from "@gym/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/Field";
import { api, ApiClientError } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";

const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: "Sedentary (little to no exercise)",
  LIGHT: "Lightly active (1-3 days/week)",
  MODERATE: "Moderately active (3-5 days/week)",
  ACTIVE: "Active (6-7 days/week)",
  VERY_ACTIVE: "Very active (physical job + training)",
};

const GOAL_LABELS: Record<string, string> = {
  LOSE_FAT: "Lose fat",
  MAINTAIN: "Maintain",
  BUILD_MUSCLE: "Build muscle",
  RECOMP: "Recomp (lose fat, keep muscle)",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  BEGINNER: "Beginner (< 1 year)",
  INTERMEDIATE: "Intermediate (1-3 years)",
  ADVANCED: "Advanced (3+ years)",
};

const STEPS = ["Basics", "Goals", "Review"] as const;

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { unitPreference: "KG", trainingDaysPerWeek: 6 },
  });

  const onboard = useMutation({
    mutationFn: (input: OnboardingInput) => api.post("/profile/onboarding", input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/");
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Couldn't save your profile";
      showToast(message, "error");
    },
  });

  const values = watch();
  const preview =
    values.gender && values.heightCm && values.currentWeightKg && values.activityLevel && values.goal && values.dateOfBirth
      ? calculateDailyTargets({
          gender: values.gender,
          weightKg: Number(values.currentWeightKg),
          heightCm: Number(values.heightCm),
          age: Math.max(1, new Date().getFullYear() - new Date(values.dateOfBirth).getFullYear()),
          activityLevel: values.activityLevel,
          goal: values.goal,
        })
      : null;

  const goNext = async () => {
    const fieldsByStep: (keyof OnboardingInput)[][] = [
      ["gender", "dateOfBirth", "heightCm", "currentWeightKg"],
      ["activityLevel", "goal", "experienceLevel", "trainingDaysPerWeek"],
    ];
    const valid = await trigger(fieldsByStep[step]);
    if (valid) setStep((s) => s + 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg px-6 py-10">
      <div className="mx-auto w-full max-w-md flex-1">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Flame className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{STEPS[step]}</p>
            <p className="text-xs text-text-muted">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-surface-2"}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit((input) => onboard.mutate(input))} className="flex flex-col gap-4">
          {step === 0 && (
            <>
              <FieldWrapper label="Gender" error={errors.gender?.message}>
                <Select {...register("gender")}>
                  <option value="">Select…</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Date of birth" error={errors.dateOfBirth?.message}>
                <Input type="date" {...register("dateOfBirth")} />
              </FieldWrapper>
              <FieldWrapper label="Height (cm)" error={errors.heightCm?.message}>
                <Input type="number" step="0.1" placeholder="175" {...register("heightCm", { valueAsNumber: true })} />
              </FieldWrapper>
              <FieldWrapper label="Current weight (kg)" error={errors.currentWeightKg?.message}>
                <Input type="number" step="0.1" placeholder="70" {...register("currentWeightKg", { valueAsNumber: true })} />
              </FieldWrapper>
              <FieldWrapper label="Target weight (kg) — optional" error={errors.targetWeightKg?.message}>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="optional"
                  {...register("targetWeightKg", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
              </FieldWrapper>
              <Button type="button" size="lg" className="mt-2" onClick={goNext}>
                Continue
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <FieldWrapper label="Activity level" error={errors.activityLevel?.message}>
                <Select {...register("activityLevel")}>
                  <option value="">Select…</option>
                  {ACTIVITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {ACTIVITY_LABELS[level]}
                    </option>
                  ))}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Goal" error={errors.goal?.message}>
                <Select {...register("goal")}>
                  <option value="">Select…</option>
                  {GOALS.map((goal) => (
                    <option key={goal} value={goal}>
                      {GOAL_LABELS[goal]}
                    </option>
                  ))}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Training experience" error={errors.experienceLevel?.message}>
                <Select {...register("experienceLevel")}>
                  <option value="">Select…</option>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {EXPERIENCE_LABELS[level]}
                    </option>
                  ))}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Training days per week" error={errors.trainingDaysPerWeek?.message}>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  {...register("trainingDaysPerWeek", { valueAsNumber: true })}
                />
              </FieldWrapper>
              <div className="mt-2 flex gap-3">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button type="button" size="lg" className="flex-1" onClick={goNext}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-text-secondary">
                Based on your answers, here's where we'll start. You can fine-tune these anytime from
                Profile.
              </p>
              {preview && (
                <div className="grid grid-cols-2 gap-3">
                  <StatPreview label="Daily calories" value={`${preview.calories} kcal`} />
                  <StatPreview label="Protein" value={`${preview.proteinG} g`} />
                  <StatPreview label="Carbs" value={`${preview.carbsG} g`} />
                  <StatPreview label="Fat" value={`${preview.fatG} g`} />
                </div>
              )}
              <p className="text-xs text-text-muted">
                We've also set up your Monday-Sunday workout split — editable from the Workout tab.
              </p>
              <div className="mt-2 flex gap-3">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" size="lg" className="flex-1" loading={onboard.isPending}>
                  Finish setup
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function StatPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-text">{value}</p>
    </div>
  );
}
