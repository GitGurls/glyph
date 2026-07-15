import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(email, password, name);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-24">
      <h1 className="font-display text-3xl font-semibold">Create your account</h1>
      <p className="mt-1 text-slate-soft">50 free credits to start generating.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-soft/30 bg-transparent px-4 py-2.5 outline-none focus:border-violet"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-soft/30 bg-transparent px-4 py-2.5 outline-none focus:border-violet"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-soft/30 bg-transparent px-4 py-2.5 outline-none focus:border-violet"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-glyph-gradient px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-violet">
          Log in
        </Link>
      </p>
    </div>
  );
}
