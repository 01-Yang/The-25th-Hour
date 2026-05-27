import { runBatch, runSimulation, summarize } from "./simulate.ts";

let failures = 0;

const batch = runBatch("architecture_job", 100, 1, true);

check(
  "completed internship value is cumulative",
  batch.every((run) => run.internshipValue === run.internshipRecords.reduce((sum, record) => sum + record.value, 0)),
  batch.map((run) => ({
    seed: run.seed,
    internshipValue: run.internshipValue,
    recordValues: run.internshipRecords.map((record) => record.value),
  })),
);

check(
  "multi-internship runs can exceed the highest single tier value",
  batch.some((run) => run.internshipRecords.length > 1 && run.internshipValue > Math.max(...run.internshipRecords.map((record) => record.value))),
  batch.map((run) => ({
    seed: run.seed,
    internshipValue: run.internshipValue,
    recordValues: run.internshipRecords.map((record) => record.value),
  })),
);

for (const target of ["independent_studio", "local_design_institute", "state_owned_design_institute", "foreign_firm", "master_studio"] as const) {
  const result = summarize(runSimulation({ seed: 25, strategy: "architecture_job", events: true, routeTarget: target }));
  check(`${target} reads cumulative internship value at decision`, result.hiddenRouteInternshipValue === result.internshipValue, result);
  check(`${target} uses internship value rather than named-firm-only gate`, result.hiddenRouteFailureReasons?.includes("internship_below_threshold") === false, result);
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
