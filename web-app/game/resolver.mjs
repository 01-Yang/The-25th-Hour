import {
  ATTRIBUTE_KEYS,
  BASE_ACTIONS_PER_WEEK,
  GRADE_ORDER,
  GRADE_SCORE_RANGES,
  GRADE_TO_GPA,
  WEEKS_PER_SEMESTER,
} from "./data.mjs";
import { getCharacter, getFamily, log } from "./state.mjs";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function progressCap(state) {
  return state.semesterIndex >= 9 ? 200 : 100;
}

export function qualityCap(state) {
  return state.semesterIndex >= 9 ? 200 : 100;
}

export function currentRiskLevel(state) {
  if (state.energy < 30 || state.pressure > 80) {
    return "critical";
  }
  if ((state.energy >= 30 && state.energy < 60) || (state.pressure > 50 && state.pressure <= 80)) {
    return "warning";
  }
  return "stable";
}

export function currentRiskPenalty(state) {
  const level = currentRiskLevel(state);
  return level === "critical" ? 2 : level === "warning" ? 1 : 0;
}

export function applyPositiveYieldPenalty(value, penalty) {
  if (value <= 0 || penalty <= 0) {
    return value;
  }
  return Math.max(1, value - penalty);
}

export function progressModifier(state) {
  const software = state.attributes.software;
  if (software >= 80) return 3;
  if (software >= 60) return 2;
  if (software >= 40) return 1;
  return 0;
}

export function qualityModifier(state) {
  const qualityUnderstanding = Math.floor((state.attributes.design + state.attributes.aesthetic) / 2);
  if (qualityUnderstanding >= 80) return 3;
  if (qualityUnderstanding >= 60) return 2;
  if (qualityUnderstanding >= 40) return 1;
  return 0;
}

export function applyDelta(state, source, label, rawDelta = {}, phase = state.phase, options = {}) {
  if (state.ending) {
    return {};
  }

  const delta = adjustDeltaForPassives(state, { ...rawDelta }, options);
  const adjusted = adjustAttributeGrowth(state, delta);

  state.energy += adjusted.energy ?? 0;
  state.pressure += adjusted.pressure ?? 0;
  state.money += adjusted.money ?? 0;
  state.progress += adjusted.progress ?? 0;
  state.quality += adjusted.quality ?? 0;
  state.portfolio += adjusted.portfolio ?? 0;
  state.gpaModifier += adjusted.gpaModifier ?? 0;

  for (const key of ATTRIBUTE_KEYS) {
    const amount = adjusted[key] ?? 0;
    state.attributes[key] += amount;
    state.attributes[key] = clamp(state.attributes[key], 0, 100);
    if (amount > 0) {
      state.semesterAttributeGrowth[key] += amount;
    }
  }

  state.pressure = clamp(state.pressure, 0, 100);
  state.energy = Math.min(state.energy, state.maxEnergy);
  state.progress = clamp(state.progress, 0, progressCap(state));
  state.quality = clamp(state.quality, 0, qualityCap(state));

  maybeTriggerRelaxedPassive(state);
  checkImmediateFailures(state);
  log(state, phase, source, label, adjusted);
  return adjusted;
}

export function checkImmediateFailures(state) {
  if (state.ending) {
    return;
  }
  if (state.money < 0) {
    state.failureReason = "living_cost_break";
    state.ending = "living_cost_break";
    state.phase = "ending";
    log(state, "ending", "failure_check", "金钱小于 0，触发生活费断裂", {});
  }
  if (!state.ending && state.energy < 0) {
    state.failureReason = "forced_suspension";
    state.ending = "forced_suspension";
    state.phase = "ending";
    log(state, "ending", "failure_check", "精力小于 0，触发被迫停学", {});
  }
}

export function weeklyLivingCost(state) {
  return getFamily(state).weeklyLivingCost;
}

export function monthlyAllowance(state) {
  return getFamily(state).monthlyAllowance;
}

export function applyWeeklySettlement(state) {
  if (state.ending) {
    return;
  }

  applyDelta(state, "weekly_living_cost", "每周自动花费", { money: -weeklyLivingCost(state) }, "week_settlement");
  if (state.ending) return;

  applyDelta(state, "weekly_recovery", "每周基础恢复", { energy: 10, pressure: -5 }, "week_settlement");
  if (state.ending) return;

  if (state.pressure > 90) {
    state.pressureOver90Weeks += 1;
  } else {
    state.pressureOver90Weeks = 0;
  }

  if (state.pressureOver90Weeks >= 2) {
    state.failureReason = "pressure_collapse";
    state.ending = "pressure_collapse";
    state.phase = "ending";
    log(state, "ending", "failure_check", "压力 > 90 连续 2 周", {});
  }
}

