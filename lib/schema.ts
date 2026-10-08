import { z } from "zod";

function normalizeStringList(val: unknown): unknown {
  if (!Array.isArray(val)) return val;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of val) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed.length === 0) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }
  return result;
}

const cleanedStringItem = z.string().min(1, "Item cannot be empty").max(50, "Item cannot exceed 50 characters");

export const SimulationRequestSchema = z.object({
  year: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  skills: z.preprocess(
    normalizeStringList,
    z.array(cleanedStringItem).min(1, "Skills must contain at least 1 item").max(20, "Skills cannot exceed 20 items")
  ),
  interests: z.preprocess(
    normalizeStringList,
    z.array(cleanedStringItem).min(1, "Interests must contain at least 1 item").max(20, "Interests cannot exceed 20 items")
  ),
  strengths: z
    .preprocess(
      (val) => (val === undefined || val === null ? undefined : normalizeStringList(val)),
      z.array(cleanedStringItem).max(20, "Strengths cannot exceed 20 items")
    )
    .optional(),
});

export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

export const SkillGapSchema = z
  .object({
    skill: z.string().min(1, "Skill name is required"),
    importance: z.enum(["high", "medium", "low"]),
    currentLevel: z.number().int().min(0).max(5),
    targetLevel: z.number().int().min(0).max(5),
  })
  .refine((data) => data.targetLevel >= data.currentLevel, {
    message: "targetLevel must be greater than or equal to currentLevel",
    path: ["targetLevel"],
  });

export type SkillGap = z.infer<typeof SkillGapSchema>;

export const MilestoneSchema = z.object({
  yearLabel: z.string().min(1, "yearLabel is required"),
  goals: z.array(z.string().min(1)).min(1, "goals must have at least 1 item"),
  skillsToLearn: z.array(z.string().min(1)).min(1, "skillsToLearn must have at least 1 item"),
});

export type Milestone = z.infer<typeof MilestoneSchema>;

const difficultyRank: Record<"beginner" | "intermediate" | "advanced", number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Project description is required"),
  skillsPracticed: z.array(z.string().min(1)).min(1, "skillsPracticed must have at least 1 item"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  weeks: z.number().int().min(1, "weeks must be an integer >= 1"),
});

export type Project = z.infer<typeof ProjectSchema>;

export const First30DaysWeekSchema = z.object({
  week: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  tasks: z.array(z.string().min(1)).min(3, "Week must have 3-4 tasks").max(4, "Week must have 3-4 tasks"),
});

export type First30DaysWeek = z.infer<typeof First30DaysWeekSchema>;

export const CareerPathSchema = z
  .object({
    title: z.string().min(1, "title is required"),
    summary: z.string().min(1, "summary is required"),
    whyItFits: z.string().min(1, "whyItFits is required"),
    fitScore: z.number().int().min(0).max(100),
    fitReason: z.string().min(1, "fitReason is required"),
    skillGaps: z.array(SkillGapSchema).min(3, "Must have 3-5 skill gaps").max(5, "Must have 3-5 skill gaps"),
    milestones: z.array(MilestoneSchema).min(1, "Must have 1-5 milestones").max(5, "Must have 1-5 milestones"),
    projects: z.array(ProjectSchema).length(3, "Must have exactly 3 projects"),
    first30Days: z.array(First30DaysWeekSchema).length(4, "Must have exactly 4 first30Days weeks"),
  })
  .superRefine((data, ctx) => {
    // Check projects ordering easy -> hard
    const p = data.projects;
    if (difficultyRank[p[0].difficulty] > difficultyRank[p[1].difficulty] || difficultyRank[p[1].difficulty] > difficultyRank[p[2].difficulty]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Projects must be ordered from easier to harder (beginner -> intermediate -> advanced)",
        path: ["projects"],
      });
    }

    // Check first30Days weeks are 1, 2, 3, 4 once each
    const weeks = data.first30Days.map((w) => w.week).sort((a, b) => a - b);
    if (weeks[0] !== 1 || weeks[1] !== 2 || weeks[2] !== 3 || weeks[3] !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "first30Days must contain weeks 1, 2, 3, 4 exactly once",
        path: ["first30Days"],
      });
    }
  });

export type CareerPath = z.infer<typeof CareerPathSchema>;

export const SimulationResultSchema = z.object({
  paths: z.array(CareerPathSchema).length(3, "Response must contain exactly 3 career paths"),
});

export type SimulationResult = z.infer<typeof SimulationResultSchema>;
