import { canPerformAction } from "./actions.ts";
import { ROUTE_TARGETS, ROUTE_THRESHOLDS, ROUTE_TIMING, STRATEGY_TUNING } from "./balance.ts";
import { isGraduationDesign, progressCapForSemester } from "./rules.ts";
import type { ActionId, AttributeKey, GameState, RouteId, StrategyId } from "./types.ts";

export function chooseAction(state: GameState, strategy: StrategyId): ActionId {
  switch (strategy) {
    case "bankrupt":
      return firstAvailable(state, ["socialize", "exercise", "read_exhibition", "rest"]);
    case "burnout":
      return firstAvailable(state, ["crunch_drawing", "normal_drawing", "design_iteration", "rest"]);
    case "pressure":
      return firstAvailable(state, ["crunch_drawing", "design_iteration", "normal_drawing", "learn_ai_software", "rest"]);
    case "fail_reviews":
      return firstAvailable(state, ["rest", "socialize", "read_exhibition", "exercise"]);
    case "balanced":
      return balancedAction(state);
    case "postgrad":
    case "overseas":
    case "civil_service":
    case "architecture_job":
    case "career_change":
      return routeAction(state, strategy);
    case "normal":
    default:
      return normalAction(state);
  }
}

function normalAction(state: GameState): ActionId {
  if (state.energy < 35 || state.pressure > 78) {
    return "rest";
  }

  const requiredProgress = requiredProgressForCurrentReview(state);
  const targetQuality = targetQualityForCurrentReview(state);
  const lastReview = state.reviews[state.reviews.length - 1];
  const recoveryMode = lastReview?.finalGrade === "F" || state.consecutiveFailedReviews > 0;
  const weeksLeft = Math.max(0, 6 - state.weekInSemester + 1);
  const projectedProgressActions = Math.ceil(Math.max(0, requiredProgress - state.progress) / 18);
  const projectedQualityActions = Math.ceil(Math.max(0, targetQuality - state.quality) / 11);
  const urgentCoursework = recoveryMode || projectedProgressActions + projectedQualityActions >= weeksLeft * 2;

  if (!urgentCoursework && state.money < 900 && canPerformAction(state, "part_time").ok) {
    return "part_time";
  }

  if (state.progress < requiredProgress - 28 && state.weekInSemester >= 5 && canPerformAction(state, "crunch_drawing").ok) {
    return "crunch_drawing";
  }

  if (state.progress < requiredProgress) {
    return "normal_drawing";
  }

  if (state.quality < targetQuality) {
    if (canPerformAction(state, "site_research").ok) {
      return "site_research";
    }
    return "design_iteration";
  }

  if (state.pressure > 55) {
    return "rest";
  }

  if (state.money < 900 && canPerformAction(state, "part_time").ok) {
    return "part_time";
  }

  if (state.attributes.software < 50 && state.semesterIndex <= 6) {
    return "learn_ai_software";
  }

  if (state.attributes.aesthetic < 48 && state.money >= 1200) {
    return "read_exhibition";
  }

  return "exercise";
}

function balancedAction(state: GameState): ActionId {
  if (state.energy < 45 || state.pressure > 70) {
    return "rest";
  }

  const requiredProgress = requiredProgressForCurrentReview(state);
  const targetQuality = targetQualityForCurrentReview(state) + 12;

  if (state.progress < requiredProgress) {
    return state.weekInSemester >= 5 ? firstAvailable(state, ["crunch_drawing", "normal_drawing"]) : "normal_drawing";
  }

  if (state.quality < targetQuality) {
    return firstAvailable(state, ["site_research", "design_iteration"]);
  }

  if (state.money < 1800) {
    return firstAvailable(state, ["outsourcing", "part_time", "rest"]);
  }

  return firstAvailable(state, ["learn_ai_software", "read_exhibition", "exercise", "rest"]);
}

