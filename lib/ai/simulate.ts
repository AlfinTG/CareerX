import Anthropic from "@anthropic-ai/sdk";
import { SimulationRequest, SimulationResult, SimulationResultSchema } from "@/lib/schema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompt";
import { extractJson, normalizeResult, JsonExtractionError } from "@/lib/ai/normalize";
import { FALLBACK_SIMULATION_RESULT } from "@/lib/fallback/result";

type FailureCategory = "timeout" | "parse" | "schema" | "api" | "truncated";

interface AttemptError {
  category: FailureCategory;
  shortDescription: string;
  issuePaths?: string[];
}

function classifyError(err: unknown): AttemptError {
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.message.toLowerCase().includes("timeout") || err.message.toLowerCase().includes("aborted")) {
      return {
        category: "timeout",
        shortDescription: "The request exceeded the time budget and timed out.",
      };
    }
    if (err.message.includes("truncated due to max_tokens")) {
      return {
        category: "truncated",
        shortDescription: "The JSON response was cut off before finishing because token limits were reached. Keep text concise.",
      };
    }
    if (err instanceof JsonExtractionError || err instanceof SyntaxError) {
      return {
        category: "parse",
        shortDescription: `Malformed JSON output: ${err.message}`,
      };
    }
  }

  // Check if Zod error
  if (err && typeof err === "object" && "issues" in err && Array.isArray((err as { issues: unknown[] }).issues)) {
    const issues = (err as { issues: { path: (string | number)[]; message: string }[] }).issues;
    const paths = issues.map((i) => i.path.join(".") || "root");
    const summary = issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).slice(0, 3).join("; ");
    return {
      category: "schema",
      shortDescription: `Schema validation failed: ${summary}`,
      issuePaths: paths,
    };
  }

  const msg = err instanceof Error ? err.message : String(err);
  return {
    category: "api",
    shortDescription: `API or runtime error: ${msg}`,
  };
}

/**
 * Executes the career simulation pipeline with a strict ~55-second deadline,
 * single retry on failure with targeted error feedback, and graceful fallback.
 */
export async function simulate(
  profile: SimulationRequest
): Promise<{ result: SimulationResult; source: "ai" | "fallback" }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.log("[CareerX] ANTHROPIC_API_KEY is not set. Using fallback.");
    return { result: FALLBACK_SIMULATION_RESULT, source: "fallback" };
  }

  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
  const client = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt();

  const totalDeadlineMs = 55000;
  const startTime = Date.now();

  let previousErrorDesc: string | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const elapsedSoFar = Date.now() - startTime;
    const remainingTime = totalDeadlineMs - elapsedSoFar;

    // For Attempt 2, only proceed if at least 12 seconds remain
    if (attempt === 2 && remainingTime < 12000) {
      console.log(
        `[CareerX Attempt 2] skipped (insufficient time remaining: ${remainingTime}ms < 12000ms) finalSource=fallback`
      );
      break;
    }

    // Determine timeout for this attempt
    const attemptTimeoutMs =
      attempt === 1
        ? Math.min(40000, remainingTime)
        : remainingTime;

    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      abortController.abort(new Error(`Attempt ${attempt} timed out after ${attemptTimeoutMs}ms`));
    }, attemptTimeoutMs);

    const attemptStartTime = Date.now();

    try {
      const userPrompt = buildUserPrompt(profile, previousErrorDesc);

      const response = await client.messages.create(
        {
          model,
          max_tokens: 6000,
          temperature: 0.5,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        },
        { signal: abortController.signal }
      );

      clearTimeout(timeoutHandle);

      if (response.stop_reason === "max_tokens") {
        throw new Error("Response truncated due to max_tokens");
      }

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || !("text" in textBlock)) {
        throw new Error("No text content block found in model response");
      }

      const rawJson = extractJson(textBlock.text);
      const normalized = normalizeResult(rawJson);
      const parsed = SimulationResultSchema.safeParse(normalized);

      if (!parsed.success) {
        throw parsed.error;
      }

      const elapsed = Date.now() - attemptStartTime;
      console.log(
        `[CareerX Attempt ${attempt}] success elapsed=${elapsed}ms finalSource=ai`
      );

      return { result: parsed.data, source: "ai" };
    } catch (err) {
      clearTimeout(timeoutHandle);
      const elapsed = Date.now() - attemptStartTime;
      const classified = classifyError(err);
      previousErrorDesc = classified.shortDescription;

      const issueDetails = classified.issuePaths ? classified.issuePaths.join(",") : "none";
      console.log(
        `[CareerX Attempt ${attempt}] failed category=${classified.category} elapsed=${elapsed}ms issues=${issueDetails}`
      );

      if (attempt === 2) {
        break;
      }
    }
  }

  const totalElapsed = Date.now() - startTime;
  console.log(`[CareerX] Simulation failed after retry attempts. totalElapsed=${totalElapsed}ms finalSource=fallback`);
  return { result: FALLBACK_SIMULATION_RESULT, source: "fallback" };
}
