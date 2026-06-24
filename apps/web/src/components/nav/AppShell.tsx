import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-bg lg:pl-64">
      <Sidebar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 lg:max-w-5xl lg:px-8 lg:pb-10 lg:pt-8 2xl:max-w-6xl">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
