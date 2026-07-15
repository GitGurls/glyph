import { FormEvent, useEffect, useState } from "react";
import { api, Job } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useJobSocket } from "../lib/useJobSocket";
import { JobCard } from "../components/JobCard";

const MODELS = [
  { id: "image", label: "Image", cost: 5 },
  { id: "face-swap", label: "Face swap", cost: 8 },
  { id: "video", label: "Video", cost: 15 },
];

interface Template {
  id: string;
  title: string;
  template: string;
  category: string;
}

export default function Dashboard() {
  const { user, refreshUser, setCredits } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("image");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/generate/jobs").then((r) => setJobs(r.data.jobs));
    api.get("/gallery/templates").then((r) => setTemplates(r.data.templates));
  }, []);

  useJobSocket((update) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === update.imageId ? { ...j, status: update.status as Job["status"], resultUrl: update.resultUrl || j.resultUrl } : j))
    );
  });

  async function handleEnhance() {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const { data } = await api.post("/generate/enhance", { prompt });
      setPrompt(data.enhanced);
    } finally {
      setEnhancing(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post("/generate", { prompt, model });
      setJobs((prev) => [data.job, ...prev]);
      setCredits(data.creditsRemaining);
      setPrompt("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Generation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleFavorite(id: string) {
    const { data } = await api.patch(`/generate/jobs/${id}/favorite`);
    setJobs((prev) => prev.map((j) => (j.id === id ? data.job : j)));
  }

  async function toggleVisibility(id: string) {
    const { data } = await api.patch(`/generate/jobs/${id}/visibility`);
    setJobs((prev) => prev.map((j) => (j.id === id ? data.job : j)));
  }

  const selectedModel = MODELS.find((m) => m.id === model)!;
  const canAfford = (user?.credits ?? 0) >= selectedModel.cost;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Generate</h1>
      <p className="mt-1 text-slate-soft">Describe it, enhance it, send it to the queue.</p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-slate-soft/15 p-5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A lone lighthouse on a cliff at dusk, storm rolling in…"
          rows={3}
          required
          className="w-full resize-none bg-transparent text-lg outline-none placeholder:text-slate-soft/60"
        />

        {templates.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {templates.slice(0, 5).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPrompt(t.template)}
                className="rounded-full border border-slate-soft/25 px-3 py-1 text-xs text-slate-soft hover:border-violet hover:text-violet"
              >
                {t.title}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-soft/15 pt-4">
          <div className="flex items-center gap-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModel(m.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  model === m.id ? "border-violet bg-violet/10 text-violet" : "border-slate-soft/25 text-slate-soft"
                }`}
              >
                {m.label} · {m.cost}cr
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleEnhance}
              disabled={enhancing || !prompt.trim()}
              className="rounded-full border border-amber/40 px-4 py-2 text-sm font-medium text-amber disabled:opacity-50"
            >
              {enhancing ? "Enhancing…" : "✦ Enhance prompt"}
            </button>
            <button
              type="submit"
              disabled={submitting || !canAfford}
              className="rounded-full bg-glyph-gradient px-6 py-2.5 font-semibold text-white disabled:opacity-50"
              title={!canAfford ? "Not enough credits" : undefined}
            >
              {submitting ? "Queuing…" : `Generate — ${selectedModel.cost} credits`}
            </button>
          </div>
        </div>
        {!canAfford && (
          <p className="mt-2 text-sm text-amber">Not enough credits for this model. Top up on the Pricing page.</p>
        )}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </form>

      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold">Your generations</h2>
        {jobs.length === 0 ? (
          <p className="mt-3 text-slate-soft">Nothing yet — your first generation will show up here.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onToggleFavorite={toggleFavorite} onToggleVisibility={toggleVisibility} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
