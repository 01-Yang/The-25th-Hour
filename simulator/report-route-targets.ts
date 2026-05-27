import { isTargetSuccess, ROUTE_TARGET_CASES } from "./route-target-cases.ts";
import { aggregate, runBatch } from "./simulate.ts";
import type { RouteTargetId } from "./types.ts";

const args = parseArgs(process.argv.slice(2));
const count = Number(args.count ?? 100);
const seed = Number(args.seed ?? 1);
const includeEvents = args.events === undefined || args.events === "true" || args.events === "1";
const targetFilter = args.targets ? new Set(args.targets.split(",").filter(Boolean) as RouteTargetId[]) : undefined;

const cases = targetFilter
  ? ROUTE_TARGET_CASES.filter((testCase) => targetFilter.has(testCase.target))
  : ROUTE_TARGET_CASES;

const report = {
  seedStart: seed,
  count,
  events: includeEvents,
  targets: Object.fromEntries(
    cases.map((testCase) => {
      const results = runBatch(testCase.strategy, count, seed, includeEvents, testCase.target);
      const result = aggregate(results);
      const targetSuccessCount = results.filter((run) => isTargetSuccess(testCase, run.hiddenRouteOutcome)).length;
      const routePassCount = results.filter((run) => run.hiddenRoutePassed).length;
      const fullLoopCount = results.filter((run) => run.weeks === 60).length;

      return [
        testCase.target,
        {
          strategy: testCase.strategy,
          route: testCase.route,
          targetSuccess: targetSuccessCount,
          targetSuccessRate: Number((targetSuccessCount / count).toFixed(2)),
          routePass: routePassCount,
          routePassRate: Number((routePassCount / count).toFixed(2)),
          fullLoop: fullLoopCount,
          endings: result.endings,
          routeFailureReasons: result.routeFailureReasons,
          internshipTierDistribution: result.internshipTierDistribution,
          hiddenRouteDecision: result.hiddenRouteDecision,
        },
      ];
    }),
  ),
};

console.log(JSON.stringify(report, null, 2));

function parseArgs(argv: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}