export function isMoneyHighRisk(state) {
  return state.money < weeklyLivingCost(state);
}

export function isGraduationSemester(state) {
  return state.semesterIndex >= 9;
}

export function reviewProgressRequirement(state) {
  const ease = activeReviewEase(state);
  const base = state.semesterIndex === 10 ? 200 : 100;
  return Math.max(0, base + (ease?.progressGate ?? 0));
}

export function reviewQualityFGate(state) {
  const ease = activeReviewEase(state);
  return Math.max(0, 45 + (ease?.qualityFGate ?? 0));
}

export function gradeFromQuality(state, qualityScore) {
  const fGate = reviewQualityFGate(state);
  if (qualityScore < fGate) return "F";
  if (qualityScore >= 95) return "S";
  if (qualityScore >= 85) return "A";
  if (qualityScore >= 72) return "B";
  if (qualityScore >= 60) return "C";
  return "D";
}

export function shiftGrade(grade, amount, maxGrade = "S") {
  const current = GRADE_ORDER.indexOf(grade);
  const max = GRADE_ORDER.indexOf(maxGrade);
  return GRADE_ORDER[clamp(current + amount, 0, max)];
}

export function clampScoreToGrade(score, grade) {
  const [min, max] = GRADE_SCORE_RANGES[grade];
  return clamp(score, min, max);
}

export function calculateReviewBase(state) {
  const progressRequirement = reviewProgressRequirement(state);
  const progressGateFailed = state.progress < progressRequirement;
  const qualityScore = state.semesterIndex >= 9 ? Math.floor(state.quality / 2) : state.quality;
  const baseGrade = progressGateFailed ? "F" : gradeFromQuality(state, qualityScore);
  const failureKind = progressGateFailed ? "progress" : baseGrade === "F" ? "quality" : null;
  const baseScore = progressGateFailed ? 0 : clampScoreToGrade(qualityScore, baseGrade);
  return {
    progressRequirement,
    progressGateFailed,
    qualityScore,
    baseGrade,
    failureKind,
    baseScore,
  };
}

export function finalizeReview(state, strategyResult) {
  const base = calculateReviewBase(state);
  const ease = activeReviewEase(state);
  let finalGrade = strategyResult?.finalGrade ?? base.baseGrade;
  if (ease?.maxGrade) {
    finalGrade = shiftGrade(finalGrade, 0, ease.maxGrade);
  }

  const finalScore = clampScoreToGrade(strategyResult?.finalScore ?? base.baseScore, finalGrade);
  const designCourseGpa = GRADE_TO_GPA[finalGrade];
  const effectiveGpaModifier = finalGrade === "F" ? Math.min(0, state.gpaModifier) : state.gpaModifier;
  const semesterGpa = clamp(designCourseGpa + effectiveGpaModifier, 0, 4);
  const portfolioAdded = shouldAddPortfolio(state, finalGrade) ? finalScore : 0;

  const record = {
    semesterIndex: state.semesterIndex,
    year: state.year,
    term: state.term,
    progress: state.progress,
    quality: state.quality,
    qualityScore: base.qualityScore,
    progressRequirement: base.progressRequirement,
    baseGrade: base.baseGrade,
    finalGrade,
    finalScore,
    strategyId: strategyResult?.strategyId ?? null,
    strategySucceeded: strategyResult?.succeeded ?? null,
    designCourseGpa,
    semesterGpa,
    portfolioAdded,
  };

  state.reviews.push(record);
  state.gpaHistory.push(semesterGpa);
  state.gpa = state.gpaHistory.reduce((sum, item) => sum + item, 0) / state.gpaHistory.length;
  if (portfolioAdded > 0) {
    applyDelta(state, "review_portfolio", `作品集入库 +${portfolioAdded}`, { portfolio: portfolioAdded }, "review", { skipPassive: true });
  }

  if (finalGrade === "F") {
    state.consecutiveFailedReviews = (state.consecutiveFailedReviews ?? 0) + 1;
  } else {
    state.consecutiveFailedReviews = 0;
  }

  if (state.semesterIndex === 10) {
    state.completedGraduationDesign = finalGrade !== "F" && state.progress >= 200;
  }

  log(state, "review", "review_final", `评图完成：${finalGrade}，作品分 ${finalScore}，本学期绩点 ${semesterGpa.toFixed(2)}`, {});

  if (state.semesterIndex === 10 && !state.completedGraduationDesign && !state.ending) {
    state.ending = "graduation_failed";
    state.phase = "ending";
    return record;
  }

  if (state.consecutiveFailedReviews >= 2 && !state.ending) {
    state.failureReason = "two_failed_reviews";
    state.ending = "two_failed_reviews";
    state.phase = "ending";
    log(state, "ending", "failure_check", "连续 2 次最终评图为 F", {});
  }

  state.gpaModifier = 0;
  state.specialSkill.reviewEase = null;
  state.specialSkill.reviewEaseSemester = null;

  if (state.semesterIndex < 9 || state.semesterIndex === 10) {
    state.progress = 0;
    state.quality = 0;
  }

  return record;
}

