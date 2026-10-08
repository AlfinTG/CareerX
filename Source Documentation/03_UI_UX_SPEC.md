# CareerX — UI/UX Specification

## 1. Product character

The visual identity should feel:
- modern
- clean
- premium
- student-friendly
- optimistic
- trustworthy
- focused

It must **not** look like a generic AI chatbot.

The product should make the user feel like they are looking at a map of possible futures.

---

## 2. Visual direction

Use:
- generous whitespace
- clear typographic hierarchy
- rounded cards
- strong visual grouping
- one confident accent color
- accessible contrast
- mobile-first layouts

A restrained indigo or teal direction is appropriate unless a finalized `DESIGN.md` says otherwise.

Once `DESIGN.md` exists, it becomes the visual source of truth.

---

## 3. Screen requirements

### Screen 1 — Landing

Goal:
Explain the concept immediately.

Content:
- headline such as "Three futures. One you."
- one-line explanation
- Start
- Try example

Avoid:
- dense copy
- huge feature grids
- chatbot interface
- unnecessary marketing sections

---

### Screen 2 — Profile

Goal:
Collect the minimum information required for simulation.

Required:
- year selector
- skill chips
- interest chips

Useful:
- add-your-own input

Primary action:
`Simulate my futures`

Keep the form fast.

---

### Screen 3 — Loading

Use:
- 3 placeholder cards
- subtle loading/shimmer treatment
- rotating status messages such as:
  - Mapping your skills…
  - Exploring possible futures…
  - Building roadmaps…

Do not make the wait feel like an error.

---

### Screen 4 — Results

Primary visual:
Three career cards.

Each card should clearly show:
- career title
- fit score
- short why-it-fits explanation
- top skill gaps
- Explore path

The three cards should be visually comparable without feeling identical.

On mobile:
- stack vertically
- preserve clear hierarchy

---

### Screen 5 — Path detail

Sections:
1. Path header
2. Fit score + fit reasoning
3. Skill gaps
4. Year-by-year timeline
5. Projects
6. First 30 days

Use visual components rather than text walls.

---

### Screen 6 — Comparison

Three-column comparison where screen size permits.

Compare:
- fit
- major gaps
- first project
- project duration

On small screens, stack or transform into horizontally scrollable comparison without breaking usability.

---

### Screen 7 — Error

Show:
- concise explanation
- Retry action

Keep the visual language consistent with the rest of the product.

---

## 4. Components

Prefer reusable components such as:
- PathCard
- SkillGapBar
- Timeline
- ProjectCard
- WeekPlan
- FitScore
- ChipSelect
- LoadingCard
- ErrorState

Components should be small and composable.

---

## 5. Interaction principles

- obvious primary action
- minimal friction
- no unnecessary animation
- animation should communicate state, hierarchy, or progress
- preserve inputs when moving backward/forward
- avoid modal overload
- make the next action obvious

---

## 6. Accessibility

Minimum:
- semantic HTML
- labels for inputs
- visible keyboard focus
- good contrast
- touch-friendly controls
- readable text
- no information communicated by color alone

---

## 7. Mobile

Check approximately 375px width.

Watch especially for:
- long career titles
- fit-score layout
- skill-gap labels
- timeline overflow
- project cards
- comparison layout
- first-30-days week columns

No horizontal page overflow.

---

## 8. Prompting Stitch

When generating a Stitch prompt, require Stitch to:
- follow this UX structure
- create reusable visual patterns
- consider desktop and mobile
- keep content concise
- avoid chatbot aesthetics
- produce a coherent design system
- make every visual element communicate information

If Stitch exports `DESIGN.md`, that file should be brought into the project and treated as authoritative for implementation.
