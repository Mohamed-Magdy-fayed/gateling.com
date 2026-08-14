import { ImageResponse } from "next/og";

/**
 * Site-wide default OG image.
 *
 * Generated rather than committed as a binary: the root layout previously
 * pointed at `/og-default.png`, which never existed in `public/`, so every
 * share preview 404'd. A generated route can't drift out of existence, and
 * Next wires the `og:image` tag automatically — no `openGraph.images` entry
 * is needed in the layout metadata.
 *
 * Pages with their own artwork (case studies, blog posts) override this by
 * setting `openGraph.images` in their own `generateMetadata`.
 */
export const alt =
  "Gateling Solutions — custom software and business automation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand tokens, mirrored from `src/app/globals.css`. ImageResponse resolves
// colors at generation time and does not understand `oklch()` or CSS vars,
// so these are the sRGB equivalents of --primary / --background / --foreground.
const BRAND = "#F97316";
const SURFACE = "#1C1917";
const TEXT = "#FAFAF9";
const MUTED = "#A8A29E";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: SURFACE,
        padding: "80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            backgroundColor: BRAND,
          }}
        />
        <div style={{ fontSize: "34px", color: TEXT, fontWeight: 600 }}>
          Gateling Solutions
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: "72px",
            lineHeight: 1.1,
            color: TEXT,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Custom software and
        </div>
        <div
          style={{
            fontSize: "72px",
            lineHeight: 1.1,
            color: BRAND,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          business automation
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div
          style={{ width: "120px", height: "6px", backgroundColor: BRAND }}
        />
        <div style={{ fontSize: "30px", color: MUTED }}>
          Cairo, Egypt — serving Egypt &amp; MENA
        </div>
      </div>
    </div>,
    size,
  );
}
