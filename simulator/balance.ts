import type {
  AttributeKey,
  Attributes,
  CompetitionAward,
  CompetitionId,
  RouteGroup,
  RouteId,
  RouteTargetId,
} from "./types.ts";

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

export const INTERNSHIP_APPLICATION = {
  earliestSemester: 3,
  durationWeeks: 3,
  tiers: {
    ordinary: {
      priorValueRequired: 0,
      semesterMin: 3,
      semesterMax: 6,
      maxAttempts: 4,
      baseChance: 70,
      maxChance: 98,
      excessCap: 20,
      excessMultiplier: 1.5,
    },
    strong: {
      priorValueRequired: 1,
      semesterMin: 5,
      semesterMax: 8,
      maxAttempts: 2,
      baseChance: 45,
      maxChance: 82,
      excessCap: 20,
      excessMultiplier: 1.45,
    },
    named_firm: {
      priorValueRequired: 2,
      semesterMin: 7,
      semesterMax: 9,
      maxAttempts: 1,
      baseChance: 10,
      maxChance: 32,
      excessCap: 20,
      excessMultiplier: 1.1,
    },
  },
} as const;

export const COMPETITION_APPLICATION = {
  latestPortfolioAdded: 68,
  design: 58,
  aesthetic: 58,
  latestSemesterMax: 8,
  baseShortlistChance: 45,
  maxShortlistChance: 92,
  performanceDivisor: 2.8,
} as const;

export const COMPETITION_AWARD_TIERS: Record<CompetitionAward, { minPerformance: number; prizeMoney: number }> = {
  none: { minPerformance: 0, prizeMoney: 0 },
  third: { minPerformance: 0, prizeMoney: 300 },
  second: { minPerformance: 65, prizeMoney: 800 },
  first: { minPerformance: 90, prizeMoney: 1500 },
} as const;

export const COMPETITION_POOL: Record<
  CompetitionId,
  {
    id: CompetitionId;
    name: string;
    semesterMin: number;
    semesterMax: number;
    portfolioAdded: number;
    design: number;
    aesthetic: number;
    shortlistChanceModifier: number;
    prizeMoneyMultiplier: number;
  }
