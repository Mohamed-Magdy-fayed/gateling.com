"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { env } from "@/env/client";
import { useTranslation } from "@/features/core/i18n/client";

import type { BotGuardAction, BotGuardFields } from "../lib/rules";

/**
 * Client half of the public-form bot guard. Gives a form the three fields
 * `checkHumanSubmission` expects and the widget that produces the token.
 *
 * The Turnstile widget runs in "interaction-only" mode: invisible for nearly
 * every visitor, it only shows a checkbox when Cloudflare wants a human click.
 * Without `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (local dev) no widget renders and
 * the honeypot + timing fields still go out.
 */

type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  language: string;
  theme: "auto";
  appearance: "interaction-only";
  size: "flexible";
  "refresh-expired": "auto";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileScript: Promise<TurnstileApi> | null = null;

/** Loads the Turnstile script once per page, however many forms ask. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScript) return turnstileScript;

  turnstileScript = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("Turnstile script loaded without an API"));
    script.onerror = () => {
      turnstileScript = null; // allow a later mount to retry
      reject(new Error("Turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return turnstileScript;
}

/**
 * True for a server-side bot-guard rejection, whose message is already
 * translated and should be shown instead of the form's generic error.
 */
export function isBotGuardRejection(error: {
  data?: { code?: string } | null;
}): boolean {
  const code = error.data?.code;
  return code === "FORBIDDEN" || code === "TOO_MANY_REQUESTS";
}

export type BotGuard = {
  /** Fields to send with the form, or `null` while the token is not ready. */
  getFields: () => BotGuardFields | null;
  /** Tokens are single-use: call after every submit attempt. */
  reset: () => void;
  /** Render once inside the `<form>`. */
  widget: React.ReactNode;
};

export function useBotGuard(action: BotGuardAction): BotGuard {
  const { locale } = useTranslation();
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const containerRef = useRef<HTMLDivElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | undefined>(undefined);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const container = containerRef.current;
    if (!siteKey || !container) return;
    let cancelled = false;

    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetIdRef.current = api.render(container, {
          sitekey: siteKey,
          action,
          language: locale,
          theme: "auto",
          appearance: "interaction-only",
          size: "flexible",
          "refresh-expired": "auto",
          callback: (token) => {
            tokenRef.current = token;
          },
          "expired-callback": () => {
            tokenRef.current = undefined;
          },
          "error-callback": () => {
            tokenRef.current = undefined;
          },
        });
      })
      .catch((error: unknown) => {
        // The server rejects a token-less submit, so the user sees the
        // "verification failed" message rather than a silent pass.
        console.error("[bot-guard] Turnstile unavailable", error);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      tokenRef.current = undefined;
    };
  }, [siteKey, action, locale]);

  const getFields = useCallback((): BotGuardFields | null => {
    if (siteKey && !tokenRef.current) return null;
    return {
      botToken: tokenRef.current,
      website: honeypotRef.current?.value ?? "",
      formStartedAt: startedAt,
    };
  }, [siteKey, startedAt]);

  const reset = useCallback(() => {
    tokenRef.current = undefined;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  const widget = (
    <>
      {/* `basis-full` puts a visible challenge on its own row in inline
          (flex-wrap) forms; it is a no-op in stacked ones. */}
      <div ref={containerRef} className="basis-full empty:hidden" />
      {/* Honeypot: off-screen on the inline-start side (mirrors in RTL),
          unreachable by keyboard and hidden from assistive tech. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-[9999px] top-0 size-px overflow-hidden"
      >
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
    </>
  );

  return { getFields, reset, widget };
}
