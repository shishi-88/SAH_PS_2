import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useApp } from "@/state/AppProvider";
import type { AvatarTint, Grade } from "@/domain/types";

const tints: AvatarTint[] = ["teal", "coral", "sand", "sage"];

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { snapshot, upsertStudent, ready } = useApp();
  const existing = snapshot.students.find((s) => s.id === id);

  const [name, setName] = useState(existing?.name ?? "");
  const [grade, setGrade] = useState<Grade>(existing?.grade ?? 1);
  const [rollNo, setRollNo] = useState(existing?.rollNo ?? "");
  const [avatarTint, setAvatarTint] = useState<AvatarTint>(existing?.avatarTint ?? "teal");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(existing?.name ?? "");
    setGrade(existing?.grade ?? 1);
    setRollNo(existing?.rollNo ?? "");
    setAvatarTint(existing?.avatarTint ?? "teal");
  }, [existing?.id]);

  if (!ready) return null;

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || !rollNo.trim()) return;
        setBusy(true);
        const saved = await upsertStudent({
          id: existing?.id,
          name: name.trim(),
          grade,
          rollNo: rollNo.trim(),
          avatarTint,
        });
        setBusy(false);
        navigate(`/students/${saved.id}`);
      }}
    >
      <h1 className="font-heading text-2xl font-bold">
        {existing ? "Edit student" : "Add a student"}
      </h1>
      <label className="block text-sm font-semibold">
        Name
        <input
          required
          className="mt-1 h-12 w-full rounded-2xl border border-border bg-card px-3 text-base font-normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block text-sm font-semibold">
        Grade
        <select
          className="mt-1 h-12 w-full rounded-2xl border border-border bg-card px-3 text-base font-normal"
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value) as Grade)}
        >
          <option value={1}>Class 1</option>
          <option value={2}>Class 2</option>
          <option value={3}>Class 3</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Roll / local ID
        <input
          required
          className="mt-1 h-12 w-full rounded-2xl border border-border bg-card px-3 text-base font-normal"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">Avatar colour</legend>
        <div className="mt-2 flex gap-2">
          {tints.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAvatarTint(t)}
              className={`h-11 flex-1 rounded-full capitalize ${
                avatarTint === t ? "ring-2 ring-primary" : ""
              } ${
                t === "teal"
                  ? "bg-primary/20"
                  : t === "coral"
                    ? "bg-secondary/25"
                    : t === "sand"
                      ? "bg-status-attention/30"
                      : "bg-status-ontrack/25"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>
      <Button className="w-full rounded-full" size="lg" disabled={busy}>
        {existing ? "Save changes" : "Save student"}
      </Button>
    </form>
  );
}