> = {
  campus_corner_renovation: {
    id: "campus_corner_renovation",
    name: "Campus Corner Renovation",
    semesterMin: 3,
    semesterMax: 4,
    portfolioAdded: 64,
    design: 54,
    aesthetic: 54,
    shortlistChanceModifier: 12,
    prizeMoneyMultiplier: 0.8,
  },
  old_block_micro_renewal: {
    id: "old_block_micro_renewal",
    name: "Old Block Micro Renewal",
    semesterMin: 5,
    semesterMax: 6,
    portfolioAdded: 68,
    design: 58,
    aesthetic: 58,
    shortlistChanceModifier: 4,
    prizeMoneyMultiplier: 1,
  },
  green_building_concept: {
    id: "green_building_concept",
    name: "Green Building Concept",
    semesterMin: 7,
    semesterMax: 8,
    portfolioAdded: 72,
    design: 62,
    aesthetic: 60,
    shortlistChanceModifier: -2,
    prizeMoneyMultiplier: 1.2,
  },
  young_architect_portfolio: {
    id: "young_architect_portfolio",
    name: "Young Architect Portfolio",
    semesterMin: 8,
    semesterMax: 8,
    portfolioAdded: 78,
    design: 66,
    aesthetic: 66,
    shortlistChanceModifier: -8,
    prizeMoneyMultiplier: 1.5,
  },
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

export type RouteTargetDefinition = {
  id: RouteTargetId;
  route: RouteId;
  group: RouteGroup;
  label: string;
  thresholds: Partial<Record<AttributeKey, number>> & {
    gpa?: number;
    portfolio?: number;
    internshipValue?: number;
    namedFirmInternship?: boolean;
    aiExperience?: number;
    recentFailedReviewsMax?: number;
  };
  examFloorEligible?: number;
  examFloorIneligible?: number;
  passCorrect?: number;
  fallbackCorrect?: number;
  overseasChance?: {
    base: number;
    max: number;
    portfolioSpan: number;
    portfolioExcessForGuaranteed: number;
    gpaExcessForGuaranteed: number;
  };
};

export const ROUTE_TARGETS: Record<RouteTargetId, RouteTargetDefinition> = {
  dream_postgrad_school: {
    id: "dream_postgrad_school",
    route: "postgrad_exam",
    group: "education",
    label: "dream postgrad school",
    thresholds: {
      gpa: 3.5,
      portfolio: 560,
      design: 80,
      software: 65,
      resilience: 70,
      recentFailedReviewsMax: 0,
    },
    examFloorEligible: 7,
    examFloorIneligible: 4,
    passCorrect: 9,
  },
  strong_postgrad_school: {
    id: "strong_postgrad_school",
    route: "postgrad_exam",
    group: "education",
    label: "strong postgrad school",
    thresholds: {
      gpa: 3.3,
      portfolio: 500,
      design: 74,
      software: 60,
      resilience: 65,
      recentFailedReviewsMax: 1,
    },
    examFloorEligible: 6,
    examFloorIneligible: 4,
    passCorrect: 8,
  },
  ordinary_postgrad_school: {
    id: "ordinary_postgrad_school",
    route: "postgrad_exam",
    group: "education",
    label: "ordinary postgrad school",
    thresholds: {
      gpa: ROUTE_THRESHOLDS.postgradExam.gpa,
      portfolio: ROUTE_THRESHOLDS.postgradExam.portfolio,
      design: ROUTE_THRESHOLDS.postgradExam.design,
      software: ROUTE_THRESHOLDS.postgradExam.software,
      resilience: ROUTE_THRESHOLDS.postgradExam.resilience,
      recentFailedReviewsMax: ROUTE_THRESHOLDS.postgradExam.recentFailedReviewsMax,
    },
    examFloorEligible: ROUTE_THRESHOLDS.postgradExam.examFloorEligible,
    examFloorIneligible: ROUTE_THRESHOLDS.postgradExam.examFloorIneligible,
    passCorrect: ROUTE_THRESHOLDS.postgradExam.passCorrect,
  },
  overseas_s_tier: {
    id: "overseas_s_tier",
    route: "overseas",
    group: "education",
    label: "S-tier overseas school",
    thresholds: { gpa: 3.7, portfolio: 620 },
    overseasChance: {
      base: 0.6,
      max: 1,
      portfolioSpan: 300,
      portfolioExcessForGuaranteed: 60,
      gpaExcessForGuaranteed: 0.25,
    },
  },
  overseas_a_tier: {
    id: "overseas_a_tier",
    route: "overseas",
    group: "education",
    label: "A-tier overseas school",
    thresholds: { gpa: 3.45, portfolio: 560 },
    overseasChance: {
      base: 0.7,
      max: 1,
      portfolioSpan: 300,
      portfolioExcessForGuaranteed: 60,
      gpaExcessForGuaranteed: 0.25,
    },
  },
  safe_overseas_school: {
    id: "safe_overseas_school",
    route: "overseas",
    group: "education",
    label: "safe overseas school",
    thresholds: {
      gpa: ROUTE_THRESHOLDS.overseas.gpa,
      portfolio: ROUTE_THRESHOLDS.overseas.portfolio,
    },
    overseasChance: {
      base: ROUTE_THRESHOLDS.overseas.baseChance,
      max: ROUTE_THRESHOLDS.overseas.maxChance,
      portfolioSpan: ROUTE_THRESHOLDS.overseas.portfolioChanceSpan,
      portfolioExcessForGuaranteed: 60,
      gpaExcessForGuaranteed: 0.25,
    },
  },
  overseas_c_tier: {
    id: "overseas_c_tier",
    route: "overseas",
    group: "education",
    label: "C-tier overseas school",
    thresholds: { gpa: 2.8, portfolio: 400 },
    overseasChance: {
      base: 0.85,
      max: 1,
      portfolioSpan: 300,
      portfolioExcessForGuaranteed: 60,
      gpaExcessForGuaranteed: 0.25,
    },
  },
  selection_home: {
    id: "selection_home",
    route: "civil_service",
    group: "civil",
    label: "home province selection",
    thresholds: { gpa: 3.4, presentation: 72, social: 72, resilience: 70, recentFailedReviewsMax: 0 },
    examFloorEligible: 7,
    examFloorIneligible: 5,
    passCorrect: 9,
  },
  civil_service_ministry: {
    id: "civil_service_ministry",
    route: "civil_service",
    group: "civil",
    label: "national ministry civil service",
    thresholds: { gpa: 3.5, presentation: 75, social: 70, resilience: 70, recentFailedReviewsMax: 0 },
    examFloorEligible: 7,
    examFloorIneligible: 5,
    passCorrect: 9,
    fallbackCorrect: 6,
  },
  civil_service_provincial: {
    id: "civil_service_provincial",
    route: "civil_service",
    group: "civil",
    label: "provincial bureau civil service",
    thresholds: { gpa: 3.2, presentation: 68, social: 62, resilience: 62 },
    examFloorEligible: 6,
    examFloorIneligible: 5,
    passCorrect: 8,
    fallbackCorrect: 6,
  },
  teacher_bianzhi: {
    id: "teacher_bianzhi",
    route: "civil_service",
    group: "civil",
    label: "teacher bianzhi",
    thresholds: { gpa: 3.1, presentation: 70, design: 65, recentFailedReviewsMax: 1 },
    examFloorEligible: 6,
    examFloorIneligible: 5,
    passCorrect: 8,
    fallbackCorrect: 6,
  },
  public_institution_general: {
    id: "public_institution_general",
    route: "civil_service",
    group: "civil",
    label: "general public institution",
    thresholds: {
      gpa: ROUTE_THRESHOLDS.civilService.eligible.gpa,
      presentation: ROUTE_THRESHOLDS.civilService.eligible.presentation,
      social: ROUTE_THRESHOLDS.civilService.eligible.social,
      resilience: ROUTE_THRESHOLDS.civilService.eligible.resilience,
    },
    examFloorEligible: ROUTE_THRESHOLDS.civilService.examFloorEligible,
    examFloorIneligible: ROUTE_THRESHOLDS.civilService.examFloorIneligible,
    passCorrect: ROUTE_THRESHOLDS.civilService.passCorrect,
    fallbackCorrect: ROUTE_THRESHOLDS.civilService.fallbackCorrect,
  },
  administration_bianzhi: {
    id: "administration_bianzhi",
    route: "civil_service",
    group: "civil",
    label: "administrative bianzhi",
    thresholds: { gpa: 2.8, presentation: 65, social: 68 },
    examFloorEligible: 6,
    examFloorIneligible: 5,
    passCorrect: 6,
    fallbackCorrect: 6,
  },
  independent_studio: {
    id: "independent_studio",
    route: "architecture_job",
    group: "architecture_job",
    label: "independent studio",
    thresholds: { design: 58, software: 55, internshipValue: 1 },
  },
  local_design_institute: {
    id: "local_design_institute",
    route: "architecture_job",
    group: "architecture_job",
    label: "local design institute",
    thresholds: {
      design: ROUTE_THRESHOLDS.architectureJob.design,
      software: ROUTE_THRESHOLDS.architectureJob.software,
      internshipValue: ROUTE_THRESHOLDS.architectureJob.internshipValue,
    },
  },
  state_owned_design_institute: {
    id: "state_owned_design_institute",
    route: "architecture_job",
    group: "architecture_job",
    label: "state-owned design institute",
    thresholds: { design: 68, software: 62, internshipValue: 2 },
  },
  foreign_firm: {
    id: "foreign_firm",
    route: "architecture_job",
    group: "architecture_job",
    label: "foreign architecture firm",
    thresholds: { design: 78, software: 72, portfolio: 520, internshipValue: 2 },
  },
  master_studio: {
    id: "master_studio",
    route: "architecture_job",
    group: "architecture_job",
    label: "master architecture studio",
    thresholds: { design: 85, software: 78, portfolio: 620, internshipValue: 3 },
  },
  ai_product_manager: {
    id: "ai_product_manager",
    route: "career_change",
    group: "career_change",
    label: "AI product manager",
    thresholds: { software: 68, presentation: 65, aiExperience: 2 },
  },
  game_scene_artist: {
    id: "game_scene_artist",
    route: "career_change",
    group: "career_change",
    label: "game scene artist",
    thresholds: { software: 75, aesthetic: 68, portfolio: 430 },
  },
  sales_business: {
    id: "sales_business",
    route: "career_change",
    group: "career_change",
    label: "sales and business",
    thresholds: { software: 70, presentation: 68, aesthetic: 65 },
  },
  new_media_content: {
    id: "new_media_content",
    route: "career_change",
    group: "career_change",
    label: "new media content",
    thresholds: {
      presentation: ROUTE_THRESHOLDS.careerChange.presentation,
      aesthetic: ROUTE_THRESHOLDS.careerChange.aesthetic,
    },
  },
  illustrator: {
    id: "illustrator",
    route: "career_change",
    group: "career_change",
    label: "illustrator",
    thresholds: { aesthetic: 78, portfolio: 420 },
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
