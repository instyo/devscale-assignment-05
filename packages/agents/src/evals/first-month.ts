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
  "fm-ownership-map": /month\s*1|first\s*month/i,
  "fm-delivery-cadence": /first\s*month|month\s*1/i,
  "fm-shadow-conversation": /month\s*1|first\s*month|\bone\b/i,
  "fm-day-30-success": /day\s*30|\b30\b/i,
  "fm-relationships": /first\s*month|month\s*1/i,
};

await runEvalCli({
  name: "first-month",
  exitCode: true,
  cases: [
    {
      id: "fm-ownership-map",
      input:
        "In my first month, how do I learn who owns product, engineering, design, and people ops?",
      expected:
        "During month 1 ramp-up, understand who owns what across product, engineering, design, and people ops.",
      context,
    },
    {
      id: "fm-delivery-cadence",
      input: "What delivery cadence should I learn in the first month?",
      expected:
        "In your first month, learn the delivery cadence covering planning, review, and release.",
      context,
    },
    {
      id: "fm-shadow-conversation",
      input:
        "Should I shadow any meetings in month 1 if my role is customer-facing?",
      expected:
        "In month 1, shadow one customer-facing or cross-team conversation if it is relevant to your role.",
      context,
    },
    {
      id: "fm-day-30-success",
      input: 'What does "good" look like by day 30 at PT Medioker?',
      expected:
        "Agree on success signals with your manager — what good looks like by day 30.",
      context,
    },
    {
      id: "fm-relationships",
      input:
        "Besides my immediate team, what relationship goal do I have in month 1?",
      expected:
        "In the first month, build light relationships beyond your immediate team.",
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
          expectedOutcome:
            "Partially correct; misses key month-1 or day-30 facts.",
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