function routeAction(state: GameState, strategy: StrategyId): ActionId {
  const prepAction = earlyRoutePrepNeed(state, strategy);
  if (prepAction) {
    return prepAction;
  }

  const courseworkAction = courseworkNeed(state, courseworkQualityBuffer(strategy));
  if (courseworkAction) {
    return courseworkAction;
  }

  if (state.energy < STRATEGY_TUNING.routeActionEnergyMin || state.pressure > STRATEGY_TUNING.routeActionPressureMax) {
    return "rest";
  }

  if (state.money < STRATEGY_TUNING.routePartTimeMoneyFloor && canPerformAction(state, "part_time").ok) {
    return "part_time";
  }

  switch (strategy) {
    case "postgrad":
      return postgradAction(state);
    case "overseas":
      return overseasAction(state);
    case "civil_service":
      return civilServiceAction(state);
    case "architecture_job":
      return architectureJobAction(state);
    case "career_change":
      return careerChangeAction(state);
    default:
      return balancedAction(state);
  }
}

function postgradAction(state: GameState): ActionId {
  const thresholds = routeTargetThresholds(state, "postgrad_exam");
  const gpaTarget = thresholds.gpa ?? ROUTE_THRESHOLDS.postgradExam.gpa;
  const portfolioTarget = thresholds.portfolio ?? ROUTE_THRESHOLDS.postgradExam.portfolio;

  if (state.gpa < gpaTarget - 0.15 || state.portfolio < portfolioTarget) {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }

  if (state.attributes.design < (thresholds.design ?? ROUTE_THRESHOLDS.postgradExam.design)) {
    return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
  }

  if (state.attributes.software < (thresholds.software ?? ROUTE_THRESHOLDS.postgradExam.software)) {
    return "learn_ai_software";
  }

  if (state.attributes.resilience < (thresholds.resilience ?? ROUTE_THRESHOLDS.postgradExam.resilience)) {
    return "exercise";
  }

  return firstAvailable(state, ["design_iteration", "learn_ai_software", "exercise", "rest"]);
}

function overseasAction(state: GameState): ActionId {
  const thresholds = routeTargetThresholds(state, "overseas");
  const portfolioTarget = thresholds.portfolio ?? ROUTE_THRESHOLDS.overseas.portfolio;
  const gpaTarget = thresholds.gpa ?? ROUTE_THRESHOLDS.overseas.gpa;

  if (state.portfolio < portfolioTarget || state.gpa < gpaTarget - 0.1) {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }

  if (state.attributes.aesthetic < 70) {
    return firstAvailable(state, ["read_exhibition", "site_research", "rest"]);
  }

  return firstAvailable(state, ["read_exhibition", "design_iteration", "exercise", "rest"]);
}

function civilServiceAction(state: GameState): ActionId {
  const thresholds = routeTargetThresholds(state, "civil_service");
  const weakest = weakestAttributeNeed(state, thresholds, ["presentation", "social", "resilience", "design"]);
  if (weakest === "social") return firstAvailable(state, ["socialize", "public_affairs_prep", "rest"]);
  if (weakest === "resilience") return firstAvailable(state, ["exercise", "public_affairs_prep", "rest"]);
  if (weakest === "design") return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
  return firstAvailable(state, ["public_affairs_prep", "socialize", "exercise", "rest"]);
}

function architectureJobAction(state: GameState): ActionId {
  const thresholds = routeTargetThresholds(state, "architecture_job");

  if (state.portfolio < (thresholds.portfolio ?? ROUTE_THRESHOLDS.architectureJob.portfolioTarget)) {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }

  if (state.attributes.design < (thresholds.design ?? ROUTE_THRESHOLDS.architectureJob.design)) {
    return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
  }

  if (state.attributes.software < (thresholds.software ?? ROUTE_THRESHOLDS.architectureJob.software)) {
    return "learn_ai_software";
  }

  return firstAvailable(state, ["outsourcing", "learn_ai_software", "design_iteration", "rest"]);
}

