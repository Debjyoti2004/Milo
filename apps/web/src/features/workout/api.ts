import type { CreateExerciseInput, RoutineDayUpdateInput, RoutineExerciseUpdateInput, SetLogInput } from "@gym/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Exercise,
  ExerciseMedia,
  ExerciseProgressPoint,
  LastPerformance,
  Routine,
  RoutineExercise,
  SetLog,
  WorkoutSession,
} from "@/lib/types";

export function useActiveRoutine() {
  return useQuery({
    queryKey: ["routines", "active"],
    queryFn: () => api.get<{ routine: Routine }>("/routines/active"),
  });
}

export function useUpdateRoutineDay(dayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RoutineDayUpdateInput) =>
      api.patch<{ day: Routine["days"][number] }>(`/routines/days/${dayId}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routines", "active"] }),
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routineDayId: string | null) =>
      api.post<{ session: WorkoutSession }>("/sessions/start", { routineDayId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stats", "today"] }),
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: () => api.get<{ session: WorkoutSession }>(`/sessions/${sessionId}`),
    enabled: Boolean(sessionId),
  });
}

export function useSessionHistory(params: { take?: number } = {}) {
  return useQuery({
    queryKey: ["sessions", "history", params],
    queryFn: () =>
      api.get<{ sessions: WorkoutSession[]; nextCursor: string | null }>("/sessions", {
        take: params.take ?? 20,
      }),
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.patch<{ session: WorkoutSession }>(`/sessions/${sessionId}/complete`),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["sessions", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions", "history"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.delete(`/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", "history"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useAddSet(sessionId: string, sessionExerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetLogInput) =>
      api.post<{ set: SetLog }>(`/sessions/exercises/${sessionExerciseId}/sets`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions", sessionId] }),
  });
}

export function useDeleteSet(sessionId: string, sessionExerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (setId: string) => api.delete(`/sessions/exercises/${sessionExerciseId}/sets/${setId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions", sessionId] }),
  });
}

export function useAddSessionExercise(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      exerciseId: string;
      targetSets: number;
      targetRepsMin: number;
      targetRepsMax?: number | null;
    }) => api.post(`/sessions/${sessionId}/exercises`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions", sessionId] }),
  });
}

export function useExercises(params: { q?: string; muscle?: string }) {
  return useQuery({
    queryKey: ["exercises", params],
    queryFn: () =>
      api.get<{ exercises: Exercise[]; nextCursor: string | null }>("/exercises", {
        q: params.q,
        muscle: params.muscle,
        take: 60,
      }),
  });
}

export function useMuscleGroups() {
  return useQuery({
    queryKey: ["exercises", "muscles"],
    queryFn: () => api.get<{ muscles: string[] }>("/exercises/muscles"),
    staleTime: Infinity,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExerciseInput) => api.post<{ exercise: Exercise }>("/exercises", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) => api.delete(`/exercises/${exerciseId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useExercise(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ["exercises", exerciseId],
    queryFn: () => api.get<{ exercise: Exercise }>(`/exercises/${exerciseId}`),
    enabled: Boolean(exerciseId),
  });
}

export function useExerciseProgress(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ["stats", "exercise-progress", exerciseId],
    queryFn: () => api.get<{ progress: ExerciseProgressPoint[] }>(`/stats/exercises/${exerciseId}/progress`),
    enabled: Boolean(exerciseId),
  });
}

export function useLastPerformance(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ["exercises", exerciseId, "last-performance"],
    queryFn: () => api.get<LastPerformance>(`/exercises/${exerciseId}/last-performance`),
    enabled: Boolean(exerciseId),
  });
}

export function useUploadExerciseMedia(exerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<{ media: ExerciseMedia }>(`/exercises/${exerciseId}/media`, formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises", exerciseId] }),
  });
}

export function useDeleteExerciseMedia(exerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => api.delete(`/exercises/media/${mediaId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises", exerciseId] }),
  });
}

export function useSetPrimaryExerciseMedia(exerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => api.patch(`/exercises/media/${mediaId}/primary`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises", exerciseId] });
      queryClient.invalidateQueries({ queryKey: ["routines", "active"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useUpdateRoutineExercise(routineExerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RoutineExerciseUpdateInput) =>
      api.patch<{ routineExercise: RoutineExercise }>(`/routines/exercises/${routineExerciseId}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routines", "active"] }),
  });
}

export function useUpdateRotationPool(routineExerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exerciseIds: string[]) =>
      api.patch<{ routineExercise: RoutineExercise }>(
        `/routines/exercises/${routineExerciseId}/alternatives`,
        { exerciseIds },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routines", "active"] }),
  });
}

export function useRotateRoutineExercise(routineExerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (direction: "prev" | "next") =>
      api.post<{ routineExercise: RoutineExercise }>(
        `/routines/exercises/${routineExerciseId}/rotate`,
        { direction },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["routines", "active"] }),
  });
}

export function recordRestTaken(sessionExerciseId: string, setId: string, restSecondsAfter: number) {
  return api.patch(`/sessions/exercises/${sessionExerciseId}/sets/${setId}/rest`, { restSecondsAfter });
}
