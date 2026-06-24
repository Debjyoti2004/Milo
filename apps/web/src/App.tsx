import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/nav/AppShell";
import { Toaster } from "@/components/ui/Toaster";
import { RestTimerBar } from "@/components/workout/RestTimerBar";
import { queryClient } from "@/lib/queryClient";
import { RedirectIfAuthed, RequireAuth } from "@/app/guards";
import { LoginPage } from "@/features/auth/LoginPage";
import { SignupPage } from "@/features/auth/SignupPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { TodayPage } from "@/features/today/TodayPage";
import { WorkoutLayout } from "@/features/workout/WorkoutLayout";
import { PlanView } from "@/features/workout/PlanView";
import { HistoryView } from "@/features/workout/HistoryView";
import { LibraryView } from "@/features/workout/LibraryView";
import { ExerciseDetailPage } from "@/features/workout/ExerciseDetailPage";
import { SessionPage } from "@/features/workout/SessionPage";
import { FoodLayout } from "@/features/food/FoodLayout";
import { DiaryView } from "@/features/food/DiaryView";
import { FoodHistoryView } from "@/features/food/FoodHistoryView";
import { MyFoodsView } from "@/features/food/MyFoodsView";
import { ProgressPage } from "@/features/progress/ProgressPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { ComingSoonPage } from "@/features/profile/ComingSoonPage";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<RedirectIfAuthed />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route element={<AppShell />}>
              <Route path="/" element={<TodayPage />} />

              <Route path="/workout" element={<WorkoutLayout />}>
                <Route index element={<PlanView />} />
                <Route path="history" element={<HistoryView />} />
                <Route path="library" element={<LibraryView />} />
              </Route>
              <Route path="/workout/library/:exerciseId" element={<ExerciseDetailPage />} />
              <Route path="/workout/session/:sessionId" element={<SessionPage />} />

              <Route path="/food" element={<FoodLayout />}>
                <Route index element={<DiaryView />} />
                <Route path="history" element={<FoodHistoryView />} />
                <Route path="my-foods" element={<MyFoodsView />} />
              </Route>

              <Route path="/progress" element={<ProgressPage />} />

              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/call-a-trainer" element={<ComingSoonPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
      <RestTimerBar />
    </QueryClientProvider>
  );
}
