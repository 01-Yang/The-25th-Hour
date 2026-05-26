import type { Attributes, CompetitionAward } from "./types.ts";

export const ROUTE_TIMING = {
  intentionSemester: 7,
  formalSemester: 9,
  hiddenResultSemester: 9,
  prepSemesterMin: 7,
  prepSemesterMax: 9,
} as const;

export const INTERNSHIP_THRESHOLDS = {
  ordinary: { design: 42, software: 40, value: 1 },
  strong: { design: 58, software: 55, value: 2 },
  namedFirm: { design: 72, software: 68, value: 3 },
} as const;

export const COMPETITION_STUB_THRESHOLDS = {
  latestPortfolioAdded: 78,
  design: 62,
  aesthetic: 62,
  latestSemesterMax: 8,
} as const;

export const COMPETITION_AWARD_TIERS: Record<CompetitionAward, { minRoll: number; prizeMoney: number }> = {
  third: { minRoll: 0, prizeMoney: 300 },
  second: { minRoll: 65, prizeMoney: 800 },
  first: { minRoll: 90, prizeMoney: 1500 },
} as const;

export const ROUTE_THRESHOLDS = {
  postgradExam: {
    gpa: 3.0,
    portfolio: 420,
    design: 68,
    software: 58,
    resilience: 60,
    recentFailedReviewsMax: 1,
    examFloorEligible: 6,
    examFloorIneligible: 4,
    passCorrect: 6,
  },
  overseas: {
    gpa: 3.0,
    portfolio: 450,
    baseChance: 0.6,
    maxChance: 0.95,
    portfolioChanceSpan: 300,
  },
  civilService: {
    eligible: {
      gpa: 3.0,
      presentation: 62,
      social: 62,
      resilience: 58,
    },
    fallback: {
      presentation: 58,
      social: 60,
      resilience: 58,
    },
    examFloorEligible: 6,
    examFloorIneligible: 5,
    passCorrect: 7,
    fallbackCorrect: 6,
  },
  architectureJob: {
    design: 60,
    software: 55,
    internshipValue: 1,
    portfolioTarget: 430,
  },
  careerChange: {
    presentation: 62,
    aesthetic: 65,
  },
} as const;

export const STRATEGY_TUNING = {
  routePrepEnergyMin: 45,
  routePrepPressureMax: 72,
  routeActionEnergyMin: 45,
  routeActionPressureMax: 72,
  routePartTimeMoneyFloor: 1400,
  courseworkUrgencyActionsPerWeekLeft: 2,
  courseworkQualityBuffer: {
    default: 8,
    postgrad: 16,
    architectureJob: 16,
    careerChange: 2,
  },
} as const;

export function meetsAttributes(
  attributes: Attributes,
  thresholds: Partial<Record<keyof Attributes, number>>,
): boolean {
  return Object.entries(thresholds).every(([key, value]) => {
    return attributes[key as keyof Attributes] >= (value ?? 0);
  });
}
