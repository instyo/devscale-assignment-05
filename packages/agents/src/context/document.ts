import type { Document } from "@anvia/core";

/**
 * Static onboarding guide for new PT Medioker employees.
 * Attached every turn — keep stable and free of secrets.
 */
export const onboardingGuideDocument: Document = {
  id: "medioker-onboarding-guide",
  text: [
    "# PT Medioker — New Employee Onboarding Guide",
    "",
    "A conversational companion for your first days and months. Use this as a map, not a test.",
    "",
    "## About PT Medioker",
    "- Indonesian company focused on building practical digital products and learning experiences.",
    "- Values: clarity, ownership, kindness, and continuous learning.",
    "- We prefer small teams, written communication when it helps, and shipping over perfection.",
    "",
    "## Your first week (orientation)",
    "1. Complete HR onboarding forms and account setup (email, chat, project tools).",
    "2. Meet your manager and buddy; confirm your role goals for month 1.",
    "3. Read team docs: product overview, coding/design standards, and how we run meetings.",
    "4. Join standup / weekly sync; introduce yourself briefly.",
    "5. Set up your local workspace and make a small first contribution (docs fix, tiny PR, or shadow a task).",
    "6. Note open questions in a personal doc — bring them to 1:1s.",
    "",
    "## Your first month (ramp-up)",
    "- Understand who owns what: product, engineering, design, people ops.",
    "- Learn the delivery cadence (planning, review, release).",
    "- Shadow one customer-facing or cross-team conversation if relevant to your role.",
    "- Agree on success signals with your manager (what “good” looks like by day 30).",
    "- Build light relationships beyond your immediate team.",
    "",
    "## Who to talk to",
    "| Topic | Go to |",
    "| --- | --- |",
    "| Role expectations & priorities | Your manager |",
    "| Contracts, leave, benefits, payroll | People / HR |",
    "| Laptop, access, accounts, VPN | IT Support |",
    "| Security incidents or suspicious access | Security / IT immediately |",
    "| Day-to-day how-we-work questions | Your onboarding buddy or teammates |",
    "",
    "## Working norms",
    "- Core collaboration hours are typically weekdays; respect focus time and local time zones.",
    "- Default to async updates when a meeting is not needed; keep meetings short and purposeful.",
    "- Write decisions down (ticket, doc, or chat summary) so others can catch up.",
    "- Ask early — especially for access, unclear ownership, or blockers.",
    "- Feedback is normal and two-way: give it kindly, receive it with curiosity.",
    "",
    "## Tools (typical stack — confirm with your team)",
    "- Chat / async: team messaging app",
    "- Tasks: project board / issue tracker",
    "- Docs: shared knowledge base",
    "- Code: Git repository + code review",
    "- Calendar: 1:1s, standups, planning",
    "",
    "## Culture tips for new joiners",
    "- Introduce yourself with role + what you want to learn this month.",
    "- It is okay not to know everything in week 1 — curiosity beats pretending.",
    "- Celebrate firsts: first merged change, first demo, first customer insight.",
    "- Take breaks. Sustainable pace beats heroic burnout.",
    "",
    "## Safety & compliance reminders",
    "- Do not share credentials, customer PII, or confidential docs outside approved channels.",
    "- Report phishing or lost devices immediately to IT/Security.",
    "- When unsure whether something is public, treat it as internal until confirmed.",
    "",
    "## How this buddy helps you",
    "Ask about: first-day checklist, who to meet, how meetings work, what to prepare for 1:1s,",
    "how to ask for help, or how to plan week 1 / month 1. If the answer needs a human decision",
    "(policy exceptions, compensation, formal complaints), you will be pointed to the right person.",
  ].join("\n"),
  additionalProps: {
    source: "static-context",
    kind: "onboarding-guide",
    company: "PT Medioker",
  },
};

/** @deprecated Use onboardingGuideDocument */
export const productDocument = onboardingGuideDocument;

/** Default static context for the onboarding buddy agent. */
export const staticContext: readonly Document[] = [onboardingGuideDocument];
