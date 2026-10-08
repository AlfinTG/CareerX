export class JsonExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JsonExtractionError";
  }
}

/**
 * Extracts and parses a JSON object from raw LLM output.
 * Strips markdown code fences, slices from the first '{' to the last '}',
 * and parses JSON safely. Throws JsonExtractionError if not found or malformed.
 */
export function extractJson(text: string): unknown {
  if (!text || typeof text !== "string") {
    throw new JsonExtractionError("Empty or non-string response received");
  }

  // Strip code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new JsonExtractionError("No valid JSON object boundaries ('{' and '}') found in output");
  }

  const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonSubstring);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new JsonExtractionError(`Failed to parse extracted JSON substring: ${msg}`);
  }
}

function safeTrim(val: unknown): unknown {
  return typeof val === "string" ? val.trim() : val;
}

function clampInt(val: unknown, min: number, max: number): number | unknown {
  if (typeof val === "number" && !Number.isNaN(val)) {
    const rounded = Math.round(val);
    return Math.max(min, Math.min(max, rounded));
  }
  return val;
}

/**
 * Performs safe, mechanical normalization on raw extracted objects before Zod validation.
 * Fixes harmless numeric bounds/rounding and whitespace without inventing missing data.
 */
export function normalizeResult(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const data = { ...(raw as Record<string, unknown>) };

  if (Array.isArray(data.paths)) {
    // If paths > 3, keep only the first 3
    const rawPaths = data.paths.slice(0, 3);

    data.paths = rawPaths.map((p) => {
      if (!p || typeof p !== "object" || Array.isArray(p)) {
        return p;
      }

      const pathObj = { ...(p as Record<string, unknown>) };

      // Trim text fields
      pathObj.title = safeTrim(pathObj.title);
      pathObj.summary = safeTrim(pathObj.summary);
      pathObj.whyItFits = safeTrim(pathObj.whyItFits);
      pathObj.fitReason = safeTrim(pathObj.fitReason);

      // Clamp fitScore 0-100
      if (typeof pathObj.fitScore === "number") {
        pathObj.fitScore = clampInt(pathObj.fitScore, 0, 100);
      }

      // Normalize skillGaps
      if (Array.isArray(pathObj.skillGaps)) {
        pathObj.skillGaps = pathObj.skillGaps.map((sg) => {
          if (!sg || typeof sg !== "object" || Array.isArray(sg)) return sg;
          const gap = { ...(sg as Record<string, unknown>) };
          gap.skill = safeTrim(gap.skill);
          gap.importance = typeof gap.importance === "string" ? gap.importance.trim().toLowerCase() : gap.importance;

          let cur = gap.currentLevel;
          let tgt = gap.targetLevel;

          if (typeof cur === "number") {
            cur = clampInt(cur, 0, 5) as number;
            gap.currentLevel = cur;
          }
          if (typeof tgt === "number") {
            tgt = clampInt(tgt, 0, 5) as number;
            // Force targetLevel >= currentLevel
            if (typeof cur === "number" && (tgt as number) < cur) {
              tgt = cur;
            }
            gap.targetLevel = tgt;
          }

          return gap;
        });
      }

      // Normalize milestones
      if (Array.isArray(pathObj.milestones)) {
        pathObj.milestones = pathObj.milestones.map((m) => {
          if (!m || typeof m !== "object" || Array.isArray(m)) return m;
          const milestone = { ...(m as Record<string, unknown>) };
          milestone.yearLabel = safeTrim(milestone.yearLabel);
          if (Array.isArray(milestone.goals)) {
            milestone.goals = milestone.goals.map(safeTrim);
          }
          if (Array.isArray(milestone.skillsToLearn)) {
            milestone.skillsToLearn = milestone.skillsToLearn.map(safeTrim);
          }
          return milestone;
        });
      }

      // Normalize projects
      if (Array.isArray(pathObj.projects)) {
        pathObj.projects = pathObj.projects.map((proj) => {
          if (!proj || typeof proj !== "object" || Array.isArray(proj)) return proj;
          const project = { ...(proj as Record<string, unknown>) };
          project.name = safeTrim(project.name);
          project.description = safeTrim(project.description);
          if (Array.isArray(project.skillsPracticed)) {
            project.skillsPracticed = project.skillsPracticed.map(safeTrim);
          }
          if (typeof project.weeks === "number") {
            const roundedWeeks = Math.round(project.weeks);
            project.weeks = Math.max(1, roundedWeeks);
          }
          if (typeof project.difficulty === "string") {
            project.difficulty = project.difficulty.trim().toLowerCase();
          }
          return project;
        });
      }

      // Normalize first30Days
      if (Array.isArray(pathObj.first30Days)) {
        const sortedWeeks = [...pathObj.first30Days].sort((a, b) => {
          const wA = typeof a === "object" && a !== null ? (a as { week?: number }).week ?? 0 : 0;
          const wB = typeof b === "object" && b !== null ? (b as { week?: number }).week ?? 0 : 0;
          return wA - wB;
        });

        pathObj.first30Days = sortedWeeks.map((fw) => {
          if (!fw || typeof fw !== "object" || Array.isArray(fw)) return fw;
          const weekObj = { ...(fw as Record<string, unknown>) };
          if (Array.isArray(weekObj.tasks)) {
            weekObj.tasks = weekObj.tasks.map(safeTrim);
          }
          return weekObj;
        });
      }

      return pathObj;
    });
  }

  return data;
}
