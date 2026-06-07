/**
 * Production-only: silence browser console and discourage DevTools access.
 * Note: client-side checks can be bypassed; this hides logs from casual inspection.
 */
const isProd = import.meta.env.PROD;

if (isProd) {
  const noop = () => {};

  const consoleMethods = [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "trace",
    "table",
    "group",
    "groupCollapsed",
    "groupEnd",
    "dir",
    "dirxml",
    "count",
    "countReset",
    "time",
    "timeEnd",
    "timeLog",
    "assert",
    "clear",
    "profile",
    "profileEnd",
  ];

  const lockConsole = () => {
    consoleMethods.forEach((method) => {
      try {
        console[method] = noop;
      } catch {
        /* ignore */
      }
    });
  };

  lockConsole();
  setInterval(lockConsole, 1000);

  document.addEventListener("contextmenu", (e) => e.preventDefault());

  document.addEventListener(
    "keydown",
    (e) => {
      const key = e.key?.toLowerCase();
      const blocked =
        key === "f12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        (e.ctrlKey && key === "u") ||
        (e.metaKey && e.altKey && key === "i");

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
}

export function silenceConsole() {
  /* applied on import in production */
}
