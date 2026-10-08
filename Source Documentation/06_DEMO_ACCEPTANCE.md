# CareerX — Demo Acceptance Checklist

## Golden demo

Seeded persona:

```text
Year: 1
Skills: Python, C++, HTML
Interests: AI, Web Development
```

Expected flow:

Landing
→ Try example
→ Profile populated
→ Simulate
→ Loading
→ Three distinct paths
→ Explore one path
→ Skill gaps
→ Year-by-year roadmap
→ Projects
→ First 30 days

---

## Functional acceptance

### Landing
- Start works
- Try example works

### Profile
- year selector works
- skill selection works
- interest selection works
- custom input works where implemented
- simulation cannot be submitted with required data missing

### Simulation
- loading state appears
- response eventually renders
- exactly 3 paths appear

### Results
Each path has:
- title
- fit score
- why-it-fits
- skill gaps
- Explore action

### Detail
Each path has:
- fit reasoning
- skill gaps
- milestones
- projects
- 4-week action plan

### Failure recovery
- API failure does not leave a blank page
- retry works
- fallback result is valid

---

## Quality acceptance

- No broken console errors that affect the demo
- No API key in client code
- No page-wide horizontal scroll around 375px width
- Long text does not break layout
- Buttons have clear states
- Loading feels intentional
- Error message is understandable
- Visual hierarchy is consistent

---

## AI quality acceptance

Run the demo persona at least 3 times.

Check:
- three careers are meaningfully different
- scores are not suspiciously identical
- why-it-fits references actual inputs
- skill gaps make sense
- projects are plausible
- 30-day plan is realistic for a student taking classes
- JSON validation succeeds

---

## Final engineering acceptance

- production build passes
- required environment variables are configured correctly
- mock mode remains usable for development
- fallback path has been tested
- final demo flow has been rehearsed

---

## Judge-facing standard

A judge should understand the product in the first few seconds:

**"I give CareerX my current skills and interests, and it shows me three realistic career futures and exactly how I could move toward each one."**

The demo should make that statement visibly true.
