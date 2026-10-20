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
  "cs-manager-priorities": /manager/i,
  "cs-hr-benefits": /people|hr|human\s*resources/i,
  "cs-it-access": /it\s*support|\bit\b/i,
  "cs-security-incident": /security|\bit\b|phish|immediate/i,
  "cs-day-to-day-how-we-work": /buddy|teammate/i,
};

await runEvalCli({
  name: "contacts-and-safety",
  exitCode: true,
  cases: [
    {
      id: "cs-manager-priorities",
      input: "Who do I ask about role expectations and priorities?",
      expected: "Talk to your manager about role expectations and priorities.",
      context,
    },
    {
      id: "cs-hr-benefits",
      input: "Who handles contracts, leave, benefits, and payroll?",
      expected: "People / HR handles contracts, leave, benefits, and payroll.",
      context,
    },
    {
      id: "cs-it-access",
      input: "My laptop VPN is broken. Who should I contact?",
      expected:
        "Contact IT Support for laptop, access, accounts, and VPN issues.",
      context,
    },
    {
      id: "cs-security-incident",
      input: "I think I got a phishing email. What should I do right now?",
      expected:
        "Report phishing or suspicious access immediately to Security / IT. Do not share credentials or treat unconfirmed info as public.",
      context,
    },
    {
      id: "cs-day-to-day-how-we-work",
      input: "I have a small how-we-work question. Who is the best first stop?",
      expected:
        "For day-to-day how-we-work questions, ask your onboarding buddy or teammates first.",
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
        "Judge whether the answer routes the employee to the correct PT Medioker contact and safety guidance using the company context and reference answer.",
      rubric: [
        {
          scoreRange: [0, 2],
          expectedOutcome: "Wrong contact or invents policy.",
        },
        {
          scoreRange: [3, 5],
          expectedOutcome: "Partially correct; misses the right owner.",
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
