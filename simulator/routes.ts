import { randomInt } from "./rng.ts";
import { log } from "./resolver.ts";
import {
  COMPETITION_AWARD_TIERS,
  COMPETITION_STUB_THRESHOLDS,
  INTERNSHIP_THRESHOLDS,
  ROUTE_THRESHOLDS,
  ROUTE_TIMING,
} from "./balance.ts";
import type {
  CompetitionAward,
  GameState,
  InternshipTier,
  RouteFailureReason,
  RouteGroup,
  RouteId,
  RouteOutcome,
} from "./types.ts";

interface RouteDefinition {
  id: RouteId;
  group: RouteGroup;
  target: string;
}

const ROUTES: Record<RouteId, RouteDefinition> = {
  postgrad_exam: {
    id: "postgrad_exam",
    group: "education",
    target: "ordinary_postgrad_school",
  },
  overseas: {
    id: "overseas",
    group: "education",
    target: "safe_overseas_school",
  },
  civil_service: {
    id: "civil_service",
    group: "civil",
    target: "public_institution_general",
  },
  architecture_job: {
    id: "architecture_job",
    group: "architecture_job",
    target: "local_design_institute",
  },
  career_change: {
    id: "career_change",
    group: "career_change",
    target: "new_media_content",
  },
};

export function maybeSetRouteIntention(state: GameState): void {
  if (state.semesterIndex !== ROUTE_TIMING.intentionSemester || state.weekInSemester !== 1 || state.route.intention) {
    return;
  }

  const route = routeForStrategy(state.strategy);
  if (!route) {
    return;
  }

  state.route.intention = route;
  log(state, "week_start", "route_intention", `route intention: ${route}`, {});
}

export function maybeFormalizeRoute(state: GameState): void {
  if (state.semesterIndex !== ROUTE_TIMING.formalSemester || state.weekInSemester !== 1 || state.route.formal) {
    return;
  }

  const route = routeForStrategy(state.strategy);
  if (!route) {
    return;
  }

  const definition = ROUTES[route];
  state.route.formal = {
    route,
    group: definition.group,
    target: definition.target,
    week: state.week,
  };

  log(state, "week_start", "route_formal", `formal route: ${route} -> ${definition.target}`, {});
}

export function maybeRecordInternship(state: GameState): void {
  if (state.semesterIndex < 3 || state.internshipValue >= INTERNSHIP_THRESHOLDS.namedFirm.value) {
    return;
  }

  if (
    state.attributes.design >= INTERNSHIP_THRESHOLDS.namedFirm.design &&
    state.attributes.software >= INTERNSHIP_THRESHOLDS.namedFirm.software
  ) {
    recordInternship(state, "named_firm", INTERNSHIP_THRESHOLDS.namedFirm.value);
    state.namedFirmInternship = true;
    log(state, state.phase, "internship_stub", "named firm internship recorded", {});
    return;
  }

  if (
    state.attributes.design >= INTERNSHIP_THRESHOLDS.strong.design &&
    state.attributes.software >= INTERNSHIP_THRESHOLDS.strong.software &&
    state.internshipValue < INTERNSHIP_THRESHOLDS.strong.value
  ) {
    recordInternship(state, "strong", INTERNSHIP_THRESHOLDS.strong.value);
    log(state, state.phase, "internship_stub", "strong firm internship recorded", {});
    return;
  }

  if (
    state.attributes.design >= INTERNSHIP_THRESHOLDS.ordinary.design &&
    state.attributes.software >= INTERNSHIP_THRESHOLDS.ordinary.software &&
    state.internshipValue < INTERNSHIP_THRESHOLDS.ordinary.value
  ) {
    recordInternship(state, "ordinary", INTERNSHIP_THRESHOLDS.ordinary.value);
    log(state, state.phase, "internship_stub", "ordinary internship recorded", {});
  }
}

