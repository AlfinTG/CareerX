# CareerX — Technical Specification

## 1. Recommended architecture

Frontend
→ API route
→ AI service
→ structured JSON
→ Zod validation
→ normalized result
→ frontend renderer

Recommended stack:
- Next.js
- TypeScript
- Tailwind CSS
- Anthropic Claude API
- Zod

Deployment target:
- Vercel

No database is required for the MVP.

Client state is sufficient.

---

## 2. Repository shape

```text
/
├── app/
│   ├── api/
│   │   └── simulate/
│   └── ...
├── components/
├── lib/
│   ├── schema.ts
│   ├── ai/
│   │   ├── prompt.ts
│   │   └── simulate.ts
│   ├── fallback/
│   │   └── result.ts
│   └── mock/
│       └── simulate.json
├── public/
├── PROJECT.md
├── DESIGN.md
├── API.md
├── .env.example
└── README.md
```

---

## 3. Runtime environment

Environment variables:

```text
ANTHROPIC_API_KEY=
USE_MOCK=true
```

Rules:
- API key is server-side only
- never expose it to client code
- never log the key
- `USE_MOCK=true` uses `/lib/mock/simulate.json`
- avoid unnecessary configuration switches

---

## 4. Request contract

Conceptual request:

```ts
type SimulationRequest = {
  year: 1 | 2 | 3 | 4;
  skills: string[];
  interests: string[];
  strengths?: string[];
};
```

Validation:
- year must be 1–4
- skills must be non-empty
- interests must be non-empty

---

## 5. Response contract

Source of truth:

`/lib/schema.ts`

Conceptual TypeScript shape:

```ts
type SimulationResult = {
  paths: CareerPath[]; // exactly 3
};

type CareerPath = {
  title: string;
  summary: string;
  whyItFits: string;
  fitScore: number; // 0–100
  fitReason: string;

  skillGaps: {
    skill: string;
    importance: "high" | "medium" | "low";
    currentLevel: number; // 0–5
    targetLevel: number;  // 0–5
  }[];

  milestones: {
    yearLabel: string;
    goals: string[];
    skillsToLearn: string[];
  }[];

  projects: {
    name: string;
    description: string;
    skillsPracticed: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    weeks: number;
  }[];

  first30Days: {
    week: 1 | 2 | 3 | 4;
    tasks: string[];
  }[];
};
```

The final Zod schema should enforce the same contract.

---

## 6. AI behavior contract

The AI must:
- return exactly 3 paths
- return JSON only
- not add markdown fences
- create meaningfully different roles
- reference the student's actual skills/interests in `whyItFits`
- provide believable fit scores
- provide 3–5 skill gaps per path
- use integer skill levels from 0–5
- provide 3 projects per path ordered from easier to harder
- provide exactly 4 first-30-days weeks
- provide 3–4 concrete tasks per week
- produce milestones relevant to the student's year

Avoid generic output.

Bad:
`Learn Python.`

Better:
`Week 1: practice functions, OOP, and data structures, then build a small CSV analysis script.`

---

## 7. Realism rules

The AI should account for academic stage.

A first-year student should receive:
- fundamentals
- small projects
- gradual skill growth
- achievable early milestones

Do not tell a beginner to master an entire professional stack in one month.

---

## 8. AI reliability strategy

Recommended flow:

1. Call the Anthropic API.
2. Extract/clean the expected JSON.
3. Validate with Zod.
4. If validation fails, retry once.
5. If the second attempt fails, return a known fallback result.
6. The frontend receives only a valid schema shape.

This prevents the UI from becoming responsible for fixing AI output.

---

## 9. API route

Primary endpoint:

```text
POST /api/simulate
```

Responsibilities:
- validate request
- choose mock vs real mode
- call the AI service
- validate AI response
- retry once when needed
- fallback on repeated failure
- return clear JSON errors for invalid requests or unrecoverable server errors

Do not expose the Anthropic API key.

---

## 10. Frontend rule

The frontend should render validated structured data.

The frontend should not:
- parse arbitrary AI prose
- repair malformed AI JSON
- contain business logic for interpreting career recommendations

Keep the contract centralized.

---

## 11. Comparison view

When comparison is implemented, compare:
- fit score
- top skill gaps
- first project
- project duration

Time to first project should be derived from the first project's `weeks` value unless the schema is intentionally expanded later.

Do not invent an undocumented field just for comparison.

---

## 12. What-if behavior

If implemented:

Input:
`What if I learn ____?`

Behavior:
- keep existing results visible while the new request is running
- add the new skill to the existing profile
- call the same simulation function
- render the regenerated result
- do not create a second AI architecture

---

## 13. Error and loading behavior

Loading:
- clear progress messaging
- no frozen or blank screen
- visually communicates that the simulation is working

Error:
- human-readable message
- retry action
- preserve useful profile input where practical

Fallback:
- known valid result
- visually indistinguishable from a normal structured result except where the product may optionally disclose fallback status

---

## 14. Quality checks

For meaningful implementation changes:
- run lint
- run production build
- test the golden path
- test the seeded demo persona
- test mobile layout
- test API failure behavior
- test repeated simulation

Use the smallest set of checks that reliably catches regressions.
