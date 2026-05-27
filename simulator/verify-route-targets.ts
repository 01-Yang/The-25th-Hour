import { aggregate, runBatch, runSimulation, summarize } from "./simulate.ts";
import { isTargetSuccess, ROUTE_TARGET_CASES } from "./route-target-cases.ts";

let failures = 0;

for (const testCase of ROUTE_TARGET_CASES) {
  const single = summarize(
    runSimulation({ seed: 25, strategy: testCase.strategy, events: true, routeTarget: testCase.target }),
  );
  check(`${testCase.target} binds target`, single.routeTarget === testCase.target, single);
  check(`${testCase.target} binds route`, single.formalRoute === testCase.route, single);
  check(`${testCase.target} reaches final parser`, single.hiddenRouteOutcome === single.ending, single);

  const results = runBatch(testCase.strategy, testCase.count, 1, true, testCase.target);
  const result = aggregate(results);
  const targetSuccessCount = results.filter((run) => isTargetSuccess(testCase, run.hiddenRouteOutcome)).length;
  const routePassCount = results.filter((run) => run.hiddenRoutePassed).length;
  const failureCount = results.length - targetSuccessCount;
  const fullLoopCount = results.filter((run) => run.weeks === 60).length;

  check(`${testCase.target} batch completes full loop`, fullLoopCount === testCase.count, result);

  if (testCase.expectTargetSuccess) {
    check(`${testCase.target} has reachable target success`, targetSuccessCount > 0, result);
  }

  if (testCase.expectRoutePass) {
    check(`${testCase.target} has reachable route pass or fallback`, routePassCount > 0, result);
  }

  if (testCase.expectFailure) {
    check(`${testCase.target} has diagnostic failure`, failureCount > 0, result);
  }

  console.log(
    `TARGET ${testCase.target}: targetSuccess=${targetSuccessCount}/${testCase.count}, routePass=${routePassCount}/${testCase.count}, endings=${JSON.stringify(result.endings)}, reasons=${JSON.stringify(result.routeFailureReasons)}`,
  );
}

let mismatchRejected = false;
try {
  runSimulation({ seed: 25, strategy: "postgrad", events: true, routeTarget: "master_studio" });
} catch {
  mismatchRejected = true;
}
check("mismatched target rejects cross-route binding", mismatchRejected, { routeTarget: "master_studio" });

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
