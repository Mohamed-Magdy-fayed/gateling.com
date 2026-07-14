"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function useScrollAnimation(threshold = 0.1) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // useLayoutEffect (not useEffect): passive effects can be deferred when a
  // subtree mounts as part of a Suspense boundary resolving — on some first
  // loads that deferred effect never got a completion signal, permanently
  // stranding content at opacity-0. Layout effects aren't deferred that way.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    // IntersectionObserver always reports current intersection state on the
    // first callback after observe(), even if already intersecting — unlike
    // a synchronous getBoundingClientRect() check, this stays correct when
    // the element mounts mid-layout (e.g. content revealed via Suspense).
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold },
    );

    observer.observe(element);

    // Safety net: this is a decorative reveal, not gatekeeping real content.
    // If the observer's callback is ever delayed or dropped (timing races
    // when this subtree mounts via a transition/Suspense reveal), don't let
    // the element stay invisible indefinitely.
    const fallback = window.setTimeout(() => setIsVisible(true), 500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [threshold]);

  return { elementRef, isVisible };
}
