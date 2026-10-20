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
  "cn-company-values": /clarity|ownership|kindness|continuous\s*learning/i,
  "cn-how-we-work": /small\s*teams|shipping|written/i,
  "cn-meetings-vs-async": /async|meeting/i,
  "cn-write-decisions": /ticket|doc|chat|decision/i,
  "cn-week1-culture-tip": /week\s*1|month/i,
};

await runEvalCli({
  name: "culture-and-norms",
  exitCode: true,
  cases: [
    {
      id: "cn-company-values",
      input: "What values does PT Medioker care about?",
      expected:
        "PT Medioker values clarity, ownership, kindness, and continuous learning.",
      context,
    },
    {
      id: "cn-how-we-work",
      input: "How does the company prefer to work day to day?",
      expected:
        "We prefer small teams, written communication when it helps, and shipping over perfection.",
      context,
    },
    {
      id: "cn-meetings-vs-async",
      input: "When should I send an async update instead of booking a meeting?",
      expected:
        "Default to async updates when a meeting is not needed; keep meetings short and purposeful.",
      context,
    },
    {
      id: "cn-write-decisions",
      input: "How should decisions be recorded so others can catch up?",
      expected:
        "Write decisions down in a ticket, doc, or chat summary so others can catch up.",
      context,
    },
    {
      id: "cn-week1-culture-tip",
      input:
        "Any culture tip for surviving week 1 without pretending I know everything?",
      expected:
        "It is okay not to know everything in week 1 — curiosity beats pretending. Introduce yourself with your role and what you want to learn this month.",
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
        "Judge whether the answer is factually correct for PT Medioker culture and norms using the company context and reference answer.",
      rubric: [
        {
          scoreRange: [0, 2],
          expectedOutcome: "Incorrect or invents facts.",
        },
        {
          scoreRange: [3, 5],
          expectedOutcome: "Partially correct; misses key culture facts.",
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
