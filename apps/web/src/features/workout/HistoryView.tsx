import { CalendarDays, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatFriendlyDate } from "@/lib/format";
import { useToastStore } from "@/stores/toastStore";
import { useDeleteSession, useSessionHistory } from "./api";

export function HistoryView() {
  const { data, isLoading } = useSessionHistory({ take: 30 });
  const deleteSession = useDeleteSession();
  const showToast = useToastStore((s) => s.show);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  const sessions = data?.sessions ?? [];

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No workouts logged yet"
        description="Start a session from the Plan tab to see it here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => {
        const metCount = session.exercises.filter((e) => e.status === "MET").length;
        return (
          <Card key={session.id} className="flex items-center justify-between transition active:scale-[0.99]">
            <Link to={`/workout/session/${session.id}`} className="flex flex-1 items-center gap-3">
              {session.completedAt ? (
                <CheckCircle2 className="size-5 text-met" />
              ) : (
                <Circle className="size-5 text-text-muted" />
              )}
              <div>
                <p className="font-semibold text-text">{formatFriendlyDate(new Date(session.date))}</p>
                <p className="text-xs text-text-muted">
                  {session.exercises.length} exercises · {metCount} hit target
                </p>
              </div>
            </Link>
            <button
              onClick={() => setDeletingId(session.id)}
              className="p-2 text-text-muted hover:text-danger"
              aria-label="Delete session"
            >
              <Trash2 className="size-4" />
            </button>
          </Card>
        );
      })}

      {deletingId && (
        <ConfirmSheet
          title="Delete this workout?"
          description="This permanently removes the session and all its logged sets. This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            deleteSession.mutate(deletingId, {
              onSuccess: () => showToast("Workout deleted", "success"),
              onError: () => showToast("Couldn't delete workout", "error"),
            });
          }}
          onClose={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
