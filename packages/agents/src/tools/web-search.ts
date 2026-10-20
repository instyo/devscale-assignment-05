import { createTool } from "@anvia/core";
import { tavily } from "@tavily/core";
import { z } from "zod";

function getTavilyClient() {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is required for web tools");
  }

  return tavily({ apiKey });
}

/**
 * Search the live web (Tavily search).
 */
export const searchWebTool = createTool({
  name: "search-web",
  description:
    "Search the live web for up-to-date information. Returns titles, URLs, and short snippets. Use read-webpage to fetch full page content from a specific URL.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe("The search query to look up on the web."),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("Maximum number of results to return (default 5)."),
  }),
  outputSchema: z.object({
    query: z.string(),
    answer: z.string().optional(),
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        content: z.string(),
        score: z.number().optional(),
      }),
    ),
  }),
  async execute({ query, maxResults }) {
    const client = getTavilyClient();
    const response = await client.search(query, {
      maxResults: maxResults ?? 5,
      includeAnswer: true,
      searchDepth: "basic",
    });

    return {
      query: response.query,
      answer: response.answer,
      results: response.results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score,
      })),
    };
  },
});

/**
 * Read / extract full content from one or more webpages (Tavily extract).
 */
export const readWebpageTool = createTool({
  name: "read-webpage",
  description:
    "Fetch and extract the main content of one or more webpages by URL. Use after search-web when you need the full page body, not just a snippet.",
  inputSchema: z.object({
    urls: z
      .array(z.string().url())
      .min(1)
      .max(5)
      .describe("One or more webpage URLs to read."),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        url: z.string(),
        title: z.string().nullable(),
        content: z.string(),
      }),
    ),
    failed: z.array(
      z.object({
        url: z.string(),
        error: z.string(),
      }),
    ),
  }),
  async execute({ urls }) {
    const client = getTavilyClient();
    const response = await client.extract(urls, {
      format: "markdown",
      extractDepth: "basic",
    });

    return {
      results: response.results.map((result) => ({
        url: result.url,
        title: result.title,
        content: result.rawContent,
      })),
      failed: response.failedResults.map((result) => ({
        url: result.url,
        error: result.error,
      })),
    };
  },
});

/** Both Tavily-backed web tools. */
export const webTools = [searchWebTool, readWebpageTool] as const;
