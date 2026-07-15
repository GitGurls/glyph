import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";

interface ApiKey {
  id: string;
  key: string;
  label: string;
  revoked: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  balanceAfter: number;
  createdAt: string;
}

export default function Settings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [history, setHistory] = useState<Transaction[]>([]);

  async function loadKeys() {
    const { data } = await api.get("/keys");
    setKeys(data.keys);
  }

  async function loadHistory() {
    const { data } = await api.get("/credits/history");
    setHistory(data.transactions);
  }

  useEffect(() => {
    loadKeys();
    loadHistory();
  }, []);

  async function handleCreateKey(e: FormEvent) {
    e.preventDefault();
    const { data } = await api.post("/keys", { label: label || "Untitled key" });
    setNewKey(data.key.key);
    setLabel("");
    loadKeys();
  }

  async function handleRevoke(id: string) {
    await api.delete(`/keys/${id}`);
    loadKeys();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Settings</h1>

      {/* API keys */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Developer API keys</h2>
        <p className="mt-1 text-sm text-slate-soft">
          Call <code className="rounded bg-slate-soft/10 px-1.5 py-0.5 font-mono text-xs">POST /v1/generate</code> with an{" "}
          <code className="rounded bg-slate-soft/10 px-1.5 py-0.5 font-mono text-xs">x-api-key</code> header to generate from your own code.
        </p>

        {newKey && (
          <div className="mt-4 rounded-xl border border-amber/40 bg-amber/5 p-4">
            <p className="text-sm font-medium text-amber">Copy this key now — it won't be shown again.</p>
            <code className="mt-2 block break-all rounded-lg bg-ink/90 px-3 py-2 font-mono text-xs text-bone">{newKey}</code>
          </div>
        )}

        <form onSubmit={handleCreateKey} className="mt-4 flex gap-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Key label (e.g. local dev)"
            className="flex-1 rounded-xl border border-slate-soft/30 bg-transparent px-4 py-2 outline-none focus:border-violet"
          />
          <button type="submit" className="rounded-xl bg-glyph-gradient px-5 py-2 font-medium text-white">
            Generate key
          </button>
        </form>

        <div className="mt-5 flex flex-col divide-y divide-slate-soft/10 rounded-xl border border-slate-soft/15">
          {keys.length === 0 && <p className="p-4 text-sm text-slate-soft">No API keys yet.</p>}
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{k.label}</p>
                <p className="font-mono text-xs text-slate-soft">
                  {k.key.slice(0, 14)}••••••••{k.revoked ? " · revoked" : ""}
                </p>
              </div>
              {!k.revoked && (
                <button onClick={() => handleRevoke(k.id)} className="text-sm text-red-400 hover:underline">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Credit ledger */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Credit history</h2>
        <div className="mt-4 flex flex-col divide-y divide-slate-soft/10 rounded-xl border border-slate-soft/15">
          {history.length === 0 && <p className="p-4 text-sm text-slate-soft">No transactions yet.</p>}
          {history.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 font-mono text-sm">
              <span className="text-slate-soft">{new Date(t.createdAt).toLocaleString()}</span>
              <span className="text-slate-soft">{t.type}</span>
              <span className={t.amount >= 0 ? "text-violet" : "text-amber"}>
                {t.amount >= 0 ? "+" : ""}
                {t.amount}
              </span>
              <span>bal {t.balanceAfter}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
