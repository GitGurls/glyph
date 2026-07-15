import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "../lib/api";

interface Stats {
  totalUsers: number;
  totalJobs: number;
  completedJobs: number;
  flaggedJobs: number;
  byModel: { model: string; count: number }[];
  creditsIssued: number;
  creditsSpent: number;
  jobsByDay: { date: string; count: number }[];
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  credits: number;
  createdAt: string;
  _count: { images: number };
}

const COLORS = ["#7C5CFC", "#FF8A3D", "#A594FF"];

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<"overview" | "users">("overview");

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data));
    api.get("/admin/users").then((r) => setUsers(r.data.users));
  }, []);

  async function toggleRole(id: string, current: string) {
    const next = current === "ADMIN" ? "USER" : "ADMIN";
    await api.patch(`/admin/users/${id}/role`, { role: next });
    const { data } = await api.get("/admin/users");
    setUsers(data.users);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Admin</h1>
        <div className="flex rounded-full border border-slate-soft/25 p-1">
          <button
            onClick={() => setTab("overview")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "overview" ? "bg-violet/10 text-violet" : "text-slate-soft"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab("users")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "users" ? "bg-violet/10 text-violet" : "text-slate-soft"}`}
          >
            Users
          </button>
        </div>
      </div>

      {tab === "overview" && stats && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Total users", value: stats.totalUsers },
              { label: "Total jobs", value: stats.totalJobs },
              { label: "Credits issued", value: stats.creditsIssued },
              { label: "Credits spent", value: stats.creditsSpent },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-soft/15 p-5">
                <p className="text-sm text-slate-soft">{s.label}</p>
                <p className="mt-1 font-display text-3xl font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-soft/15 p-5">
              <h3 className="font-display text-lg font-semibold">Jobs — last 14 days</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.jobsByDay}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7C5CFC" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-soft/15 p-5">
              <h3 className="font-display text-lg font-semibold">Jobs by model</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.byModel} dataKey="count" nameKey="model" innerRadius={50} outerRadius={90}>
                      {stats.byModel.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-soft/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-soft/15 text-slate-soft">
              <tr>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Credits</th>
                <th className="p-4 font-medium">Generations</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-soft/10">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-4">
                    <p className="font-medium">{u.name || "—"}</p>
                    <p className="text-slate-soft">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === "ADMIN" ? "bg-amber/10 text-amber" : "bg-slate-soft/10 text-slate-soft"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{u.credits}</td>
                  <td className="p-4 font-mono">{u._count.images}</td>
                  <td className="p-4 text-slate-soft">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button onClick={() => toggleRole(u.id, u.role)} className="text-violet hover:underline">
                      {u.role === "ADMIN" ? "Revoke admin" : "Make admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
