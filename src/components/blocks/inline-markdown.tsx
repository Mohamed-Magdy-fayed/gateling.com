import type { ReactNode } from "react";

import { isSafeHref } from "./safe-url";

/**
 * Minimal, safe-by-construction inline markdown parser for content-block text.
 * Supports: **bold**, *italic*, [text](url). No HTML parsing — regex + split
 * only, so there is no dangerouslySetInnerHTML anywhere in the block system.
 */
export function renderInline(text: string): ReactNode {
  if (!text) return null;

  // Single combined pass so bold/italic/link don't fight over `*` characters.
  const pattern = /(\*\*.+?\*\*|\*.+?\*|\[.+?\]\(.+?\))/g;
  const parts = text.split(pattern).filter((part) => part.length > 0);

  return parts.map((part, index) => {
    const key = `${index}-${part.slice(0, 8)}`;

    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch?.[1]) {
      return <strong key={key}>{boldMatch[1]}</strong>;
    }

    const italicMatch = part.match(/^\*(.+)\*$/);
    if (italicMatch?.[1]) {
      return <em key={key}>{italicMatch[1]}</em>;
    }

    const linkMatch = part.match(/^\[(.+)\]\((.+)\)$/);
    if (linkMatch?.[1] && linkMatch[2] && isSafeHref(linkMatch[2])) {
      const href = linkMatch[2];
      const isExternal = /^https?:\/\//.test(href);
      return (
        <a
          key={key}
          href={href}
          className="underline underline-offset-2 hover:text-foreground"
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <span key={key}>{part}</span>;
  });
}
