import { runSimulation, summarize } from "./simulate.ts";

let failures = 0;

const first = runSimulation({ seed: 25, strategy: "normal", events: true });
const second = runSimulation({ seed: 25, strategy: "normal", events: true });
const firstSummary = summarize(first);
const secondSummary = summarize(second);

check(
  "same seed reproduces same event sequence",
  firstSummary.eventIds === secondSummary.eventIds &&
    firstSummary.ending === secondSummary.ending &&
    firstSummary.reviews === secondSummary.reviews,
  { first: firstSummary, second: secondSummary },
);

const modelWeekOk = first.eventRecords
  .filter((event) => event.pool === "model_week")
  .every((event) => ((event.week - 1) % 6) + 1 === 5);
check("model-week events only appear on week 5 of a semester", modelWeekOk, first.eventRecords);

const aiOk = first.eventRecords
  .filter((event) => event.aiExperienceDelta > 0)
  .every((event) => event.semesterIndex >= 2 && event.semesterIndex <= 6);
check("AI experience events only appear from semester 2 to 6", aiOk, first.eventRecords);

check(
  "guaranteed events fire",
  first.eventTally.stage_lightly_holding === 1 && first.eventTally.desk_note === 1,
  first.eventTally,
);

const cooldownOk = Object.entries(first.eventTally).every(([eventId, count]) => {
  if (count <= 1) {
    return true;
  }

  const weeks = first.eventRecords.filter((event) => event.eventId === eventId).map((event) => event.week);
  for (let i = 1; i < weeks.length; i += 1) {
    if (weeks[i] - weeks[i - 1] <= 3) {
      return false;
    }
  }
  return true;
});
check("repeated events respect short cooldown spacing", cooldownOk, first.eventRecords);

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
