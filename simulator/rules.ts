import type { ActionDefinition, ActionId, Attributes, ReviewGrade } from "./types.ts";

export const SEMESTER_COUNT = 10;
export const WEEKS_PER_SEMESTER = 6;
export const TOTAL_WEEKS = SEMESTER_COUNT * WEEKS_PER_SEMESTER;
export const ACTIONS_PER_WEEK = 3;

export const INITIAL_ATTRIBUTES: Attributes = {
  design: 28,
  software: 26,
  aesthetic: 28,
  presentation: 26,
  social: 28,
  resilience: 28,
};

export const INITIAL_STATE = {
  energy: 100,
  maxEnergy: 100,
  pressure: 20,
  money: 2000,
  gpa: 4.0,
};

export const MONTHLY_ALLOWANCE = 2000;
export const WEEKLY_LIVING_COST = 400;

export const ACTIONS: Record<ActionId, ActionDefinition> = {
  learn_ai_software: {
    id: "learn_ai_software",
    name: "learn_ai_software",
    baseDelta: { energy: -5, pressure: 5, software: 2 },
    pressureIncreasing: true,
  },
  read_exhibition: {
    id: "read_exhibition",
    name: "read_exhibition",
    baseDelta: { energy: -4, pressure: -1, money: -100, aesthetic: 2 },
    costsMoney: true,
  },
  design_iteration: {
    id: "design_iteration",
    name: "design_iteration",
    baseDelta: { energy: -7, pressure: 7, design: 1, aesthetic: 1 },
    progressBase: 1,
    qualityBase: 11,
    pressureIncreasing: true,
  },
  site_research: {
    id: "site_research",
    name: "site_research",
    baseDelta: { energy: -8, pressure: -2, money: -200, design: 1, aesthetic: 1, social: 1 },
    progressBase: 1,
    qualityBase: 9,
    costsMoney: true,
  },
  normal_drawing: {
    id: "normal_drawing",
    name: "normal_drawing",
    baseDelta: { energy: -7, pressure: 6, software: 1 },
    progressBase: 16,
    pressureIncreasing: true,
  },
  crunch_drawing: {
    id: "crunch_drawing",
    name: "crunch_drawing",
    baseDelta: { energy: -18, pressure: 12, software: 1, resilience: 1 },
    progressBase: 28,
    highEnergyCost: true,
    pressureIncreasing: true,
  },
  exercise: {
    id: "exercise",
    name: "exercise",
    baseDelta: { energy: -2, pressure: -15, money: -300, resilience: 2 },
    costsMoney: true,
  },
  socialize: {
    id: "socialize",
    name: "socialize",
    baseDelta: { energy: -2, pressure: -20, money: -700, social: 2 },
    costsMoney: true,
  },
  rest: {
    id: "rest",
    name: "rest",
    baseDelta: { energy: 60, pressure: -10, resilience: 1 },
  },
  outsourcing: {
    id: "outsourcing",
    name: "outsourcing",
    baseDelta: { money: 600, energy: -6, pressure: 4, design: 1, aesthetic: 1, resilience: 1 },
    maxPerWeek: 2,
    highEnergyCost: true,
    pressureIncreasing: true,
  },
  part_time: {
    id: "part_time",
    name: "part_time",
    baseDelta: { money: 400, pressure: 5, energy: -5 },
    maxPerWeek: 2,
    highEnergyCost: true,
    pressureIncreasing: true,
  },
  special_skill: {
    id: "special_skill",
    name: "special_skill",
    baseDelta: { progress: 8, quality: 6, energy: -8, pressure: 6 },
    pressureIncreasing: true,
  },
  presentation_practice: {
    id: "presentation_practice",
    name: "presentation_practice",
    baseDelta: { energy: -4, pressure: 3, presentation: 2 },
    pressureIncreasing: true,
  },
  public_affairs_prep: {
    id: "public_affairs_prep",
    name: "public_affairs_prep",
    baseDelta: { energy: -5, pressure: 4, presentation: 3, social: 1, resilience: 1 },
    pressureIncreasing: true,
  },
  content_practice: {
    id: "content_practice",
    name: "content_practice",
    baseDelta: { energy: -4, pressure: 3, presentation: 3, aesthetic: 2 },
    pressureIncreasing: true,
  },
  portfolio_polish: {
    id: "portfolio_polish",
    name: "portfolio_polish",
    baseDelta: { energy: -5, pressure: 4, presentation: 1, aesthetic: 1, design: 1 },
    qualityBase: 3,
    pressureIncreasing: true,
  },
};

export const GRADE_ORDER: ReviewGrade[] = ["F", "D", "C", "B", "A", "S"];

export const GRADE_TO_GPA: Record<ReviewGrade, number> = {
  S: 4.0,
  A: 3.7,
  B: 3.2,
  C: 2.6,
  D: 2.0,
  F: 0.0,
};

export const GRADE_TO_PORTFOLIO: Record<ReviewGrade, number> = {
  S: 110,
  A: 95,
  B: 78,
  C: 60,
  D: 42,
  F: 0,
};

export function progressCapForSemester(semesterIndex: number): number {
  return semesterIndex >= 9 ? 200 : 100;
}

export function qualityCapForSemester(semesterIndex: number): number {
  return semesterIndex >= 9 ? 200 : 100;
}

export function isGraduationDesign(semesterIndex: number): boolean {
  return semesterIndex >= 9;
}
