import { aggregate, runBatch } from "./simulate.ts";
import type { StrategyId } from "./types.ts";

const args = parseArgs(process.argv.slice(2));
const count = Number(args.count ?? 1000);
const seed = Number(args.seed ?? 1);
const strategies = (args.strategies ?? "normal,balanced,postgrad,overseas,civil_service,architecture_job,career_change")
  .split(",")
  .filter(Boolean) as StrategyId[];
const includeEvents = args.events === "true" || args.events === "1";

const report = {
  seedStart: seed,
  count,
  events: includeEvents,
  strategies: Object.fromEntries(
    strategies.map((strategy) => {
      const results = runBatch(strategy, count, seed, includeEvents);
      return [strategy, aggregate(results)];
    }),
  ),
};

console.log(JSON.stringify(report, null, 2));

function parseArgs(argv: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}
