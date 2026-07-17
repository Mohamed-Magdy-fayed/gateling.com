export default {
  feedbackPage: {
    metaTitle: "Share Your Experience",
    metaDescription:
      "Tell us how our solution transformed your business. Your story helps other companies understand what's possible.",
    pageTitle: "Share Your Experience",
    pageSubtitle:
      "Your honest feedback helps us improve and tells future clients what's possible. Fill in the form below — it only takes a few minutes.",
    projectFeaturesLabel: "What we built for you",
    profileSection: {
      title: "Your Profile",
      nameLabel: "Display name",
      namePlaceholder: "Your full name",
      avatarLabel: "Profile photo",
      avatarHint: "Upload a photo to make your testimonial more personal",
    },
    testimonialSection: {
      title: "Your Testimonial",
      roleLabel: "Your job title",
      rolePlaceholder: "e.g. Operations Manager",
      companyLabel: "Company name",
      companyPlaceholder: "Your company",
      ratingLabel: "Overall rating",
      ratingHint: "How would you rate the impact of our solution?",
      contentLabel: "Your feedback",
      contentPlaceholder:
        "Tell us how the system changed your daily operations, what problems it solved, and what you would tell another business owner considering working with us.",
    },
    submit: "Save My Feedback",
    submitting: "Saving...",
    successTitle: "Thank you!",
    successMessage:
      "Your feedback has been saved. Our team will review it and publish it on the site shortly.",
    alreadySaved:
      "Your testimonial has been saved and is pending review. You can update it any time.",
    linkExpiredTitle: "This link has expired",
    linkExpiredMessage:
      "Your feedback link is no longer valid. Message us on WhatsApp and we'll send you a fresh one — it only takes a moment.",
    linkExpiredCta: "Contact us",
  },
  projectFeatures: {
    "atelier-alaa-el-kasry": [
      "Branch-aware inventory management for gowns and accessories",
      "Digital reservation & appointment booking with conflict prevention",
      "Online payment tracking and WhatsApp receipt sharing",
      "Multi-branch admin dashboard with real-time visibility",
    ],
    "lavida-jungle-play-cafe": [
      "Family reservation system and kid management",
      "AI Text-to-Speech announcements that auto-duck background music",
      "POS system with QR menus and thermal receipt printing",
      "Daily cash closure reports per cashier",
    ],
    "megz-courses": [
      "Full lead-to-student CRM with sales pipeline",
      "Teacher portals with digital course materials",
      "Placement tests and student progress tracking",
      "7-role access system covering owners, teachers, and sales staff",
    ],
    "arabian-foods": [
      "Fully bilingual (EN/AR) product catalog website",
      "In-house content management — no developer needed",
      "Distributor-ready product pages for regional sales pitches",
      "SEO-optimised structure for MENA market visibility",
    ],
    ba2olak: [
      "Bilingual (Arabic-first) app to order groceries by phone",
      "One app for both customers and delivery riders",
      "Crowd-sourced catalog with AI de-duplication",
      "WhatsApp OTP login and order notifications",
      "Admin dashboard for dispatch and catalog moderation",
    ],
    emanz: [
      "Bilingual (AR/EN, RTL) landing and course-booking funnel",
      "Online payment via Paymob, plus reserve-now-pay-later",
      "Meta Pixel + Conversions API with deduplicated tracking",
      "Full ad attribution stored on every order",
      "Self-serve marketing admin — no redeploys needed",
    ],
  },
} as const;
