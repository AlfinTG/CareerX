# CareerX — Build Plan

## Goal

Produce a reliable hackathon prototype in approximately 3.5 hours.

Use this sequence regardless of which implementation tool is used.

---

## Phase 0 — Lock the scope

Confirm:
- project name
- problem statement
- MVP
- data contract
- visual direction
- demo persona

Do not add new features during this phase.

---

## Phase 1 — Design

Create/refine:
- Landing
- Profile
- Loading
- Results
- Path detail
- Comparison
- Error state

Create the design system and, where available, export `DESIGN.md`.

Output should be specific enough that an implementation agent can reproduce it.

---

## Phase 2 — Contract first

Implement the schema and realistic mock result.

The mock must support:
- exactly three different careers
- believable scores
- skill gaps
- milestones
- projects
- 30-day plan

The frontend should be able to render the entire golden path using the mock before real AI integration.

---

## Phase 3 — Golden path implementation

Implement:
- landing
- profile
- loading
- results
- path detail

Prioritize correct navigation and data flow over visual polish.

---

## Phase 4 — Real AI integration

Implement:
- API request validation
- Anthropic call
- prompt
- JSON parsing
- Zod validation
- one retry
- fallback

Verify that the seeded persona produces three distinct paths.

---

## Phase 5 — Integration

Connect:
Profile
→ POST /api/simulate
→ validated response
→ Results
→ Path detail

Test failure states.

---

## Phase 6 — Optional features

Only after the golden path is reliable:

1. Comparison
2. What-if skill regeneration

If the clock becomes tight, skip What-if first.

---

## Phase 7 — Verification

Check:
- desktop
- phone-sized screen
- slow AI response
- invalid API response
- API failure
- retry
- fallback
- repeated demo

---

## Phase 8 — Final polish

Only fix issues with visible demo impact:
- alignment
- spacing
- wrapping
- overflow
- button states
- loading clarity
- error clarity
- consistency

Do not redesign the product near the end.

---

## AI-assisted workflow

When using Claude to generate prompts:

### For a design task
Ask Claude for:
- a focused Stitch prompt
- exact screens
- visual requirements
- responsive requirements
- design-system requirements
- explicit exclusions

### For an implementation task
Ask Claude for:
- a focused Antigravity prompt
- relevant existing files
- exact implementation goal
- exact constraints
- acceptance checks
- instruction to inspect existing work before changing it

### For debugging
Ask Claude for:
- likely root cause
- narrow diagnostic steps
- smallest safe fix
- verification command/click path

Never ask an implementation agent to "build the whole app" once the project already contains working pieces. Use small, verifiable tasks.

---

## Prompt quality rule

Every generated implementation prompt should answer:

1. What is being changed?
2. Where is it being changed?
3. What must remain untouched?
4. What existing source of truth must be read?
5. What does "done" mean?
6. How should it be verified?

---

## Time priority

If only a small amount of time remains:

Keep:
- profile
- simulation
- three paths
- details
- fallback
- responsive behavior

Cut:
- What-if
- nonessential animation
- extra screens
- secondary polish

Never replace a working core path with a broader unfinished feature set.