export function maybeRecordCompetitionAfterReview(state: GameState): void {
  const latest = state.reviews[state.reviews.length - 1];
  if (
    !latest ||
    latest.finalGrade === "F" ||
    state.semesterIndex > COMPETITION_STUB_THRESHOLDS.latestSemesterMax
  ) {
    return;
  }

  if (
    latest.portfolioAdded >= COMPETITION_STUB_THRESHOLDS.latestPortfolioAdded &&
    state.attributes.design >= COMPETITION_STUB_THRESHOLDS.design &&
    state.attributes.aesthetic >= COMPETITION_STUB_THRESHOLDS.aesthetic
  ) {
    const awardRoll = competitionAwardRoll(latest.portfolioAdded, state.attributes.design, state.attributes.aesthetic);
    const award = competitionAwardFromRoll(awardRoll);
    const prizeMoney = COMPETITION_AWARD_TIERS[award].prizeMoney;
    state.competitionRecords.push({
      semesterIndex: latest.semesterIndex,
      year: latest.year,
      term: latest.term,
      reviewGrade: latest.finalGrade,
      portfolioAdded: latest.portfolioAdded,
      awardRoll,
      award,
      prizeMoney,
    });
    state.competitionAwardCount += 1;
    state.money += prizeMoney;
    log(state, "semester_settlement", "competition_stub", `competition ${award} award recorded`, {
      money: prizeMoney,
    });
  }
}

export function maybeResolveHiddenRouteResultAfterReview(state: GameState): void {
  const formal = state.route.formal;
  if (!formal || state.route.hiddenResult || state.semesterIndex !== ROUTE_TIMING.hiddenResultSemester) {
    return;
  }

  switch (formal.route) {
    case "postgrad_exam":
      resolvePostgradExam(state);
      return;
    case "overseas":
      resolveOverseasApplication(state);
      return;
    case "civil_service":
      resolveCivilServiceExam(state);
      return;
    case "architecture_job":
      resolveArchitectureJob(state);
      return;
    case "career_change":
      resolveCareerChange(state);
      return;
  }
}

export function routeOutcomeForEnding(state: GameState): RouteOutcome | undefined {
  return state.route.hiddenResult?.outcome;
}

export function routeForStrategy(strategy: GameState["strategy"]): RouteId | undefined {
  switch (strategy) {
    case "postgrad":
      return "postgrad_exam";
    case "overseas":
      return "overseas";
    case "civil_service":
      return "civil_service";
    case "architecture_job":
      return "architecture_job";
    case "career_change":
      return "career_change";
    default:
      return undefined;
  }
}

function resolvePostgradExam(state: GameState): void {
  const thresholds = ROUTE_THRESHOLDS.postgradExam;
  const failureReasons: RouteFailureReason[] = [];
  addMinFailure(failureReasons, state.gpa, thresholds.gpa, "gpa_below_threshold");
  addMinFailure(failureReasons, state.portfolio, thresholds.portfolio, "portfolio_below_threshold");
  addMinFailure(failureReasons, state.attributes.design, thresholds.design, "design_below_threshold");
  addMinFailure(failureReasons, state.attributes.software, thresholds.software, "software_below_threshold");
  addMinFailure(failureReasons, state.attributes.resilience, thresholds.resilience, "resilience_below_threshold");
  if (recentFailedReviews(state, 4) > thresholds.recentFailedReviewsMax) {
    failureReasons.push("recent_failed_reviews_above_threshold");
  }
  const eligible =
    state.gpa >= thresholds.gpa &&
    state.portfolio >= thresholds.portfolio &&
    state.attributes.design >= thresholds.design &&
    state.attributes.software >= thresholds.software &&
    state.attributes.resilience >= thresholds.resilience &&
    recentFailedReviews(state, 4) <= thresholds.recentFailedReviewsMax;

  const correct = drawExamCorrectCount(state, eligible ? thresholds.examFloorEligible : thresholds.examFloorIneligible);
  const passed = eligible && correct >= thresholds.passCorrect;
  if (correct < thresholds.passCorrect) {
    failureReasons.push("exam_score_below_threshold");
  }
  const outcome: RouteOutcome = passed ? "basic_postgrad" : "postgrad_failed";
  cacheHiddenResult(state, passed, correctToPostgradScore(correct), outcome, failureReasons);
}

