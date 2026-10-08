# CareerX — Project Specification

## 1. Project

**CareerX — Career Path Simulator**

Hackathon: Prompt 2 Product — CSI AITR x MLH — 8 October 2026  
Problem: **PS3 — Career Path Simulator: Three Futures, One Student**  
Time budget: approximately 3.5 hours.

A working demo beats a long feature list.

---

## 2. Product statement

CareerX does not tell a student that there is one correct career.

It shows three realistic career futures and explains what each future demands from the student's current position.

---

## 3. Target user

A college student who is unsure about their direction.

Example demo persona:
A first-year student with Python, C++, and HTML skills who is interested in AI and web development.

The product must not be hard-coded as a CS-only experience.

---

## 4. Golden path

Landing
→ Profile Form
→ Loading
→ Three Path Cards
→ Path Detail

Path detail contains:
- skill gaps
- year-by-year milestones
- projects
- first-30-days plan

The profile form should take less than a minute.

---

## 5. Profile inputs

Required:
- year of study: 1, 2, 3, or 4
- skills
- interests

Optional:
- strengths, only if there is a clear benefit and it does not slow the MVP

---

## 6. Career path output

Exactly 3 paths.

Each path must contain:
1. Title
2. Summary
3. Why it fits, referencing actual student inputs
4. Current-fit score, 0–100
5. Fit reason
6. Skill gaps
7. Year-by-year milestones
8. Projects
9. First-30-days plan

---

## 7. Build order

### Priority 1 — Golden path
Make the complete experience work with mock data first, then connect the real API.

### Priority 2 — Comparison
Allow a student to compare the three paths.

### Priority 3 — What-if
Add a small "What if I learn X?" interaction that regenerates the three futures with the additional skill.

### Priority 4 — Polish
Improve:
- loading
- error handling
- mobile layout
- spacing
- wrapping
- overflow
- visual clarity

If time runs short, remove Priority 3 first and Priority 4 beyond bug fixes.

Never remove Priority 1.

---

## 8. MVP visual requirements

Landing:
- concise headline
- concise explanation
- Start button
- Try example button

Profile:
- year selector
- skill chips
- interest chips
- add-your-own inputs
- simulate button

Loading:
- calm progress state
- meaningful status text
- visual placeholders

Results:
- exactly three career cards
- title
- fit score
- why-it-fits summary
- top skill gaps
- Explore path button
- Compare control where practical

Path detail:
- title and fit score
- skill gaps
- vertical roadmap
- project cards
- 4-week first-30-days plan

---

## 9. Out of scope

Do not build:
- authentication
- accounts
- database
- social network/community
- job scraping
- admin
- large analytics
- giant chatbot
- unrelated product modules

---

## 10. Demo persona

First-year:
- Python
- C++
- HTML
- interests: AI, Web Development

Provide a single-click example.

The example should make the complete demo path easy to reproduce.

---

## 11. Definition of done

- Golden path works using the real API
- AI failure has a reliable fallback
- Loading state exists
- Error state exists
- Mobile layout works around 375px width
- Demo persona runs cleanly at least three times
- Deployment can be completed
- Production build passes
