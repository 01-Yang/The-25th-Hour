import { runSimulation, summarize } from "./simulate.ts";
import { createInitialState } from "./state.ts";
import { maybeResolveHiddenRouteResultAfterReview, routeOutcomeForEnding } from "./routes.ts";
import type { GameState } from "./types.ts";

let failures = 0;

const inaccessible = summarize(runSimulation({ seed: 25, strategy: "career_change", events: true, routeTarget: "entrepreneurship" }));
check("entrepreneurship target binds career-change route", inaccessible.formalRoute === "career_change", inaccessible);
check("entrepreneurship is locked before six attributes reach 90", inaccessible.hiddenRouteOutcome === "career_change_failed", inaccessible);
check("locked entrepreneurship does not offer contract", inaccessible.entrepreneurshipContractOffered === false, inaccessible);

const signed = resolveEntrepreneurshipHarness("signed");
check("eligible entrepreneurship offers contract", signed.route.entrepreneurshipContract?.contractOffered === true, signed);
check("signed contract resolves hidden route", signed.route.hiddenResult?.outcome === "no_way_back_choice", signed);
check("signed contract reaches final parser", routeOutcomeForEnding(signed) === "no_way_back_choice", signed);

const abandoned = resolveEntrepreneurshipHarness("abandoned");
check("abandoned contract does not resolve special ending", abandoned.route.hiddenResult?.outcome === "career_change_failed", abandoned);
check("abandoned contract stores player choice", abandoned.route.entrepreneurshipContract?.contractChoice === "abandoned", abandoned);

if (failures > 0) {
  process.exitCode = 1;
}

function resolveEntrepreneurshipHarness(contractChoice: "signed" | "abandoned"): GameState {
  const state = createInitialState(25, "career_change");
  state.semesterIndex = 9;
  state.week = 49;
  state.weekInSemester = 6;
  state.completedGraduationDesign = true;
  state.route.targetOverride = "entrepreneurship";
  state.route.formal = {
    route: "career_change",
    group: "career_change",
    target: "entrepreneurship",
    week: 49,
  };
  state.route.entrepreneurshipContract = {
    unlocked: true,
    contractOffered: false,
    contractChoice,
  };
  state.attributes = {
    design: 90,
    software: 90,
    aesthetic: 90,
    presentation: 90,
    social: 90,
    resilience: 90,
  };

  maybeResolveHiddenRouteResultAfterReview(state);
  return state;
}

function check(name: string, condition: boolean, detail: unknown): void {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);
  if (!condition) {
    console.log(JSON.stringify(detail, null, 2));
    failures += 1;
  }
}
