import * as React from "react";

function subscribe(query: string, onStoreChange: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

/** SSR-safe media query subscription (no hydration mismatch). */
export function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (onStoreChange) => subscribe(query, onStoreChange),
    () => getSnapshot(query),
    getServerSnapshot,
  );
}