function resolveOverseasApplication(state: GameState): void {
  const thresholds = ROUTE_THRESHOLDS.overseas;
  const failureReasons: RouteFailureReason[] = [];
  addMinFailure(failureReasons, state.gpa, thresholds.gpa, "gpa_below_threshold");
  addMinFailure(failureReasons, state.portfolio, thresholds.portfolio, "portfolio_below_threshold");
  const eligible = state.gpa >= thresholds.gpa && state.portfolio >= thresholds.portfolio;
  const chance = eligible
    ? Math.min(
        thresholds.maxChance,
        thresholds.baseChance +
          Math.max(0, state.portfolio - thresholds.portfolio) / thresholds.portfolioChanceSpan,
      )
    : 0;
  const [rngState, roll] = randomInt(state.rngState, 1, 100);
  state.rngState = rngState;
  const passed = roll <= chance * 100;
  if (!passed && eligible) {
    failureReasons.push("overseas_probability_roll_failed");
  }
  const outcome: RouteOutcome = passed ? "overseas_basic" : "overseas_failed";
  cacheHiddenResult(state, passed, roll, outcome, failureReasons);
}

function resolveCivilServiceExam(state: GameState): void {
  const thresholds = ROUTE_THRESHOLDS.civilService;
  const failureReasons: RouteFailureReason[] = [];
  addMinFailure(failureReasons, state.gpa, thresholds.eligible.gpa, "gpa_below_threshold");
  addMinFailure(
    failureReasons,
    state.attributes.presentation,
    thresholds.eligible.presentation,
    "presentation_below_threshold",
  );
  addMinFailure(failureReasons, state.attributes.social, thresholds.eligible.social, "social_below_threshold");
  addMinFailure(
    failureReasons,
    state.attributes.resilience,
    thresholds.eligible.resilience,
    "resilience_below_threshold",
  );
  const eligible =
    state.gpa >= thresholds.eligible.gpa &&
    state.attributes.presentation >= thresholds.eligible.presentation &&
    state.attributes.social >= thresholds.eligible.social &&
    state.attributes.resilience >= thresholds.eligible.resilience;
  const correct = drawExamCorrectCount(state, eligible ? thresholds.examFloorEligible : thresholds.examFloorIneligible);
  const passed = eligible && correct >= thresholds.passCorrect;
  if (correct < thresholds.passCorrect) {
    failureReasons.push("exam_score_below_threshold");
  }
  const fallback =
    state.attributes.presentation >= thresholds.fallback.presentation &&
    state.attributes.social >= thresholds.fallback.social &&
    state.attributes.resilience >= thresholds.fallback.resilience &&
    correct >= thresholds.fallbackCorrect;
  const outcome: RouteOutcome = passed
    ? "civil_service_success"
    : fallback
      ? "civil_service_fallback"
      : "civil_service_failed";
  cacheHiddenResult(state, passed || fallback, correctToCivilServiceScore(correct), outcome, passed ? [] : failureReasons);
}

function resolveArchitectureJob(state: GameState): void {
  const thresholds = ROUTE_THRESHOLDS.architectureJob;
  const failureReasons: RouteFailureReason[] = [];
  addMinFailure(failureReasons, state.attributes.design, thresholds.design, "design_below_threshold");
  addMinFailure(failureReasons, state.attributes.software, thresholds.software, "software_below_threshold");
  addMinFailure(failureReasons, state.internshipValue, thresholds.internshipValue, "internship_below_threshold");
  const passed =
    state.attributes.design >= thresholds.design &&
    state.attributes.software >= thresholds.software &&
    state.internshipValue >= thresholds.internshipValue;
  const outcome: RouteOutcome = passed ? "architecture_job_success" : "architecture_job_pending";
  cacheHiddenResult(state, passed, undefined, outcome, failureReasons);
}

