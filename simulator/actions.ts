import { ACTIONS } from "./rules.ts";
import {
  applyDelta,
  applyPositiveYieldPenalty,
  currentRiskPenalty,
  log,
  weeklyLivingCostForState,
} from "./resolver.ts";
import type { ActionId, Delta, GameState } from "./types.ts";

export function canPerformAction(state: GameState, actionId: ActionId): { ok: boolean; reason?: string } {
  const action = ACTIONS[actionId];
  const count = state.weeklyActionCounts[actionId] ?? 0;

  if (state.actionsRemaining <= 0) {
    return { ok: false, reason: "no_weekly_actions_remaining" };
  }

  if (action.maxPerWeek !== undefined && count >= action.maxPerWeek) {
    return { ok: false, reason: "weekly_action_limit_reached" };
  }

  if (state.energy < 30 && action.highEnergyCost) {
    return { ok: false, reason: "energy_high_risk" };
  }

  if (state.pressure > 80 && action.pressureIncreasing) {
    return { ok: false, reason: "pressure_high_risk" };
  }

  if (action.costsMoney && (action.baseDelta.money ?? 0) < 0 && state.money + (action.baseDelta.money ?? 0) < 0) {
    return { ok: false, reason: "not_enough_money" };
  }

  if (actionId === "exercise" && state.money < 300) {
    return { ok: false, reason: "not_enough_money_for_exercise" };
  }

  if (actionId === "socialize" && state.money < 700) {
    return { ok: false, reason: "not_enough_money_for_socialize" };
  }

  if (state.money < weeklyLivingCostForState(state) && (actionId === "read_exhibition" || actionId === "site_research")) {
    return { ok: false, reason: "money_high_risk" };
  }

  return { ok: true };
}

export function performAction(state: GameState, actionId: ActionId): boolean {
  const availability = canPerformAction(state, actionId);
  const action = ACTIONS[actionId];

  if (!availability.ok) {
    log(state, "week_action", action.id, `action unavailable: ${action.name}: ${availability.reason}`, {});
    return false;
  }

  const penalty = currentRiskPenalty(state);
  const delta: Delta = { ...action.baseDelta };

  if (action.progressBase !== undefined) {
    delta.progress = applyPositiveYieldPenalty(action.progressBase + progressModifier(state), penalty);
  }

  if (action.qualityBase !== undefined) {
    delta.quality = applyPositiveYieldPenalty(action.qualityBase + qualityModifier(state), penalty);
  }

  for (const key of ["design", "software", "aesthetic", "presentation", "social", "resilience"] as const) {
    if (delta[key] !== undefined) {
      delta[key] = applyPositiveYieldPenalty(delta[key] ?? 0, penalty);
    }
  }

  state.actionsRemaining -= 1;
  state.weeklyActionCounts[actionId] = (state.weeklyActionCounts[actionId] ?? 0) + 1;
  state.semesterActionTally[actionId] = (state.semesterActionTally[actionId] ?? 0) + 1;
  state.actionTally[actionId] = (state.actionTally[actionId] ?? 0) + 1;

  applyDelta(state, action.id, action.name, delta, "week_action");
  maybeRecordAiPracticeExperience(state, actionId);
  return true;
}

export function progressModifier(state: GameState): number {
  const software = state.attributes.software;
  if (software >= 80) return 3;
  if (software >= 60) return 2;
  if (software >= 40) return 1;
  return 0;
}

export function qualityModifier(state: GameState): number {
  const qualityUnderstanding = Math.floor((state.attributes.design + state.attributes.aesthetic) / 2);
  if (qualityUnderstanding >= 80) return 3;
  if (qualityUnderstanding >= 60) return 2;
  if (qualityUnderstanding >= 40) return 1;
  return 0;
}

function maybeRecordAiPracticeExperience(state: GameState, actionId: ActionId): void {
  if (actionId !== "learn_ai_software") {
    return;
  }

  if ((state.semesterActionTally.learn_ai_software ?? 0) < 4) {
    return;
  }

  if (state.aiPracticeAwardedSemesters.includes(state.semesterIndex)) {
    return;
  }

  state.aiPracticeAwardedSemesters.push(state.semesterIndex);
  state.aiExperience += 1;
  log(
    state,
    "week_action",
    "learn_ai_software:ai_experience",
    "AI experience +1 from repeated software practice",
    {},
  );
}
