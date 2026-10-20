import { OpenAIClient, type OpenAICompletionModelId } from "@anvia/openai";

export type ModelId = OpenAICompletionModelId;

function resolveModelId(modelId?: ModelId): ModelId {
  return (modelId ||
    process.env.OPENAI_MODEL ||
    "gpt-6-luna") as ModelId;
}

function resolveApi(): "chat" | "responses" {
  return process.env.OPENAI_API === "responses" ? "responses" : "chat";
}

let _client: OpenAIClient | undefined;

/** Lazy client so env from `node --env-file` is visible at first use. */
export function getClient() {
  if (!_client) {
    _client = new OpenAIClient({
      apiKey: process.env.OPENAI_API_KEY || "",
      baseUrl: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return _client;
}

/** Alias for getClient() */
export function client() {
  return getClient();
}

/** Default model id from env (read at call time). */
export function defaultModelId() {
  return resolveModelId();
}

/**
 * Create an OpenAI completion model.
 * Uses OPENAI_MODEL when modelId is omitted.
 */
export function getModel(modelId?: ModelId) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required");
  }

  return getClient().completionModel({
    modelId: resolveModelId(modelId),
    api: resolveApi(),
  });
}
