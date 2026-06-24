import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useToastStore } from "@/stores/toastStore";
import { useCreateExercise, useMuscleGroups } from "@/features/workout/api";

export function AddCustomExerciseSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const { data: muscleData } = useMuscleGroups();
  const createExercise = useCreateExercise();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles((prev) => {
      const next = new Set(prev);
      if (next.has(muscle)) next.delete(muscle);
      else next.add(muscle);
      return next;
    });
  };

  const handleCreate = () => {
    if (!name.trim() || selectedMuscles.size === 0) {
      showToast("Add a name and pick at least one muscle group", "error");
      return;
    }
    createExercise.mutate(
      { name: name.trim(), primaryMuscles: [...selectedMuscles], notes: notes.trim() || null },
      {
        onSuccess: async ({ exercise }) => {
          if (file) {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", file);
            try {
              await api.upload(`/exercises/${exercise.id}/media`, formData);
            } catch {
              showToast("Exercise added, but the media upload failed — try again from the exercise page", "info");
            }
            setUploading(false);
          }
          showToast("Exercise added", "success");
          onClose();
          navigate(`/workout/library/${exercise.id}`);
        },
        onError: () => showToast("Couldn't add exercise", "error"),
      },
    );
  };

  return (
    <Sheet open onClose={onClose} title="Add custom exercise">
      <div className="flex flex-col gap-4">
        <FieldWrapper label="Name">
          <Input placeholder="e.g. Cable Y-Raise" value={name} onChange={(e) => setName(e.target.value)} />
        </FieldWrapper>

        <FieldWrapper label="Muscle group">
          <div className="flex flex-wrap gap-2">
            {muscleData?.muscles.map((m) => (
              <button
                key={m}
                onClick={() => toggleMuscle(m)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition",
                  selectedMuscles.has(m)
                    ? "bg-accent text-accent-foreground"
                    : "border border-border bg-surface text-text-secondary",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </FieldWrapper>

        <FieldWrapper label="Notes (optional)">
          <Input placeholder="How to do it…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FieldWrapper>

        <FieldWrapper label="Photo or GIF/video (optional)">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/quicktime"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-text-secondary hover:border-accent hover:text-text"
          >
            <Upload className="size-4" />
            {file ? file.name : "Choose a file"}
          </button>
        </FieldWrapper>

        <Button size="lg" onClick={handleCreate} loading={createExercise.isPending || uploading}>
          Add exercise
        </Button>
      </div>
    </Sheet>
  );
}
