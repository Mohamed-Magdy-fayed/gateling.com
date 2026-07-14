import type { Metadata } from "next";

import { canonicalUrl } from "@/lib/json-ld";

export const metadata: Metadata = {
	title: "About",
	description:
		"Learn about Gateling Solutions — meet Mohamed Magdy, Founder & CEO. Discover the story, values, and vision behind our founder-led software engineering studio.",
	alternates: { canonical: canonicalUrl("/about") },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
	return children;
}
