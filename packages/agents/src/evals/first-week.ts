import { Agent } from "@anvia/core";
import {
  agentEvalTarget,
  answerRelevancy,
  contains,
  gEval,
  runEvalCli,
} from "@anvia/core/evals";
import { onboardingGuideDocument, staticContext } from "../context/document.js";
import { baseInstructions } from "../instructions.js";
import { getModel } from "../models.js";

const model = getModel();

const agent = new Agent({
  id: "onboarding-buddy",
  name: "PT Medioker Onboarding Buddy",
  model,
  instructions: baseInstructions,
  context: staticContext,
  maxTurns: 2,
});

const target = agentEvalTarget({
  agent,
  request: ({ input }) => ({ prompt: String(input) }),
});

const context = [onboardingGuideDocument.text];

const patterns: Record<string, RegExp> = {
  "fw-hr-accounts": /week\s*1|first\s*week|1\./i,
  "fw-meet-manager-buddy": /month\s*1|first\s*week/i,
  "fw-team-docs": /first\s*week|week\s*1|3\./i,
  "fw-standup-intro": /first\s*week|week\s*1|4\./i,
  "fw-first-contribution": /week\s*1|first\s*week|5\./i,
};

await runEvalCli({
  name: "first-week",
  exitCode: true,
  cases: [
    {
      id: "fw-hr-accounts",
      input:
        "I just joined PT Medioker today. What should I finish first for HR and accounts?",
      expected:
        "Complete HR onboarding forms and set up your accounts (email, chat, and project tools) as the first step in week 1.",
      context,
    },
    {
      id: "fw-meet-manager-buddy",
      input: "Who should I meet in my first week and what do we confirm?",
      expected:
        "Meet your manager and buddy in the first week, and confirm your role goals for month 1.",
      context,
    },
    {
      id: "fw-team-docs",
      input: "What documents should I read during orientation week?",
      expected:
        "In your first week, read team docs covering product overview, coding or design standards, and how meetings run.",
      context,
    },
    {
      id: "fw-standup-intro",
      input: "Do I need to join standup in week 1, and what should I say?",
      expected:
        "Join standup or weekly sync in your first week and introduce yourself briefly.",
      context,
    },
    {
      id: "fw-first-contribution",
      input: "What counts as a good first contribution in my first week?",
      expected:
        "In week 1, set up your local workspace and make a small first contribution such as a docs fix, tiny PR, or shadowing a task.",
      context,
    },
  ],
  target,
  metrics: [
    gEval({
      name: "correctness",
      model,
      threshold: 0.7,
      evaluationParams: [
        "input",
        "actualOutput",
        "expectedOutput",
        "context",
      ],
      criteria:
        "Judge whether the answer is factually correct for PT Medioker onboarding using the company context and reference answer.",
      rubric: [
        {
          scoreRange: [0, 2],
          expectedOutcome: "Incorrect or invents facts.",
        },
        {
          scoreRange: [3, 5],
          expectedOutcome: "Partially correct; misses key week-1 facts.",
        },
        {
          scoreRange: [6, 8],
          expectedOutcome: "Mostly correct and grounded.",
        },
        {
          scoreRange: [9, 10],
          expectedOutcome: "Fully correct and aligned with the reference.",
        },
      ],
    }),
    answerRelevancy({
      name: "answerRelevancy",
      model,
      threshold: 0.7,
    }),
    contains({
      name: "contains",
      expected: ({ case: c }) => patterns[c.id]!,
    }),
  ],
});
