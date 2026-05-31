import {
  ATTRIBUTE_KEYS,
  BASE_ACTIONS_PER_WEEK,
  CHARACTERS,
  COURSES,
  FAMILY_BACKGROUNDS,
  FIXED_EVENTS,
  SAVE_VERSION,
} from "./data.mjs";
import { normalizeSeed, sampleMany } from "./rng.mjs";

export function createGame({ nickname, universityName, seed }) {
  const normalizedSeed = normalizeSeed(seed);
  const state = {
    version: SAVE_VERSION,
    seed: normalizedSeed,
    rngState: normalizedSeed,
    phase: "profile",
    profile: {
      nickname: String(nickname ?? "").trim(),
      universityName: String(universityName ?? "").trim(),
      characterId: null,
      mentorId: null,
    },
    year: 1,
    term: 1,
    semesterIndex: 1,
    week: 0,
    weekInSemester: 0,
    actionsRemaining: 0,
    actionsPerWeek: BASE_ACTIONS_PER_WEEK,
    weeklyActionCounts: {},
    semesterActionTally: {},
    semesterAttributeGrowth: emptyAttributes(),
    actionTally: {},
    energy: 100,
    maxEnergy: 100,
    pressure: 20,
    money: 2000,
    gpa: 4.0,
    gpaHistory: [],
    gpaModifier: 0,
    attributes: emptyAttributes(28),
    progress: 0,
    quality: 0,
    portfolio: 0,
    courseId: null,
    courseYear: null,
    courseExam: null,
    mentorCandidates: [],
    characterCandidates: [],
    previousCharacterCandidates: [],
    rerollsRemaining: 1,
    fixedEventIndex: 0,
    modelMaterialBySemester: {},
    currentModelMaterialId: null,
    pendingInteraction: null,
    modalQueue: [],
    logs: [],
    reviews: [],
    eventHistory: [],
    eventLastTriggeredWeek: {},
    eventTally: {},
    guaranteedEvents: {
      lightlyHolding: false,
      deskNote: false,
    },
    aiExperience: 0,
    specialSkill: {
      lastUsedWeek: null,
      reviewEaseSemester: null,
      reviewEase: null,
    },
    passiveState: {
      relaxedTriggers: 0,
      mixedInPressureShields: 0,
      mixedInSemester: null,
    },
    pressureOver90Weeks: 0,
    completedGraduationDesign: false,
    ending: null,
    failureReason: null,
  };

  state.rngState = drawCharacterCandidates(state, []);
  state.phase = "character_select";
  log(state, "system", "profile_created", "开局档案已建立", {});
  return state;
}

export function reviveState(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const state = structuredClone(raw);
  state.version = state.version ?? SAVE_VERSION;
  state.modalQueue = Array.isArray(state.modalQueue) ? state.modalQueue : [];
  state.pendingInteraction = state.pendingInteraction ?? null;
  state.profile = state.profile ?? {};
  state.courseYear = state.courseYear ?? (state.courseId ? state.year : null);
  state.attributes = { ...emptyAttributes(), ...(state.attributes ?? {}) };
  state.semesterAttributeGrowth = { ...emptyAttributes(), ...(state.semesterAttributeGrowth ?? {}) };
  state.weeklyActionCounts = state.weeklyActionCounts ?? {};
  state.semesterActionTally = state.semesterActionTally ?? {};
  state.actionTally = state.actionTally ?? {};
  state.eventHistory = state.eventHistory ?? [];
  state.eventLastTriggeredWeek = state.eventLastTriggeredWeek ?? {};
  state.eventTally = state.eventTally ?? {};
  state.logs = state.logs ?? [];
  state.reviews = state.reviews ?? [];
  state.guaranteedEvents = {
    lightlyHolding: Boolean(state.guaranteedEvents?.lightlyHolding),
    deskNote: Boolean(state.guaranteedEvents?.deskNote),
  };
  state.passiveState = {
    relaxedTriggers: state.passiveState?.relaxedTriggers ?? 0,
    mixedInPressureShields: state.passiveState?.mixedInPressureShields ?? 0,
    mixedInSemester: state.passiveState?.mixedInSemester ?? null,
  };
  state.specialSkill = {
    lastUsedWeek: state.specialSkill?.lastUsedWeek ?? null,
    reviewEaseSemester: state.specialSkill?.reviewEaseSemester ?? null,
    reviewEase: state.specialSkill?.reviewEase ?? null,
  };
  return state;
}

export function drawCharacterCandidates(state, excludedIds) {
  const excluded = new Set(excludedIds);
  const pool = CHARACTERS.filter((character) => !excluded.has(character.id));
  const [rngState, candidates] = sampleMany(state.rngState, pool, 3);
  state.characterCandidates = candidates.map((character) => character.id);
  return rngState;
}

export function getCharacter(state) {
  return CHARACTERS.find((character) => character.id === state.profile.characterId);
}

export function getFamily(state) {
  const character = getCharacter(state);
  return FAMILY_BACKGROUNDS[character?.familyId ?? "ordinary"];
}

export function getCourse(state) {
  return COURSES.find((course) => course.id === state.courseId);
}

export function pushModal(state, interaction) {
  if (state.pendingInteraction) {
    state.modalQueue.push(interaction);
  } else {
    state.pendingInteraction = interaction;
  }
}

export function popModal(state) {
  state.pendingInteraction = state.modalQueue.shift() ?? null;
}

export function requireNoPending(state) {
  if (state.pendingInteraction) {
    return { ok: false, reason: "pending_interaction" };
  }
  return { ok: true };
}

export function currentSemesterLabel(state) {
  return `大${state.year}${state.term === 1 ? "上" : "下"}`;
}

export function updateCalendarFromSemester(state) {
  state.year = Math.ceil(state.semesterIndex / 2);
  state.term = state.semesterIndex % 2 === 1 ? 1 : 2;
}

export function emptyAttributes(value = 0) {
  return ATTRIBUTE_KEYS.reduce((shape, key) => {
    shape[key] = value;
    return shape;
  }, {});
}

export function snapshot(state) {
  return {
    energy: state.energy,
    pressure: state.pressure,
    money: state.money,
    progress: state.progress,
    quality: state.quality,
    gpa: round(state.gpa, 2),
    portfolio: state.portfolio,
    ending: state.ending,
  };
}

export function log(state, phase, source, message, delta = {}) {
  state.logs.push({
    index: state.logs.length + 1,
    week: state.week,
    semesterIndex: state.semesterIndex,
    year: state.year,
    term: state.term,
    weekInSemester: state.weekInSemester,
    phase,
    source,
    message,
    delta,
    snapshot: snapshot(state),
  });
}

export function nextFixedEvent() {
  return FIXED_EVENTS[0];
}

export function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
