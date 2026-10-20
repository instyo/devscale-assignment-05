import {
  Agent,
  type AgentMemoryOptions,
  type MemoryScope,
  type Message,
} from "@anvia/core";
import { staticContext } from "./context/document.js";
import { baseInstructions } from "./instructions.js";
import { getModel, type ModelId } from "./models.js";
import { webTools } from "./tools/web-search.js";

export type RunAgentOptions = {
  /** Full message history for this run (used when memory session is not set). */
  messages?: readonly Message[];
  /** New user prompt (used with memory session). */
  prompt?: string;
  /** Durable memory store + save policy. */
  memory?: AgentMemoryOptions;
  /** Session scope for loading/saving memory. Requires `memory` + `prompt`. */
  session?: MemoryScope;
  /** OpenAI model id. Defaults to OPENAI_MODEL. */
  modelId?: ModelId;
  /** Override base instructions for this run's agent. */
  instructions?: string;
  /** Max model/tool turns. Defaults to 8. */
  maxTurns?: number;
  /** Optional agent id (useful for tracing). */
  id?: string;
};

function lastUserText(messages: readonly Message[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message || message.role !== "user") continue;

    if (typeof message.content === "string") {
      const text = message.content.trim();
      if (text) return text;
      continue;
    }

    if (!Array.isArray(message.content)) continue;

    const text = message.content
      .filter(
        (part): part is { type: "text"; text: string } =>
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          (part as { type: unknown }).type === "text" &&
          "text" in part &&
          typeof (part as { text: unknown }).text === "string",
      )
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (text) return text;
  }

  return undefined;
}

/**
 * Build the PT Medioker Onboarding Buddy agent and return its stream.
 */
export function runAgent(options: RunAgentOptions) {
  const {
    messages,
    prompt,
    memory,
    session,
    modelId,
    instructions = baseInstructions,
    maxTurns = 8,
    id = "onboarding-buddy",
  } = options;

  // Only attach web tools when Tavily is configured (avoids hanging tool calls).
  const tools = process.env.TAVILY_API_KEY ? [...webTools] : [];

  const agent = new Agent({
    id,
    name: "PT Medioker Onboarding Buddy",
    description:
      "A conversational guide for new employees during their first days and months at PT Medioker.",
    model: getModel(modelId),
    instructions,
    maxTurns,
    context: staticContext,
    tools,
    memory,
  });

  // Memory requires prompt + session (history is loaded from the store).
  if (memory && session) {
    const nextPrompt = prompt ?? (messages ? lastUserText(messages) : undefined);
    if (!nextPrompt) {
      throw new Error(
        "runAgent: prompt (or a user message) is required when memory session is set",
      );
    }
    return agent.stream({ prompt: nextPrompt, session });
  }

  if (!messages?.length) {
    throw new Error(
      "runAgent: messages are required when memory session is not set",
    );
  }

  return agent.stream({ messages });
}
