import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "@/lib/useAuth";

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Loader2 className="size-6 animate-spin text-accent" />
    </div>
  );
}

export function RequireAuth() {
  const { data, isLoading, isError } = useMe();
  const location = useLocation();

  if (isLoading) return <FullScreenSpinner />;
  if (isError || !data?.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!data.profile?.onboardingCompletedAt && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function RedirectIfAuthed() {
  const { data, isLoading } = useMe();

  if (isLoading) return <FullScreenSpinner />;
  if (data?.user) {
    return <Navigate to={data.profile?.onboardingCompletedAt ? "/" : "/onboarding"} replace />;
  }

  return <Outlet />;
}