function careerChangeAction(state: GameState): ActionId {
  const targetId = state.route.targetOverride ?? "new_media_content";
  const thresholds = routeTargetThresholds(state, "career_change");
  const entrepreneurshipNeeds = targetId === "entrepreneurship"
    ? weakestAttributeNeed(state, thresholds, ["design", "software", "aesthetic", "presentation", "social", "resilience"])
    : undefined;

  if (entrepreneurshipNeeds === "design") {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }

  if (entrepreneurshipNeeds === "software") {
    return "learn_ai_software";
  }

  if (entrepreneurshipNeeds === "aesthetic") {
    return firstAvailable(state, ["read_exhibition", "portfolio_polish", "content_practice", "rest"]);
  }

  if (entrepreneurshipNeeds === "presentation") {
    return firstAvailable(state, ["content_practice", "presentation_practice", "socialize", "rest"]);
  }

  if (entrepreneurshipNeeds === "social") {
    return firstAvailable(state, ["socialize", "public_affairs_prep", "rest"]);
  }

  if (entrepreneurshipNeeds === "resilience") {
    return firstAvailable(state, ["exercise", "rest"]);
  }

  if (state.portfolio < (thresholds.portfolio ?? 0)) {
    return firstAvailable(state, ["portfolio_polish", "design_iteration", "site_research", "rest"]);
  }

  if (state.attributes.software < (thresholds.software ?? 0)) {
    return "learn_ai_software";
  }

  if ((thresholds.aiExperience ?? 0) > state.aiExperience) {
    return "learn_ai_software";
  }

  if (state.attributes.presentation < (thresholds.presentation ?? 0)) {
    return firstAvailable(state, ["content_practice", "presentation_practice", "socialize", "rest"]);
  }

  if (state.attributes.aesthetic < (thresholds.aesthetic ?? 0)) {
    return firstAvailable(state, ["content_practice", "portfolio_polish", "read_exhibition", "rest"]);
  }

  if (targetId === "illustrator" || targetId === "game_scene_artist") {
    return firstAvailable(state, ["portfolio_polish", "read_exhibition", "design_iteration", "rest"]);
  }

  return firstAvailable(state, ["content_practice", "socialize", "exercise", "rest"]);
}

function earlyRoutePrepNeed(state: GameState, strategy: StrategyId): ActionId | undefined {
  if (state.semesterIndex < ROUTE_TIMING.prepSemesterMin || state.semesterIndex > ROUTE_TIMING.prepSemesterMax) {
    return undefined;
  }

  const courseworkAction = courseworkNeed(state, 0);
  const weeksLeft = Math.max(0, 6 - state.weekInSemester + 1);
  const requiredProgress = requiredProgressForCurrentReview(state);
  const targetQuality = targetQualityForCurrentReview(state);
  const progressActions = Math.ceil(Math.max(0, requiredProgress - state.progress) / 18);
  const qualityActions = Math.ceil(Math.max(0, targetQuality - state.quality) / 11);
  const courseworkIsUrgent =
    !!courseworkAction &&
    progressActions + qualityActions >= weeksLeft * STRATEGY_TUNING.courseworkUrgencyActionsPerWeekLeft;

  if (
    courseworkIsUrgent ||
    state.energy < STRATEGY_TUNING.routePrepEnergyMin ||
    state.pressure > STRATEGY_TUNING.routePrepPressureMax
  ) {
    return undefined;
  }

  switch (strategy) {
    case "civil_service":
      return earlyCivilServicePrep(state);
    case "career_change":
      return earlyCareerChangePrep(state);
    default:
      return undefined;
  }
}

function earlyCivilServicePrep(state: GameState): ActionId | undefined {
  const thresholds = routeTargetThresholds(state, "civil_service");
  const weakest = weakestAttributeNeed(state, thresholds, ["presentation", "social", "resilience", "design"]);
  if (weakest === "social") return firstAvailable(state, ["socialize", "public_affairs_prep", "rest"]);
  if (weakest === "resilience") return firstAvailable(state, ["exercise", "public_affairs_prep", "rest"]);
  if (weakest === "design") return firstAvailable(state, ["design_iteration", "site_research", "rest"]);
  if (weakest === "presentation") return firstAvailable(state, ["public_affairs_prep", "presentation_practice", "rest"]);
  return undefined;
}

