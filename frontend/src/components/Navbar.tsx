import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { CreditBadge } from "./CreditBadge";

const links = [
  { to: "/dashboard", label: "Generate" },
  { to: "/gallery", label: "Gallery" },
  { to: "/collections", label: "Collections" },
  { to: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-soft/15 bg-bone/80 dark:bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight">
          GLYPH
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-violet/10 text-violet" : "text-slate-soft hover:text-inherit"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user.role === "ADMIN" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-amber/10 text-amber" : "text-slate-soft hover:text-inherit"
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <CreditBadge />
              <Link to="/settings" className="text-sm font-medium text-slate-soft hover:text-inherit">
                Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-full border border-slate-soft/30 px-4 py-1.5 text-sm font-medium hover:border-violet hover:text-violet transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-soft hover:text-inherit">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-glyph-gradient px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                Start creating
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
