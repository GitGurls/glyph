import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Pack {
  credits: number;
  priceUsd: number;
}

export default function Pricing() {
  const { user, setCredits } = useAuth();
  const navigate = useNavigate();
  const [packs, setPacks] = useState<Record<string, Pack>>({});
  const [purchasing, setPurchasing] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/credits/packs").then((r) => setPacks(r.data.packs));
  }, []);

  async function handleBuy(id: string) {
    if (!user) return navigate("/login");
    setPurchasing(id);
    setMessage("");
    try {
      const { data } = await api.post("/credits/checkout", { pack: id });
      setCredits(data.creditsRemaining);
      setMessage(`${data.creditsGranted} credits added — test-mode checkout, no card required.`);
    } catch (err: any) {
      setMessage(err?.response?.data?.error || "Checkout failed.");
    } finally {
      setPurchasing("");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-center font-display text-3xl font-semibold">Top up your credits</h1>
      <p className="mt-2 text-center text-slate-soft">
        Stripe test mode — this demo grants credits instantly with no real charge.
      </p>

      {message && (
        <div className="mx-auto mt-6 max-w-md rounded-xl border border-violet/30 bg-violet/5 px-4 py-3 text-center text-sm">
          {message}
        </div>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {Object.entries(packs).map(([id, pack]) => (
          <div key={id} className="rounded-2xl border border-slate-soft/15 p-6 text-center">
            <h3 className="font-display text-lg font-semibold capitalize">{id}</h3>
            <p className="mt-3 font-display text-4xl font-semibold">${pack.priceUsd}</p>
            <p className="mt-1 font-mono text-sm text-slate-soft">{pack.credits} credits</p>
            <button
              onClick={() => handleBuy(id)}
              disabled={purchasing === id}
              className="mt-5 w-full rounded-full bg-glyph-gradient py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {purchasing === id ? "Processing…" : "Buy credits"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-slate-soft/15 p-6 font-mono text-sm text-slate-soft">
        <p>Image generation — 5 credits</p>
        <p>Face swap — 8 credits</p>
        <p>Video generation — 15 credits</p>
      </div>
    </div>
  );
}
