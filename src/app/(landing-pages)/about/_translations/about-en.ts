import type { LanguageMessages } from "@/features/core/i18n/lib";

export default {
    about: {
        hero: {
            // Was "Software Engineering & Product Design Studio" — the exact
            // string the homepage used as its title tag, so the two pages
            // competed for the same phrase. This H1 is now about who we are;
            // the homepage owns the commercial "custom software" term.
            title: "We Build Software That Solves Real Business Problems",
            description:
                "A founder-led studio in Cairo. We help founders and operations leads plan, design, and launch software that stays cohesive from first sketch to final deployment.",
        },
        stats: {
            launches: {
                label: "Custom platforms launched",
                value: "10+ releases",
            },
            clients: {
                label: "Clients partnered with",
                value: "Founders, agencies, and SME teams",
            },
            disciplines: {
                label: "Core disciplines",
                value: "Strategy | UX | Full-stack",
            },
            timeZones: {
                label: "Remote collaboration",
                value: "Across 4 time zones",
            },
            buildCycle: {
                label: "Typical build cycle",
                value: "4-8 week sprints",
            },
        },
        story: {
            title: "Crafting end-to-end digital products",
            description:
                "For the past few years we have partnered with founders, agencies, and engineering leaders to turn napkin sketches into stable software. Our background across UX, frontend, and backend lets us move seamlessly from strategy to shipping.",
        },
        mission: {
            title: "How I help",
            description:
                "I map user journeys, design frictionless interfaces, and build production-grade codebases that scale gracefully. Every engagement is tailored, whether you need a proof-of-concept, a polished MVP, or a redesign of an existing platform.",
        },
        vision: {
            title: "What to expect",
            description:
                "We work in focused sprints with clear deliverables, async-friendly communication, and the flexibility to plug me into your existing team or operate as your solo build partner.",
        },
        whyChooseUs: {
            title: "Why teams hire me",
            exceptionalSupport: "Discovery workshops that uncover the real problem before budget is committed.",
            scalableSolutions: "Design systems and component libraries tailored to your roadmap and brand.",
            userCentricInterface: "Full-stack builds across React, TypeScript, Node.js, and cloud-native deployments.",
            comprehensiveToolset: "Automated QA, observability, and analytics instrumentation baked in from sprint one.",
            costReduction: "Fractional product leadership to mentor your team and hand off with clarity.",
        },
        values: {
            title: "How I approach every build",
            description:
                "From first workshop to final deploy, I stay focused on clarity, craftsmanship, and measurable outcomes.",
            innovation: {
                title: "Product thinking",
                description:
                    "Translate raw ideas into clear roadmaps, user stories, and success metrics before a line of code is written.",
            },
            studentSuccess: {
                title: "Human-centered UX",
                description:
                    "Design flows that feel intuitive, brand-aligned, and accessible so every release earns trust from day one.",
            },
            operationalExcellence: {
                title: "Technical depth",
                description:
                    "Build scalable frontends and APIs with modern tooling, robust testing, and deployment-ready infrastructure.",
            },
            partnership: {
                title: "Transparent collaboration",
                description:
                    "Work as an embedded partner with weekly demos, async updates, and clear decisions at every milestone.",
            },
            integrity: {
                title: "Sustainable delivery",
                description:
                    "Favor maintainable architectures, clean documentation, and handoffs your in-house team can own confidently.",
            },
        },
        founder: {
            title: "Meet the founder behind the work",
            description:
                "Gateling Solutions was founded to bring the discipline of senior engineering and product strategy to teams that deserve a long-term partner, not just a contractor.",
            name: "Mohamed Magdy",
            role: "Founder & CEO, Gateling Solutions",
            bio: "Mohamed blends a product strategist's curiosity with an engineer's discipline. He has led cross-functional teams, audited legacy systems, and launched greenfield products across fintech, SaaS, and creator tooling.",
            journey: {
                title: "My working rhythm",
                description:
                    "Every engagement begins with a discovery call, followed by a collaborative brief, clickable prototype, and engineering plan. Weekly reviews keep us aligned while I handle the heavy lifting across architecture, implementation, and polish.",
            },
        },
        cta: {
            title: "Need a hands-on partner for your next release?",
            description:
                "Whether you are validating an idea or scaling an existing product, let's build a roadmap and ship something your users will love.",
            primaryButton: "Book a call",
            secondaryButton: "Browse projects",
        },
    },
} as const satisfies LanguageMessages;
