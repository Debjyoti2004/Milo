import { cn } from "@/lib/cn";
import type { Exercise } from "@/lib/types";

function resolveDisplayMedia(
  exercise: Pick<Exercise, "images" | "media">,
): { url: string; isVideo: boolean } | undefined {
  const primary = exercise.media?.[0];
  if (primary) return { url: primary.url, isVideo: primary.type === "VIDEO" };
  if (exercise.images[0]) return { url: exercise.images[0], isVideo: false };
  return undefined;
}

export function ExerciseThumbnail({
  exercise,
  className,
  textClassName = "text-lg",
}: {
  exercise: Pick<Exercise, "images" | "media" | "name">;
  className?: string;
  textClassName?: string;
}) {
  const display = resolveDisplayMedia(exercise);

  if (display?.isVideo) {
    return (
      <video
        src={display.url}
        className={cn("object-cover", className)}
        muted
        loop
        autoPlay
        playsInline
      />
    );
  }

  if (display) {
    return <img src={display.url} alt={exercise.name} loading="lazy" className={cn("object-cover", className)} />;
  }

  const initial = exercise.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-accent/25 to-accent/5",
        className,
      )}
    >
      <span className={cn("font-bold text-accent", textClassName)}>{initial}</span>
    </div>
  );
}
