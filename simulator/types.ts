export type AttributeKey =
  | "design"
  | "software"
  | "aesthetic"
  | "presentation"
  | "social"
  | "resilience";

export type ActionId =
  | "learn_ai_software"
  | "read_exhibition"
  | "design_iteration"
  | "site_research"
  | "normal_drawing"
  | "crunch_drawing"
  | "exercise"
  | "socialize"
  | "rest"
  | "outsourcing"
  | "part_time"
  | "special_skill"
  | "presentation_practice"
  | "public_affairs_prep"
  | "content_practice"
  | "portfolio_polish";

export type StrategyId =
  | "normal"
  | "bankrupt"
  | "burnout"
  | "pressure"
  | "fail_reviews"
  | "balanced"
  | "postgrad"
  | "overseas"
  | "civil_service"
  | "architecture_job"
  | "career_change";

export type RouteId =
  | "postgrad_exam"
  | "overseas"
  | "civil_service"
  | "architecture_job"
  | "career_change";

export type RouteGroup = "education" | "civil" | "architecture_job" | "career_change";

export type RouteOutcome =
  | "strong_postgrad"
  | "basic_postgrad"
  | "postgrad_failed"
  | "overseas_strong"
  | "overseas_basic"
  | "overseas_failed"
  | "civil_service_success"
  | "civil_service_fallback"
  | "civil_service_failed"
  | "architecture_job_success"
  | "architecture_job_pending"
  | "career_change_success"
  | "career_change_failed";

export type RouteFailureReason =
  | "gpa_below_threshold"
  | "portfolio_below_threshold"
  | "design_below_threshold"
  | "software_below_threshold"
  | "aesthetic_below_threshold"
  | "presentation_below_threshold"
  | "social_below_threshold"
  | "resilience_below_threshold"
  | "internship_below_threshold"
  | "recent_failed_reviews_above_threshold"
  | "exam_score_below_threshold"
  | "overseas_probability_roll_failed";

export type CourseId =
  | "architecture_history"
  | "building_technology"
  | "digital_planning"
  | "public_speaking"
  | "public_administration"
  | "media_studies"
  | "portfolio_workshop";

export type ReviewGrade = "S" | "A" | "B" | "C" | "D" | "F";

export type CompetitionAward = "third" | "second" | "first";

export type InternshipTier = "ordinary" | "strong" | "named_firm";

export type EventPool = "regular" | "interactive" | "model_week";

export type EventSentiment = "positive" | "neutral" | "negative";

export type FailureReason =
  | "living_cost_break"
  | "forced_suspension"
  | "pressure_collapse"
  | "two_failed_reviews";

export type EndingId =
  | "stable_graduation"
  | "wounded_graduation"
  | "graduation_failed"
  | RouteOutcome
  | "living_cost_break"
  | "forced_suspension"
  | "pressure_collapse"
  | "two_failed_reviews";

export type Phase =
  | "profile"
  | "character"
  | "fixed_event"
  | "semester_start"
  | "week_start"
  | "week_action"
  | "week_settlement"
  | "review"
  | "semester_settlement"
  | "year_transition"
  | "graduation"
  | "ending";

export type Delta = Partial<{
  energy: number;
  pressure: number;
  money: number;
  progress: number;
  quality: number;
  gpaModifier: number;
} & Record<AttributeKey, number>>;

export interface Attributes {
  design: number;
  software: number;
  aesthetic: number;
  presentation: number;
  social: number;
  resilience: number;
}

export interface ReviewRecord {
  semesterIndex: number;
  year: number;
  term: 1 | 2;
  progress: number;
  quality: number;
  baseGrade: ReviewGrade;
  finalGrade: ReviewGrade;
  designCourseGpa: number;
  semesterGpa: number;
  portfolioAdded: number;
  isGraduationDesign: boolean;
}

export interface CompetitionRecord {
  semesterIndex: number;
  year: number;
  term: 1 | 2;
  reviewGrade: ReviewGrade;
  portfolioAdded: number;
  awardRoll: number;
  award: CompetitionAward;
  prizeMoney: number;
}

