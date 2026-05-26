import { normalizeSeed } from "./rng.ts";
import { INITIAL_ATTRIBUTES, INITIAL_STATE } from "./rules.ts";
import type { GameState, StateSnapshot, StrategyId } from "./types.ts";

export function createInitialState(seed: number, strategy: StrategyId): GameState {
  return {
    seed,
    rngState: normalizeSeed(seed),
    strategy,
    phase: "profile",
    week: 0,
    year: 1,
    term: 1,
    weekInSemester: 0,
    semesterIndex: 1,
    actionsRemaining: 0,
    weeklyActionCounts: {},
    energy: INITIAL_STATE.energy,
    maxEnergy: INITIAL_STATE.maxEnergy,
    pressure: INITIAL_STATE.pressure,
    money: INITIAL_STATE.money,
    gpa: INITIAL_STATE.gpa,
    gpaHistory: [],
    gpaModifier: 0,
    courseRecords: [],
    attributes: { ...INITIAL_ATTRIBUTES },
    progress: 0,
    quality: 0,
    portfolio: 0,
    consecutiveFailedReviews: 0,
    pressureOver90Weeks: 0,
    reviews: [],
    logs: [],
    eventHistory: [],
    eventRecords: [],
    eventLastTriggeredWeek: {},
    eventTally: {},
    aiExperience: 0,
    route: {},
    internshipValue: 0,
    namedFirmInternship: false,
    internshipRecords: [],
    competitionAwardCount: 0,
    competitionRecords: [],
    guaranteedEvents: {
      lightlyHolding: false,
      deskNote: false,
    },
    actionTally: {},
    completedGraduationDesign: false,
  };
}

export function snapshot(state: GameState): StateSnapshot {
  return {
    energy: state.energy,
    pressure: state.pressure,
    money: state.money,
    progress: state.progress,
    quality: state.quality,
    gpa: round(state.gpa, 2),
    portfolio: state.portfolio,
    consecutiveFailedReviews: state.consecutiveFailedReviews,
    ending: state.ending,
  };
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
