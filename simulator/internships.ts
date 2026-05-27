import { INTERNSHIP_APPLICATION, INTERNSHIP_THRESHOLDS } from "./balance.ts";
import { randomInt } from "./rng.ts";
import { applyDelta, log } from "./resolver.ts";
import type { GameState, InternshipTier } from "./types.ts";

const INTERNSHIP_WEEKLY_DELTAS = {
  ordinary: { money: 300, energy: -3, pressure: 2 },
  strong: { money: 500, energy: -4, pressure: 3 },
  named_firm: { money: 800, energy: -5, pressure: 4 },
} as const;

const INTERNSHIP_COMPLETION_DELTAS = {
  ordinary: { design: 1 },
  strong: { design: 1, software: 1 },
  named_firm: { design: 1, software: 1, presentation: 1 },
} as const;

export function maybeApplyInternshipWeek(state: GameState): void {
  const active = state.activeInternship;
  if (!active || state.ending) {
    return;
  }

  const delta = INTERNSHIP_WEEKLY_DELTAS[active.tier];
  active.remainingWeeks -= 1;
  active.weeksCompleted += 1;
  active.wageTotal += delta.money;
  applyDelta(state, "internship_week", `internship week: ${active.tier}`, delta, "week_settlement");

  if (active.remainingWeeks <= 0 && !state.ending) {
    completeInternship(state);
  }
}

export function maybeApplyForInternship(state: GameState): void {
  if (state.semesterIndex < INTERNSHIP_APPLICATION.earliestSemester || state.ending || state.activeInternship) {
    return;
  }

  if (state.internshipAppliedSemesters.includes(state.semesterIndex)) {
    return;
  }

  const tier = desiredInternshipTier(state);
  if (!tier) {
    return;
  }

  state.internshipAppliedSemesters.push(state.semesterIndex);
  const chance = internshipChance(state, tier);
  const [rngState, roll] = randomInt(state.rngState, 1, 100);
  state.rngState = rngState;
  const accepted = roll <= chance;

  state.internshipApplications.push({
    semesterIndex: state.semesterIndex,
    week: state.week,
    tier,
    chance,
    roll,
    accepted,
    designAtApplication: state.attributes.design,
    softwareAtApplication: state.attributes.software,
  });

  if (!accepted) {
    log(state, state.phase, "internship_application", `internship rejected: ${tier} roll=${roll} chance=${chance}`, {});
    return;
  }

  state.activeInternship = {
    tier,
    value: internshipValue(tier),
    startSemesterIndex: state.semesterIndex,
    startWeek: state.week,
    remainingWeeks: INTERNSHIP_APPLICATION.durationWeeks,
    weeksCompleted: 0,
    wageTotal: 0,
    designAtOffer: state.attributes.design,
    softwareAtOffer: state.attributes.software,
  };

  log(state, state.phase, "internship_application", `internship accepted: ${tier} roll=${roll} chance=${chance}`, {});
}

function completeInternship(state: GameState): void {
  const active = state.activeInternship;
  if (!active) {
    return;
  }

  applyDelta(
    state,
    "internship_complete",
    `internship completed: ${active.tier}`,
    {
      ...INTERNSHIP_COMPLETION_DELTAS[active.tier],
      internshipValue: active.value,
    },
    "week_settlement",
  );

  state.namedFirmInternship ||= active.tier === "named_firm";
  state.internshipRecords.push({
    semesterIndex: active.startSemesterIndex,
    week: active.startWeek,
    completedWeek: state.week,
    tier: active.tier,
    value: active.value,
    designAtOffer: active.designAtOffer,
    softwareAtOffer: active.softwareAtOffer,
    wageTotal: active.wageTotal,
    weeksCompleted: active.weeksCompleted,
  });
  state.activeInternship = undefined;
  log(state, "week_settlement", "internship_resume", `internship resume value recorded: ${active.tier}`, {});
}

function desiredInternshipTier(state: GameState): InternshipTier | undefined {
  if (!hasCompletedTier(state, "ordinary") && isEligibleForTier(state, "ordinary")) {
    return "ordinary";
  }
  if (!hasCompletedTier(state, "strong") && isEligibleForTier(state, "strong")) {
    return "strong";
  }
  if (!hasCompletedTier(state, "named_firm") && isEligibleForTier(state, "named_firm")) {
    return "named_firm";
  }
  return undefined;
}

function isEligibleForTier(state: GameState, tier: InternshipTier): boolean {
  const thresholds = thresholdsForTier(tier);
  const application = INTERNSHIP_APPLICATION.tiers[tier];
  return (
    state.semesterIndex >= application.semesterMin &&
    state.semesterIndex <= application.semesterMax &&
    applicationCountForTier(state, tier) < application.maxAttempts &&
    completedInternshipTierValue(state) >= application.priorValueRequired &&
    state.attributes.design >= thresholds.design &&
    state.attributes.software >= thresholds.software
  );
}

function internshipChance(state: GameState, tier: InternshipTier): number {
  const thresholds = thresholdsForTier(tier);
  const application = INTERNSHIP_APPLICATION.tiers[tier];
  const designExcess = Math.min(application.excessCap, Math.max(0, state.attributes.design - thresholds.design));
  const softwareExcess = Math.min(application.excessCap, Math.max(0, state.attributes.software - thresholds.software));
  const averageExcess = (designExcess + softwareExcess) / 2;
  return Math.min(application.maxChance, Math.round(application.baseChance + averageExcess * application.excessMultiplier));
}

function thresholdsForTier(tier: InternshipTier): { design: number; software: number; value: number } {
  switch (tier) {
    case "named_firm":
      return INTERNSHIP_THRESHOLDS.namedFirm;
    case "strong":
      return INTERNSHIP_THRESHOLDS.strong;
    case "ordinary":
      return INTERNSHIP_THRESHOLDS.ordinary;
  }
}

function internshipValue(tier: InternshipTier): number {
  return thresholdsForTier(tier).value;
}

function applicationCountForTier(state: GameState, tier: InternshipTier): number {
  return state.internshipApplications.filter((application) => application.tier === tier).length;
}

function hasCompletedTier(state: GameState, tier: InternshipTier): boolean {
  return state.internshipRecords.some((record) => record.tier === tier);
}

function completedInternshipTierValue(state: GameState): number {
  return state.internshipRecords.reduce((max, record) => Math.max(max, record.value), 0);
}
