import {
  GRADE_TO_GPA,
  GRADE_TO_PORTFOLIO,
  isGraduationDesign,
  progressCapForSemester,
} from "./rules.ts";
import { applyDelta, log } from "./resolver.ts";
import type { GameState, ReviewGrade, ReviewRecord } from "./types.ts";

export function resolveReview(state: GameState): ReviewRecord {
  state.phase = "review";

  const graduation = isGraduationDesign(state.semesterIndex);
  const requiredProgress = graduation && state.semesterIndex === 10 ? 200 : 100;
  const qualityScore = graduation ? Math.floor(state.quality / 2) : state.quality;
  const progressGateFailed = state.progress < requiredProgress;
  const baseGrade = progressGateFailed ? "F" : gradeFromQuality(qualityScore);
  const finalGrade = baseGrade;
  const designCourseGpa = GRADE_TO_GPA[finalGrade];
  const semesterGpa = clampGpa(designCourseGpa + state.gpaModifier);
  const portfolioAdded = graduation && state.semesterIndex === 9 ? 0 : GRADE_TO_PORTFOLIO[finalGrade];

  const record: ReviewRecord = {
    semesterIndex: state.semesterIndex,
    year: state.year,
    term: state.term,
    progress: state.progress,
    quality: state.quality,
    baseGrade,
    finalGrade,
    designCourseGpa,
    semesterGpa,
    portfolioAdded,
    isGraduationDesign: graduation,
  };

  state.reviews.push(record);
  state.gpaHistory.push(semesterGpa);
  state.gpa = average(state.gpaHistory);
  state.portfolio += portfolioAdded;

  if (finalGrade === "F") {
    state.consecutiveFailedReviews += 1;
  } else {
    state.consecutiveFailedReviews = 0;
  }

  if (state.semesterIndex === 10) {
    state.completedGraduationDesign = finalGrade !== "F" && state.progress >= progressCapForSemester(state.semesterIndex);
  }

  log(
    state,
    "review",
    "review",
    `review resolved: ${finalGrade}, semester GPA ${semesterGpa.toFixed(2)}, portfolio +${portfolioAdded}`,
    {},
  );

  if (state.consecutiveFailedReviews >= 2 && !state.ending) {
    state.failureReason = "two_failed_reviews";
    state.ending = "two_failed_reviews";
    log(state, "review", "failure_check", "two consecutive failed reviews", {});
  }

  state.gpaModifier = 0;
  if (!graduation || state.semesterIndex === 10) {
    state.progress = 0;
    state.quality = 0;
  }

  return record;
}

export function gradeFromQuality(quality: number): ReviewGrade {
  if (quality >= 95) return "S";
  if (quality >= 85) return "A";
  if (quality >= 72) return "B";
  if (quality >= 60) return "C";
  if (quality >= 45) return "D";
  return "F";
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 4.0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampGpa(value: number): number {
  return Math.max(0, Math.min(4, value));
}
