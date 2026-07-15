import { FormEvent, useEffect, useState } from "react";
import { api, Job } from "../lib/api";
import { JobCard } from "../components/JobCard";

interface Collection {
  id: string;
  name: string;
  images: Job[];
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const { data } = await api.get("/gallery/collections");
    setCollections(data.collections);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post("/gallery/collections", { name });
      setName("");
      load();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/gallery/collections/${id}`);
    load();
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Collections</h1>
      <p className="mt-1 text-slate-soft">Group your generations into albums.</p>

      <form onSubmit={handleCreate} className="mt-6 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New collection name…"
          className="flex-1 max-w-sm rounded-xl border border-slate-soft/30 bg-transparent px-4 py-2 outline-none focus:border-violet"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-xl bg-glyph-gradient px-5 py-2 font-medium text-white disabled:opacity-60"
        >
          Create
        </button>
      </form>

      <div className="mt-10 flex flex-col gap-10">
        {collections.length === 0 && <p className="text-slate-soft">No collections yet — create one above.</p>}
        {collections.map((c) => (
          <div key={c.id}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">{c.name}</h2>
              <button onClick={() => handleDelete(c.id)} className="text-sm text-red-400 hover:underline">
                Delete
              </button>
            </div>
            {c.images.length === 0 ? (
              <p className="mt-2 text-sm text-slate-soft">No images in this collection yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {c.images.map((img) => (
                  <JobCard key={img.id} job={img} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
