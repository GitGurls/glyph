import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function CreditBadge() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Link
      to="/pricing"
      className="flex items-center gap-1.5 rounded-full border border-slate-soft/30 px-3 py-1.5 font-mono text-sm hover:border-violet transition-colors"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber" />
      {user.credits}
      <span className="hidden sm:inline text-slate-soft">credits</span>
    </Link>
  );
}
