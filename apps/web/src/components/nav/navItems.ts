import { Dumbbell, LineChart, type LucideIcon, Salad, User2, Zap } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Today", icon: Zap },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/food", label: "Food", icon: Salad },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/profile", label: "Profile", icon: User2 },
];
