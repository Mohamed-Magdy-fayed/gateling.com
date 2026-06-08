import * as React from "react";

function subscribe(onStoreChange: () => void): () => void {
  const el = document.getElementById("site-scroll");
  el?.addEventListener("scroll", onStoreChange, { passive: true });
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => {
    el?.removeEventListener("scroll", onStoreChange);
    window.removeEventListener("scroll", onStoreChange);
  };
}

function getScrolled(threshold: number): boolean {
  const el = document.getElementById("site-scroll");
  return (el?.scrollTop ?? 0) + window.scrollY > threshold;
}

export function useIsScrolled(threshold = 10): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => getScrolled(threshold),
    () => false,
  );
}
