import { runBatch, runSimulation, summarize } from "./simulate.ts";

let failures = 0;

const first = summarize(runSimulation({ seed: 25, strategy: "normal", events: true }));
const second = summarize(runSimulation({ seed: 25, strategy: "normal", events: true }));

check("same seed reproduces internship application counts", first.internshipApplicationCount === second.internshipApplicationCount, { first, second });
check("same seed reproduces accepted internship counts", first.internshipAcceptedCount === second.internshipAcceptedCount, { first, second });
check("internship records require completed internships", first.internshipRecordCount === first.internshipAcceptedCount, first);
check("applications can reject before final tier", first.internshipRejectedCount > 0, first);
check("completed internship leaves no active internship", first.activeInternshipTier === null, first);

const normalBatch = runBatch("normal", 50, 1, true);
const hasApplications = normalBatch.every((run) => run.internshipApplicationCount > 0);
const hasCompletedInternship = normalBatch.every((run) => run.internshipRecordCount > 0);
const hasRejections = normalBatch.some((run) => run.internshipRejectedCount > 0);
const hasNamedFirm = normalBatch.some((run) => run.internshipTier === "named_firm");
const namedFirmAttemptsWithinCap = normalBatch.every((run) => run.internshipNamedFirmApplicationCount <= 1);
check("normal batch applies for internships", hasApplications, normalBatch);
check("normal batch completes at least one internship", hasCompletedInternship, normalBatch);
check("normal batch includes probabilistic rejection", hasRejections, normalBatch);
check("normal batch can still reach named firm", hasNamedFirm, normalBatch);
check("normal batch limits named-firm attempts", namedFirmAttemptsWithinCap, normalBatch);

const earlyFailure = summarize(runSimulation({ seed: 31, strategy: "bankrupt", events: true }));
check("early failure has no internship applications", earlyFailure.internshipApplicationCount === 0, earlyFailure);

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
