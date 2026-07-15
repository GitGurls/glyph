import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative h-8 w-14 rounded-full border border-slate-soft/30 bg-slate-soft/10 transition-colors"
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-glyph-gradient transition-transform ${
          isDark ? "translate-x-0.5" : "translate-x-7"
        }`}
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
