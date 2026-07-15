import { useEffect, useState } from "react";
import { api, Job } from "../lib/api";
import { JobCard } from "../components/JobCard";
import { useAuth } from "../context/AuthContext";

export default function Gallery() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"public" | "favorites">("public");
  const [query, setQuery] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [jobs, setJobs] = useState<(Job & { user?: { name?: string; email: string } })[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      if (tab === "public") {
        const { data } = await api.get("/gallery/public", { params: { q: query || undefined, model: modelFilter || undefined } });
        setJobs(data.jobs);
      } else {
        const { data } = await api.get("/gallery/favorites");
        setJobs(data.jobs);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Gallery</h1>
          <p className="mt-1 text-slate-soft">Explore what the community has published, or revisit your favorites.</p>
        </div>
        <div className="flex rounded-full border border-slate-soft/25 p-1">
          <button
            onClick={() => setTab("public")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "public" ? "bg-violet/10 text-violet" : "text-slate-soft"}`}
          >
            Public
          </button>
          {user && (
            <button
              onClick={() => setTab("favorites")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "favorites" ? "bg-violet/10 text-violet" : "text-slate-soft"}`}
            >
              Favorites
            </button>
          )}
        </div>
      </div>

      {tab === "public" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="mt-6 flex flex-wrap gap-3"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts…"
            className="flex-1 min-w-[200px] rounded-xl border border-slate-soft/30 bg-transparent px-4 py-2 outline-none focus:border-violet"
          />
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="rounded-xl border border-slate-soft/30 bg-transparent px-4 py-2 outline-none focus:border-violet"
          >
            <option value="">All models</option>
            <option value="image">Image</option>
            <option value="face-swap">Face swap</option>
            <option value="video">Video</option>
          </select>
          <button type="submit" className="rounded-xl border border-violet/40 px-5 py-2 font-medium text-violet">
            Search
          </button>
        </form>
      )}

      {loading ? (
        <p className="mt-10 text-slate-soft">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="mt-10 text-slate-soft">Nothing to show here yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} ownerLabel={tab === "public" ? job.user?.name || job.user?.email : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