function resolveCareerChange(state: GameState): void {
  const thresholds = ROUTE_THRESHOLDS.careerChange;
  const failureReasons: RouteFailureReason[] = [];
  addMinFailure(
    failureReasons,
    state.attributes.presentation,
    thresholds.presentation,
    "presentation_below_threshold",
  );
  addMinFailure(failureReasons, state.attributes.aesthetic, thresholds.aesthetic, "aesthetic_below_threshold");
  const passed =
    state.attributes.presentation >= thresholds.presentation &&
    state.attributes.aesthetic >= thresholds.aesthetic;
  const outcome: RouteOutcome = passed ? "career_change_success" : "career_change_failed";
  cacheHiddenResult(state, passed, undefined, outcome, failureReasons);
}

function cacheHiddenResult(
  state: GameState,
  passed: boolean,
  score: number | undefined,
  outcome: RouteOutcome,
  failureReasons: RouteFailureReason[],
): void {
  const formal = state.route.formal;
  if (!formal) {
    return;
  }

  state.route.hiddenResult = {
    route: formal.route,
    target: formal.target,
    passed,
    score,
    outcome,
    attributesAtDecision: { ...state.attributes },
    gpaAtDecision: Number(state.gpa.toFixed(2)),
    portfolioAtDecision: state.portfolio,
    recentFailedReviewsAtDecision: recentFailedReviews(state, 4),
    failureReasons,
  };

  log(
    state,
    "semester_settlement",
    "route_hidden_result",
    `hidden route result cached: ${formal.route} -> ${outcome}`,
    {},
  );
}

function drawExamCorrectCount(state: GameState, floor: number): number {
  const [rngState, roll] = randomInt(state.rngState, 0, 4);
  state.rngState = rngState;
  return Math.min(10, floor + roll);
}

function recordInternship(state: GameState, tier: InternshipTier, value: number): void {
  state.internshipValue = value;
  state.internshipRecords.push({
    semesterIndex: state.semesterIndex,
    week: state.week,
    tier,
    value,
    designAtOffer: state.attributes.design,
    softwareAtOffer: state.attributes.software,
  });
}

function competitionAwardRoll(portfolioAdded: number, design: number, aesthetic: number): number {
  const portfolioBonus = Math.max(0, portfolioAdded - COMPETITION_STUB_THRESHOLDS.latestPortfolioAdded);
  const designBonus = Math.max(0, design - COMPETITION_STUB_THRESHOLDS.design);
  const aestheticBonus = Math.max(0, aesthetic - COMPETITION_STUB_THRESHOLDS.aesthetic);
  return Math.min(99, Math.floor(portfolioBonus * 0.9 + designBonus * 1.1 + aestheticBonus * 1.1));
}

function competitionAwardFromRoll(roll: number): CompetitionAward {
  if (roll >= COMPETITION_AWARD_TIERS.first.minRoll) return "first";
  if (roll >= COMPETITION_AWARD_TIERS.second.minRoll) return "second";
  return "third";
}

function correctToPostgradScore(correct: number): number {
  if (correct >= 10) return 410;
  if (correct === 9) return 395;
  if (correct === 8) return 380;
  if (correct === 7) return 365;
  if (correct === 6) return 350;
  return 340;
}

function correctToCivilServiceScore(correct: number): number {
  if (correct >= 10) return 150;
  if (correct === 9) return 145;
  if (correct === 8) return 140;
  if (correct === 7) return 135;
  if (correct === 6) return 130;
  return 125;
}

function recentFailedReviews(state: GameState, count: number): number {
  return state.reviews.slice(-count).filter((review) => review.finalGrade === "F").length;
}

function addMinFailure(
  failureReasons: RouteFailureReason[],
  actual: number,
  required: number,
  reason: RouteFailureReason,
): void {
  if (actual < required) {
    failureReasons.push(reason);
  }
}