function earlyCareerChangePrep(state: GameState): ActionId | undefined {
  const thresholds = routeTargetThresholds(state, "career_change");
  const targetId = state.route.targetOverride ?? "new_media_content";
  const entrepreneurshipNeeds = targetId === "entrepreneurship"
    ? weakestAttributeNeed(state, thresholds, ["design", "software", "aesthetic", "presentation", "social", "resilience"])
    : undefined;

  if (entrepreneurshipNeeds === "design") {
    return firstAvailable(state, ["design_iteration", "site_research", "normal_drawing", "rest"]);
  }
  if (entrepreneurshipNeeds === "software") {
    return "learn_ai_software";
  }
  if (entrepreneurshipNeeds === "aesthetic") {
    return firstAvailable(state, ["read_exhibition", "portfolio_polish", "content_practice", "rest"]);
  }
  if (entrepreneurshipNeeds === "presentation") {
    return firstAvailable(state, ["content_practice", "presentation_practice", "socialize", "rest"]);
  }
  if (entrepreneurshipNeeds === "social") {
    return firstAvailable(state, ["socialize", "public_affairs_prep", "rest"]);
  }
  if (entrepreneurshipNeeds === "resilience") {
    return firstAvailable(state, ["exercise", "rest"]);
  }

  if ((thresholds.aiExperience ?? 0) > state.aiExperience || state.attributes.software < (thresholds.software ?? 0)) {
    return "learn_ai_software";
  }
  if (state.attributes.presentation < (thresholds.presentation ?? 0)) {
    return firstAvailable(state, ["content_practice", "presentation_practice", "socialize", "rest"]);
  }
  if (state.attributes.aesthetic < (thresholds.aesthetic ?? 0)) {
    return firstAvailable(state, ["content_practice", "portfolio_polish", "read_exhibition", "rest"]);
  }
  return undefined;
}

function courseworkQualityBuffer(strategy: StrategyId): number {
  switch (strategy) {
    case "postgrad":
      return STRATEGY_TUNING.courseworkQualityBuffer.postgrad;
    case "architecture_job":
      return STRATEGY_TUNING.courseworkQualityBuffer.architectureJob;
    case "career_change":
      return STRATEGY_TUNING.courseworkQualityBuffer.careerChange;
    default:
      return STRATEGY_TUNING.courseworkQualityBuffer.default;
  }
}

function courseworkNeed(state: GameState, extraQualityTarget: number): ActionId | undefined {
  if (state.energy < 35 || state.pressure > 78) {
    return "rest";
  }

  const requiredProgress = requiredProgressForCurrentReview(state);
  const targetQuality = targetQualityForCurrentReview(state) + extraQualityTarget;

  if (state.progress < requiredProgress - 28 && state.weekInSemester >= 5 && canPerformAction(state, "crunch_drawing").ok) {
    return "crunch_drawing";
  }

  if (state.progress < requiredProgress) {
    return "normal_drawing";
  }

  if (state.quality < targetQuality) {
    return firstAvailable(state, ["site_research", "design_iteration", "rest"]);
  }

  return undefined;
}

function firstAvailable(state: GameState, actions: ActionId[]): ActionId {
  for (const action of actions) {
    if (canPerformAction(state, action).ok) {
      return action;
    }
  }
  return "rest";
}

function routeTargetThresholds(state: GameState, route: RouteId) {
  const targetId = state.route.targetOverride ?? defaultRouteTarget(route);
  const target = ROUTE_TARGETS[targetId];
  if (target.route !== route) {
    throw new Error(`Route target ${targetId} does not belong to route ${route}`);
  }
  return target.thresholds;
}

function defaultRouteTarget(route: RouteId) {
  switch (route) {
    case "postgrad_exam":
      return "ordinary_postgrad_school";
    case "overseas":
      return "safe_overseas_school";
    case "civil_service":
      return "public_institution_general";
    case "architecture_job":
      return "local_design_institute";
    case "career_change":
      return "new_media_content";
  }
}

function weakestAttributeNeed(
  state: GameState,
  thresholds: Partial<Record<AttributeKey, number>>,
  keys: AttributeKey[],
): AttributeKey | undefined {
  let weakest: AttributeKey | undefined;
  let largestGap = 0;

  for (const key of keys) {
    const required = thresholds[key] ?? 0;
    const gap = required - state.attributes[key];
    if (gap > largestGap) {
      largestGap = gap;
      weakest = key;
    }
  }

  return weakest;
}

function requiredProgressForCurrentReview(state: GameState): number {
  if (!isGraduationDesign(state.semesterIndex)) {
    return 100;
  }
  return state.semesterIndex === 9 ? 100 : progressCapForSemester(state.semesterIndex);
}

function targetQualityForCurrentReview(state: GameState): number {
  if (isGraduationDesign(state.semesterIndex)) {
    return state.semesterIndex === 9 ? 95 : 120;
  }
  return 62;
}