export function settleFinalEnding(state) {
  if (state.ending) {
    return;
  }
  if (!state.completedGraduationDesign) {
    state.ending = "graduation_failed";
  } else if (state.energy < 35 || state.pressure > 75) {
    state.ending = "wounded_graduation";
  } else {
    state.ending = "stable_graduation";
  }
  state.phase = "ending";
  log(state, "ending", "ending_resolved", `结局读取：${state.ending}`, {});
}

function shouldAddPortfolio(state, finalGrade) {
  if (finalGrade === "F") return false;
  if (state.semesterIndex === 9) return false;
  return true;
}

function adjustAttributeGrowth(state, delta) {
  const adjusted = { ...delta };
  for (const key of ATTRIBUTE_KEYS) {
    const amount = delta[key];
    if (!amount) {
      continue;
    }

    const current = state.attributes[key];
    if (amount > 0 && current >= 80) {
      adjusted[key] = Math.max(1, Math.ceil(amount / 2));
    } else if (amount < 0 && current <= 20) {
      adjusted[key] = -Math.max(1, Math.ceil(Math.abs(amount) / 2));
    }
  }
  return adjusted;
}

function adjustDeltaForPassives(state, delta, options) {
  if (options.skipPassive) {
    return delta;
  }

  const character = getCharacter(state);
  if (!character) {
    return delta;
  }

  if (character.id === "pressure_immune" && delta.pressure > 0) {
    delta.pressure = Math.max(1, delta.pressure - 1);
  }

  if (character.id === "poor_scholar" && delta.pressure > 0) {
    delta.pressure += 1;
  }

  if (character.id === "poor_scholar" && options.positiveKind && ["learning", "progress"].includes(options.positiveKind)) {
    for (const key of ["progress", "quality", ...ATTRIBUTE_KEYS]) {
      if (delta[key] > 0) {
        delta[key] += 1;
      }
    }
  }

  if (character.id === "full_pressure" && state.pressure >= 70) {
    if (options.actionId === "normal_drawing" || options.actionId === "crunch_drawing") {
      delta.progress = (delta.progress ?? 0) + 2;
    }
    if (options.actionId === "design_iteration") {
      delta.quality = (delta.quality ?? 0) + 2;
    }
  }

  if (state.passiveState?.mixedInPressureShields > 0 && options.sourceType === "event" && delta.pressure > 0) {
    delta.pressure = 0;
    state.passiveState.mixedInPressureShields -= 1;
  }

  return delta;
}

function maybeTriggerRelaxedPassive(state) {
  const character = getCharacter(state);
  if (character?.id !== "born_lucky") {
    return;
  }
  if (state.pressure >= 70 && state.passiveState.relaxedTriggers < 2 && !state.ending) {
    state.passiveState.relaxedTriggers += 1;
    state.pressure = clamp(state.pressure - 5, 0, 100);
    log(state, state.phase, "passive:born_lucky", "松弛感触发，压力 -5", { pressure: -5 });
  }
}

function activeReviewEase(state) {
  if (state.specialSkill.reviewEaseSemester === state.semesterIndex) {
    return state.specialSkill.reviewEase;
  }
  return null;
}

export function semesterWeekGlobalIndex(state) {
  return (state.semesterIndex - 1) * WEEKS_PER_SEMESTER + state.weekInSemester;
}

export function actionsForThisWeek(state) {
  return state.actionsPerWeek ?? BASE_ACTIONS_PER_WEEK;
}
