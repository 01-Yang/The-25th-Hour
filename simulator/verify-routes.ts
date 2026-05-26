import { runSimulation, summarize } from "./simulate.ts";
import type { EndingId, RouteId, StrategyId } from "./types.ts";

interface Case {
  strategy: StrategyId;
  expectedRoute: RouteId | null;
  expectedEnding: EndingId;
}

const cases: Case[] = [
  { strategy: "normal", expectedRoute: null, expectedEnding: "stable_graduation" },
  { strategy: "postgrad", expectedRoute: "postgrad_exam", expectedEnding: "basic_postgrad" },
  { strategy: "overseas", expectedRoute: "overseas", expectedEnding: "overseas_basic" },
  { strategy: "civil_service", expectedRoute: "civil_service", expectedEnding: "civil_service_fallback" },
  { strategy: "architecture_job", expectedRoute: "architecture_job", expectedEnding: "architecture_job_success" },
  { strategy: "career_change", expectedRoute: "career_change", expectedEnding: "career_change_success" },
];

let failures = 0;

for (const testCase of cases) {
  const state = runSimulation({ seed: 25, strategy: testCase.strategy, events: true });
  const result = summarize(state);
  const routeOk = result.formalRoute === testCase.expectedRoute;
  const fullLoopOk = result.weeks === 60;
  const expectedEndingOk = result.ending === testCase.expectedEnding;
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
