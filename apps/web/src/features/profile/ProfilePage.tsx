import { ChevronRight, LogOut, PhoneCall, Settings2, Sliders } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLogout, useMe } from "@/lib/useAuth";
import { EditNutritionTargetsSheet } from "./EditNutritionTargetsSheet";
import { EditGoalsSheet } from "./EditGoalsSheet";

export function ProfilePage() {
  const { data, isLoading } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const [editingGoals, setEditingGoals] = useState(false);
  const [editingNutrition, setEditingNutrition] = useState(false);

  if (isLoading || !data) return <Skeleton className="h-96" />;

  const { user, profile } = data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text">{user.name}</h1>
        <p className="text-sm text-text-secondary">{user.email}</p>
      </div>

      {profile && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text">Your targets</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setEditingNutrition(true)}
                className="flex items-center gap-1 text-xs font-semibold text-text-secondary"
                title="Override nutrition targets directly"
              >
                <Sliders className="size-3.5" /> Targets
              </button>
              <button
                onClick={() => setEditingGoals(true)}
                className="flex items-center gap-1 text-xs font-semibold text-accent"
              >
                <Settings2 className="size-3.5" /> Goals
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <Stat label="kcal" value={profile.dailyCalorieTarget} />
            <Stat label="protein" value={profile.proteinTargetG} unit="g" />
            <Stat label="carbs" value={profile.carbsTargetG} unit="g" />
            <Stat label="fat" value={profile.fatTargetG} unit="g" />
          </div>
        </Card>
      )}

      <Card className="divide-y divide-border p-0">
        <button
          onClick={() => navigate("/profile/call-a-trainer")}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <PhoneCall className="size-5 text-text-secondary" />
            <span className="text-sm font-medium text-text">Call a Trainer</span>
          </div>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            Coming soon <ChevronRight className="size-4" />
          </span>
        </button>
      </Card>

      <button
        onClick={() => logout.mutate()}
        className="flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold text-danger"
      >
        <LogOut className="size-4" /> Log out
      </button>

      {editingGoals && profile && <EditGoalsSheet profile={profile} onClose={() => setEditingGoals(false)} />}
      {editingNutrition && profile && (
        <EditNutritionTargetsSheet profile={profile} onClose={() => setEditingNutrition(false)} />
      )}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-text">
        {value ?? "–"}
        {unit}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-text-muted">{label}</p>
    </div>
  );
}
