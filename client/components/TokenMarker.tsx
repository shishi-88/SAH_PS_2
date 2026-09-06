import { cn } from "@/lib/utils";
import type { AssessmentPrompt, TokenError, TokenObservation } from "@/domain/types";

const cycle: Array<TokenError | null> = [null, "wrong", "skipped", "hesitation"];

export default function TokenMarker({
  prompt,
  observations,
  onChange,
}: {
  prompt: AssessmentPrompt;
  observations: TokenObservation[];
  onChange: (next: TokenObservation[]) => void;
}) {
  function mark(index: number) {
    const current = observations.find((o) => o.tokenIndex === index);
    const i = cycle.indexOf(current?.error ?? null);
    const nextError = cycle[(i + 1) % cycle.length];
    const rest = observations.filter((o) => o.tokenIndex !== index);
    onChange(nextError ? [...rest, { tokenIndex: index, error: nextError }] : rest);
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Tap a word each time you hear a slip. Cycle: clear → wrong → skipped → pause.
      </p>
      <div className="flex flex-wrap gap-2">
        {prompt.tokens.map((token, index) => {
          const obs = observations.find((o) => o.tokenIndex === index);
          return (
            <button
              key={`${token.text}-${index}`}
              type="button"
              onClick={() => mark(index)}
              className={cn(
                "min-h-11 rounded-2xl border px-3 py-2 text-base font-semibold",
                !obs && "border-border bg-card text-foreground",
                obs?.error === "wrong" &&
                  "border-secondary/40 bg-secondary/15 text-secondary",
                obs?.error === "skipped" &&
                  "border-status-priority/40 bg-status-priority/20 text-status-priority-foreground",
                obs?.error === "hesitation" &&
                  "border-status-attention/50 bg-status-attention/25 text-status-attention-foreground",
              )}
            >
              {token.text}
              {obs ? (
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide opacity-80">
                  {obs.error}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
