import { Job } from "../lib/api";

const STATUS_STYLES: Record<string, string> = {
  QUEUED: "text-slate-soft border-slate-soft/40",
  PROCESSING: "text-amber border-amber/40 animate-pulse",
  COMPLETED: "text-violet border-violet/40",
  FAILED: "text-red-400 border-red-400/40",
  FLAGGED: "text-red-400 border-red-400/40",
};

export function JobCard({
  job,
  onToggleFavorite,
  onToggleVisibility,
  ownerLabel,
}: {
  job: Job;
  onToggleFavorite?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  ownerLabel?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-soft/15 bg-slate-soft/5">
      <div className="aspect-square w-full bg-slate-soft/10">
        {job.resultUrl ? (
          <img src={job.resultUrl} alt={job.prompt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className={`rounded-full border px-3 py-1 text-xs font-mono ${STATUS_STYLES[job.status]}`}>
              {job.status.toLowerCase()}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="line-clamp-2 text-sm text-slate-soft" title={job.prompt}>
          {job.prompt}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-full bg-slate-soft/10 px-2 py-0.5 font-mono text-[11px] text-slate-soft">
            {job.model}
          </span>
          {ownerLabel && <span className="text-[11px] text-slate-soft">{ownerLabel}</span>}
        </div>
      </div>

      {(onToggleFavorite || onToggleVisibility) && (
        <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(job.id)}
              aria-label={job.isFavorite ? "Remove from favorites" : "Add to favorites"}
              className={`rounded-full px-2.5 py-1 text-xs backdrop-blur-md ${
                job.isFavorite ? "bg-amber text-white" : "bg-ink/60 text-white"
              }`}
            >
              ★
            </button>
          )}
          {onToggleVisibility && (
            <button
              onClick={() => onToggleVisibility(job.id)}
              aria-label={job.isPublic ? "Make private" : "Publish to public gallery"}
              className={`rounded-full px-2.5 py-1 text-xs backdrop-blur-md ${
                job.isPublic ? "bg-violet text-white" : "bg-ink/60 text-white"
              }`}
            >
              {job.isPublic ? "Public" : "Private"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
