#!/usr/bin/env node

/**
 * CareerX Backend Verification Script
 * Validates POST /api/simulate against the demo persona.
 *
 * Usage:
 *   node scripts/check-persona.mjs [runs=3] [baseUrl=http://localhost:3000]
 */

const runsArg = parseInt(process.argv[2], 10);
const totalRuns = !Number.isNaN(runsArg) && runsArg > 0 ? runsArg : 3;
const baseUrl = (process.argv[3] || "http://localhost:3000").replace(/\/$/, "");

const DEMO_PERSONA = {
  year: 1,
  skills: ["Python", "C++", "HTML"],
  interests: ["AI", "Web Development"],
};

const REQUIRED_KEYWORDS = ["python", "c++", "html", "ai", "web"];

console.log(`====================================================`);
console.log(`  CareerX Persona Verification: ${totalRuns} run(s)`);
console.log(`  Endpoint: ${baseUrl}/api/simulate`);
console.log(`====================================================\n`);

let overallPassed = true;

async function runSingleSimulation(runIndex) {
  console.log(`--- [Run ${runIndex}/${totalRuns}] Starting ---`);
  const startTime = Date.now();

  let response;
  let body;
  try {
    response = await fetch(`${baseUrl}/api/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEMO_PERSONA),
    });
    body = await response.json();
  } catch (err) {
    console.error(`[FAIL] Network or connection error: ${err.message}`);
    return false;
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const status = response.status;
  const source = response.headers.get("x-careerx-source") || "unknown";

  console.log(`HTTP Status:       ${status}`);
  console.log(`X-CareerX-Source:  ${source}`);
  console.log(`Elapsed Time:      ${elapsedSec}s`);

  // Warnings
  if (source === "fallback") {
    console.warn(`[WARN] Source is fallback. Model may have failed or timed out.`);
  }
  if (parseFloat(elapsedSec) > 45) {
    console.warn(`[WARN] Execution took longer than 45 seconds (${elapsedSec}s).`);
  }

  let runPassed = true;

  // 1. status === 200
  if (status !== 200) {
    console.error(`  [FAIL 1/8] Status is ${status}, expected 200. Body: ${JSON.stringify(body)}`);
    runPassed = false;
    return false;
  }
  console.log(`  [PASS 1/8] HTTP Status is 200`);

  const paths = body.paths;

  // 2. exactly 3 paths
  if (!Array.isArray(paths) || paths.length !== 3) {
    console.error(`  [FAIL 2/8] paths length is ${Array.isArray(paths) ? paths.length : 0}, expected 3`);
    runPassed = false;
    return false;
  }
  console.log(`  [PASS 2/8] Exactly 3 paths returned`);

  // Display titles and scores
  const titles = paths.map((p) => p.title);
  const scores = paths.map((p) => p.fitScore);
  console.log(`Titles:            ${titles.map((t) => `"${t}"`).join(" | ")}`);
  console.log(`Fit Scores:        ${scores.join(", ")}`);

  // 3. all titles are different
  const uniqueTitles = new Set(titles.map((t) => t.trim().toLowerCase()));
  if (uniqueTitles.size !== 3) {
    console.error(`  [FAIL 3/8] Titles are not all distinct: ${titles.join(", ")}`);
    runPassed = false;
  } else {
    console.log(`  [PASS 3/8] All 3 titles are distinct`);
  }

  // 4. fit scores are not all equal
  const uniqueScores = new Set(scores);
  if (uniqueScores.size <= 1) {
    console.error(`  [FAIL 4/8] Fit scores are all identical: ${scores.join(", ")}`);
    runPassed = false;
  } else {
    console.log(`  [PASS 4/8] Fit scores are varied (not all equal)`);
  }

  // 5. each path has exactly 3 projects
  let projectsOk = true;
  for (let i = 0; i < paths.length; i++) {
    if (!Array.isArray(paths[i].projects) || paths[i].projects.length !== 3) {
      console.error(`  [FAIL 5/8] Path ${i + 1} (${paths[i].title}) has ${paths[i].projects?.length || 0} projects, expected 3`);
      projectsOk = false;
    }
  }
  if (projectsOk) {
    console.log(`  [PASS 5/8] Each path has exactly 3 projects`);
  } else {
    runPassed = false;
  }

  // 6. each path has exactly 4 first30Days entries
  let first30DaysCountOk = true;
  for (let i = 0; i < paths.length; i++) {
    if (!Array.isArray(paths[i].first30Days) || paths[i].first30Days.length !== 4) {
      console.error(`  [FAIL 6/8] Path ${i + 1} has ${paths[i].first30Days?.length || 0} first30Days entries, expected 4`);
      first30DaysCountOk = false;
    }
  }
  if (first30DaysCountOk) {
    console.log(`  [PASS 6/8] Each path has exactly 4 first30Days entries`);
  } else {
    runPassed = false;
  }

  // 7. first30Days contains weeks 1, 2, 3, 4 exactly once
  let weeksOk = true;
  for (let i = 0; i < paths.length; i++) {
    const weeks = (paths[i].first30Days || []).map((w) => w.week).sort((a, b) => a - b);
    if (weeks.length !== 4 || weeks[0] !== 1 || weeks[1] !== 2 || weeks[2] !== 3 || weeks[3] !== 4) {
      console.error(`  [FAIL 7/8] Path ${i + 1} weeks are [${weeks.join(", ")}], expected [1, 2, 3, 4]`);
      weeksOk = false;
    }
  }
  if (weeksOk) {
    console.log(`  [PASS 7/8] first30Days weeks are exactly [1, 2, 3, 4]`);
  } else {
    runPassed = false;
  }

  // 8. each whyItFits contains at least one required keyword (case-insensitive)
  let whyItFitsOk = true;
  for (let i = 0; i < paths.length; i++) {
    const why = (paths[i].whyItFits || "").toLowerCase();
    const matched = REQUIRED_KEYWORDS.some((kw) => why.includes(kw));
    if (!matched) {
      console.error(`  [FAIL 8/8] Path ${i + 1} whyItFits does not reference student inputs: "${paths[i].whyItFits}"`);
      whyItFitsOk = false;
    }
  }
  if (whyItFitsOk) {
    console.log(`  [PASS 8/8] Each whyItFits references student inputs (Python/C++/HTML/AI/Web)`);
  } else {
    runPassed = false;
  }

  console.log(`--- [Run ${runIndex}/${totalRuns}] ${runPassed ? "ALL 8 CHECKS PASSED" : "FAILED"} ---\n`);
  return runPassed;
}

async function main() {
  for (let i = 1; i <= totalRuns; i++) {
    const passed = await runSingleSimulation(i);
    if (!passed) {
      overallPassed = false;
    }
  }

  console.log(`====================================================`);
  if (overallPassed) {
    console.log(`  VERIFICATION RESULT: ALL ${totalRuns} RUN(S) PASSED`);
    console.log(`====================================================`);
    process.exit(0);
  } else {
    console.error(`  VERIFICATION RESULT: ONE OR MORE RUNS FAILED`);
    console.log(`====================================================`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
