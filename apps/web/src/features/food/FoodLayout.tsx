import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";

const TABS = [
  { value: "/food", label: "Diary" },
  { value: "/food/history", label: "History" },
  { value: "/food/my-foods", label: "My Foods" },
];

export function FoodLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = TABS.find((t) => t.value === location.pathname)?.value ?? "/food";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-text">Food</h1>
      <SegmentedTabs options={TABS} value={active} onChange={(value) => navigate(value)} />
      <Outlet />
    </div>
  );
}