export interface InternshipRecord {
  semesterIndex: number;
  week: number;
  tier: InternshipTier;
  value: number;
  designAtOffer: number;
  softwareAtOffer: number;
}

export interface LogEntry {
  index: number;
  week: number;
  year: number;
  term: 1 | 2;
  weekInSemester: number;
  phase: Phase;
  source: string;
  message: string;
  delta?: Delta;
  snapshot: StateSnapshot;
}

export interface EventDefinition {
  id: string;
  title: string;
  pool: EventPool;
  sentiment: EventSentiment;
  baseWeight: number;
  cooldownWeeks: number;
  repeatable: boolean;
  delta: Delta;
  tags?: string[];
  contextTags?: string[];
  aiExperienceDelta?: number;
  semesterMin?: number;
  semesterMax?: number;
  weekInSemester?: number;
}

export interface EventRecord {
  eventId: string;
  title: string;
  week: number;
  semesterIndex: number;
  pool: EventPool;
  sentiment: EventSentiment;
  aiExperienceDelta: number;
}

export interface RouteState {
  intention?: RouteId;
  formal?: {
    route: RouteId;
    group: RouteGroup;
    target: string;
    week: number;
  };
  hiddenResult?: {
    route: RouteId;
    target: string;
    passed: boolean;
    score?: number;
    outcome: RouteOutcome;
    attributesAtDecision: Attributes;
    gpaAtDecision: number;
    portfolioAtDecision: number;
    recentFailedReviewsAtDecision: number;
    failureReasons: RouteFailureReason[];
  };
}

export interface CourseDefinition {
  id: CourseId;
  name: string;
  delta: Delta;
}

export interface CourseRecord {
  semesterIndex: number;
  course: CourseId;
  correctAnswers: number;
  gpaModifier: number;
}

export interface StateSnapshot {
  energy: number;
  pressure: number;
  money: number;
  progress: number;
  quality: number;
  gpa: number;
  portfolio: number;
  consecutiveFailedReviews: number;
  ending?: EndingId;
}

export interface GameState {
  seed: number;
  rngState: number;
  strategy: StrategyId;
  phase: Phase;
  week: number;
  year: number;
  term: 1 | 2;
  weekInSemester: number;
  semesterIndex: number;
  actionsRemaining: number;
  weeklyActionCounts: Partial<Record<ActionId, number>>;
  energy: number;
  maxEnergy: number;
  pressure: number;
  money: number;
  gpa: number;
  gpaHistory: number[];
  gpaModifier: number;
  selectedCourse?: CourseId;
  courseRecords: CourseRecord[];
  attributes: Attributes;
  progress: number;
  quality: number;
  portfolio: number;
  consecutiveFailedReviews: number;
  pressureOver90Weeks: number;
  reviews: ReviewRecord[];
  logs: LogEntry[];
  eventHistory: string[];
  eventRecords: EventRecord[];
  eventLastTriggeredWeek: Record<string, number>;
  eventTally: Record<string, number>;
  aiExperience: number;
  route: RouteState;
  internshipValue: number;
  namedFirmInternship: boolean;
  internshipRecords: InternshipRecord[];
  competitionAwardCount: number;
  competitionRecords: CompetitionRecord[];
  guaranteedEvents: {
    lightlyHolding: boolean;
    deskNote: boolean;
  };
  actionTally: Partial<Record<ActionId, number>>;
  ending?: EndingId;
  failureReason?: FailureReason;
  completedGraduationDesign: boolean;
}

export interface ActionDefinition {
  id: ActionId;
  name: string;
  baseDelta: Delta;
  progressBase?: number;
  qualityBase?: number;
  maxPerWeek?: number;
  costsMoney?: boolean;
  highEnergyCost?: boolean;
  pressureIncreasing?: boolean;
}

export interface RunOptions {
  seed: number;
  strategy: StrategyId;
  maxWeeks?: number;
  verbose?: boolean;
  events?: boolean;
}
