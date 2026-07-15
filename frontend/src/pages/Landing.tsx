import { Link } from "react-router-dom";

const HERO_IMAGES = [
  "https://picsum.photos/seed/glyph1/400/400",
  "https://picsum.photos/seed/glyph2/400/400",
  "https://picsum.photos/seed/glyph3/400/400",
  "https://picsum.photos/seed/glyph4/400/400",
  "https://picsum.photos/seed/glyph5/400/400",
  "https://picsum.photos/seed/glyph6/400/400",
  "https://picsum.photos/seed/glyph7/400/400",
  "https://picsum.photos/seed/glyph8/400/400",
];

const FEATURES = [
  { title: "Prompt enhancement", copy: "Type three words. GLYPH expands it into a fully art-directed prompt before it hits the queue." },
  { title: "Live job queue", copy: "Watch queued → processing → complete over a socket connection, not a spinner that lies to you." },
  { title: "Credit ledger", copy: "Every generation, purchase, and refund is a signed row in an auditable ledger, not a single mutable number." },
  { title: "Public gallery", copy: "Publish anything you make, searchable by prompt and model, or keep your whole library private." },
  { title: "Collections", copy: "Group generations into albums the way you'd organize a shoot, not just a flat camera roll." },
  { title: "Developer API", copy: "Issue an API key and call the same generation pipeline the web app uses, from your own code." },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full border border-violet/30 bg-violet/10 px-3 py-1 font-mono text-xs text-violet">
              self-hosted image · face-swap · video models
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Every prompt is
              <br />
              <span className="bg-glyph-gradient bg-clip-text text-transparent">a small direction.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-slate-soft">
              GLYPH turns a rough idea into a directed generation job — queued, enhanced,
              moderated, and rendered by models running on infrastructure we own.
            </p>
            <div className="mt-9 flex items-center gap-4">
              <Link
                to="/register"
                className="rounded-full bg-glyph-gradient px-7 py-3 font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                Start creating — free credits
              </Link>
              <Link to="/gallery" className="font-medium text-slate-soft hover:text-inherit">
                Browse the gallery →
              </Link>
            </div>
          </div>

          {/* Signature element: a living grid of tiles that continuously drift, standing in for generation itself */}
          <div className="relative mx-auto grid aspect-square w-full max-w-md grid-cols-3 gap-2 [perspective:1000px]">
            {HERO_IMAGES.map((src, i) => (
              <div
                key={src}
                className="overflow-hidden rounded-xl"
                style={{
                  animation: `glyph-float ${5 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
                }}
              >
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes glyph-float {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.85; }
            50% { transform: translateY(-6px) scale(1.02); opacity: 1; }
          }
        `}</style>
      </section>

      {/* Architecture strip — nods to the actual system, not marketing fluff */}
      <section className="border-y border-slate-soft/15 bg-slate-soft/5 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 font-mono text-sm text-slate-soft">
          <span>frontend → backend</span>
          <span className="text-violet">→ job queue</span>
          <span>→ self-hosted models</span>
          <span className="text-amber">→ webhook</span>
          <span>→ realtime push</span>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Built past the demo</h2>
          <p className="mt-2 max-w-lg text-slate-soft">
            The parts that don't show up in a screenshot are usually the parts that matter.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-soft/15 p-6">
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-soft">{f.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
