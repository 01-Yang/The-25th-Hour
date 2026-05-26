import { runSimulation, summarize } from "./simulate.ts";
import type { EndingId, StrategyId } from "./types.ts";

interface Case {
  name: string;
  strategy: StrategyId;
  seed: number;
  expectedEnding: EndingId;
}

const cases: Case[] = [
  { name: "fixed seed completes full loop", strategy: "normal", seed: 25, expectedEnding: "stable_graduation" },
  { name: "money boundary can fail", strategy: "bankrupt", seed: 31, expectedEnding: "living_cost_break" },
  { name: "energy boundary can fail", strategy: "burnout", seed: 32, expectedEnding: "forced_suspension" },
  { name: "pressure boundary can fail", strategy: "pressure", seed: 33, expectedEnding: "pressure_collapse" },
  { name: "review boundary can fail", strategy: "fail_reviews", seed: 34, expectedEnding: "two_failed_reviews" },
];

let failures = 0;

for (const testCase of cases) {
  const result = summarize(runSimulation({ seed: testCase.seed, strategy: testCase.strategy }));
  const ok = result.ending === testCase.expectedEnding;
  console.log(`${ok ? "PASS" : "FAIL"} ${testCase.name}: expected ${testCase.expectedEnding}, got ${result.ending}`);
  console.log(JSON.stringify(result, null, 2));
  if (!ok) {
    failures += 1;
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
