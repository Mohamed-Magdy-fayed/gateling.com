"use client";

import { useMutation } from "@tanstack/react-query";
import { Mail, MailIcon, MapPin, Phone, SendIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { GatelingLogoLink } from "@/components/ui/logo";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

const APP_CONFIG = {
  name: "Gateling Solutions",
  email: "info@gateling.com",
  phoneDisplay: "201123862218",
  phoneDial: "+20112386221",
  facebook: "https://www.facebook.com/mohamedmagdyfayed",
  youtube: "https://www.youtube.com/@mohamedfayed",
  linkedin: "https://www.linkedin.com/in/mohamedmagdyfayed/",
  instagram: "https://www.instagram.com/mohamedmagdyfayed/",
} as const;

const socialLinks = [
  { name: "Facebook", href: APP_CONFIG.facebook, icon: FacebookIcon },
  { name: "YouTube", href: APP_CONFIG.youtube, icon: YoutubeIcon },
  { name: "LinkedIn", href: APP_CONFIG.linkedin, icon: LinkedinIcon },
  { name: "Instagram", href: APP_CONFIG.instagram, icon: InstagramIcon },
];

export function PublicFooter() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const trpc = useTRPC();

  const mutation = useMutation(
    trpc.subscribers.subscribe.mutationOptions({
      onSuccess: (data) => {
        if (data.alreadyActive) {
          toast.info(t("publicPages.newsletter.alreadySubscribed"));
        } else {
          toast.success(t("publicPages.newsletter.success"));
        }
        setEmail("");
      },
      onError: () => {
        toast.error(t("publicPages.newsletter.error"));
      },
    }),
  );

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const result = z.string().email().safeParse(email);
    if (!result.success) {
      toast.error(t("publicPages.newsletter.invalidEmail"));
      return;
    }
    mutation.mutate({ email });
  }

  const navigation = {
    workTogether: [
      { name: t("publicPages.footer.navContact"), href: "/contact" },
      { name: t("publicPages.footer.navServices"), href: "/services" },
      { name: t("publicPages.footer.navWork"), href: "/work" },
    ],
    company: [
      { name: t("publicPages.footer.navAbout"), href: "/about" },
      { name: t("publicPages.footer.navBlog"), href: "/blog" },
      { name: t("publicPages.footer.navProcess"), href: "/#process" },
      {
        name: t("publicPages.footer.navTestimonials"),
        href: "/#testimonials",
      },
    ],
    resources: [
      { name: t("publicPages.footer.navPrivacy"), href: "/privacy" },
      { name: t("publicPages.footer.navTerms"), href: "/terms" },
    ],
  };

  return (
    <footer className="overflow-hidden border-t border-border/50 bg-muted/30 pb-16 md:pb-0">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16">
          <div className="grid gap-8 lg:grid-cols-7">
            {/* Company info */}
            <div className="lg:col-span-2">
              <GatelingLogoLink iconSize={26} className="text-lg" />

              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                {t("publicPages.footer.description")}
              </p>

              {/* Contact info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <a
                    href={`mailto:${APP_CONFIG.email}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {APP_CONFIG.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <a
                    href={`tel:${APP_CONFIG.phoneDial}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {APP_CONFIG.phoneDisplay}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    {t("publicPages.footer.location")}
                  </span>
                </div>
              </div>

              {/* Social links */}
              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  >
                    <social.icon className="h-4 w-4" />
                    <span className="sr-only">{social.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Work Together */}
            <div>
              <h3 className="text-sm font-semibold">
                {t("publicPages.footer.workTogetherTitle")}
              </h3>
              <ul className="mt-4 space-y-3">
                {navigation.workTogether.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold">
                {t("publicPages.footer.companyTitle")}
              </h3>
              <ul className="mt-4 space-y-3">
                {navigation.company.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold">
                {t("publicPages.footer.resourcesTitle")}
              </h3>
              <ul className="mt-4 space-y-3">
                {navigation.resources.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-border/50 bg-background p-4">
                <h3 className="text-sm font-semibold">
                  {t("publicPages.footer.newsletterTitle")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("publicPages.footer.newsletterDescription")}
                </p>
                <form onSubmit={handleSubscribe} className="mt-3">
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <MailIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="email"
                      placeholder={t("publicPages.newsletter.placeholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={mutation.isPending}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="submit"
                        variant="ghost"
                        disabled={mutation.isPending}
                      >
                        <SendIcon />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/50 py-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("appName")}.{" "}
            {t("publicPages.footer.allRightsReserved")}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("publicPages.footer.navPrivacy")}
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("publicPages.footer.navTerms")}
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("publicPages.footer.location")}
          </p>
        </div>
      </div>
    </footer>
  );
}
