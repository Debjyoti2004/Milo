import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";

const TABS = [
  { value: "/workout", label: "Plan" },
  { value: "/workout/history", label: "History" },
  { value: "/workout/library", label: "Library" },
];

export function WorkoutLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = TABS.find((t) => t.value === location.pathname)?.value ?? "/workout";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-text">Workout</h1>
      <SegmentedTabs options={TABS} value={active} onChange={(value) => navigate(value)} />
      <Outlet />
    </div>
  );
}
