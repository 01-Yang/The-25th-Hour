import { createInitialState } from "./state.ts";
import { maybeResolveHiddenRouteResultAfterReview } from "./routes.ts";
import { runSimulation, summarize } from "./simulate.ts";
import type { EndingId, RouteId, StrategyId } from "./types.ts";

interface Case {
  strategy: StrategyId;
  expectedRoute: RouteId | null;
  expectedEndings: EndingId[];
}

const cases: Case[] = [
  { strategy: "normal", expectedRoute: null, expectedEndings: ["stable_graduation"] },
  { strategy: "postgrad", expectedRoute: "postgrad_exam", expectedEndings: ["basic_postgrad"] },
  { strategy: "overseas", expectedRoute: "overseas", expectedEndings: ["overseas_basic"] },
  {
    strategy: "civil_service",
    expectedRoute: "civil_service",
    expectedEndings: ["civil_service_success", "civil_service_fallback", "civil_service_failed"],
  },
  { strategy: "architecture_job", expectedRoute: "architecture_job", expectedEndings: ["architecture_job_success"] },
  { strategy: "career_change", expectedRoute: "career_change", expectedEndings: ["career_change_success", "career_change_failed"] },
];

let failures = 0;

for (const testCase of cases) {
  const state = runSimulation({ seed: 25, strategy: testCase.strategy, events: true });
  const result = summarize(state);
  const routeOk = result.formalRoute === testCase.expectedRoute;
  const fullLoopOk = result.weeks === 60;
  const expectedEndingOk = testCase.expectedEndings.includes(result.ending);
  const endingOk =
    testCase.expectedRoute === null
      ? result.hiddenRouteOutcome === null
      : result.hiddenRouteOutcome === result.ending;
  const hiddenStateOk =
    testCase.expectedRoute === null
      ? result.hiddenRouteAttributes === null
      : result.hiddenRouteAttributes !== null && result.hiddenRoutePortfolio !== null;

  check(`${testCase.strategy} completes full 60-week loop`, fullLoopOk, result);
  check(`${testCase.strategy} formal route`, routeOk, result);
  check(`${testCase.strategy} expected ending`, expectedEndingOk, result);
  check(`${testCase.strategy} hidden route state is cached`, hiddenStateOk, result);
  check(`${testCase.strategy} route ending is read at final parser`, endingOk, result);
}

{
  const state = createInitialState(3200, "civil_service");
  state.semesterIndex = 9;
  state.route.formal = {
    route: "civil_service",
    group: "civil",
    target: "civil_service_ministry",
    week: 49,
  };
  state.gpa = 0;
  state.attributes.presentation = 58;
  state.attributes.social = 60;
  state.attributes.resilience = 58;
  maybeResolveHiddenRouteResultAfterReview(state);
  check(
    "civil-service fallback is read before failed exam fallback",
    state.route.hiddenResult?.outcome === "civil_service_fallback",
    state.route.hiddenResult,
  );
}

if (failures > 0) {
  process.exitCode = 1;
}

function check(name: string, condition: boolean, detail: unknown): void {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);
  if (!condition) {
    console.log(JSON.stringify(detail, null, 2));
    failures += 1;
  }
}
