import type { RouteId, RouteTargetId, StrategyId } from "./types.ts";

export interface RouteTargetCase {
  strategy: StrategyId;
  route: RouteId;
  target: RouteTargetId;
  count: number;
  expectTargetSuccess?: boolean;
  expectRoutePass?: boolean;
  expectFailure?: boolean;
}

export const ROUTE_TARGET_CASES: RouteTargetCase[] = [
  { strategy: "postgrad", route: "postgrad_exam", target: "ordinary_postgrad_school", count: 30, expectTargetSuccess: true },
  { strategy: "postgrad", route: "postgrad_exam", target: "strong_postgrad_school", count: 30, expectTargetSuccess: true, expectFailure: true },
  { strategy: "postgrad", route: "postgrad_exam", target: "dream_postgrad_school", count: 30, expectFailure: true },
  { strategy: "overseas", route: "overseas", target: "overseas_c_tier", count: 30, expectTargetSuccess: true },
  { strategy: "overseas", route: "overseas", target: "overseas_a_tier", count: 30, expectTargetSuccess: true },
  { strategy: "overseas", route: "overseas", target: "overseas_s_tier", count: 30, expectFailure: true },
  { strategy: "civil_service", route: "civil_service", target: "selection_home", count: 30, expectFailure: true },
  { strategy: "civil_service", route: "civil_service", target: "civil_service_ministry", count: 30, expectRoutePass: true, expectFailure: true },
  { strategy: "civil_service", route: "civil_service", target: "administration_bianzhi", count: 30, expectTargetSuccess: true },
  { strategy: "civil_service", route: "civil_service", target: "teacher_bianzhi", count: 30, expectRoutePass: true, expectFailure: true },
  { strategy: "civil_service", route: "civil_service", target: "public_institution_general", count: 30, expectTargetSuccess: true, expectFailure: true },
  { strategy: "civil_service", route: "civil_service", target: "civil_service_provincial", count: 30, expectRoutePass: true, expectFailure: true },
  { strategy: "architecture_job", route: "architecture_job", target: "independent_studio", count: 30, expectTargetSuccess: true },
  { strategy: "architecture_job", route: "architecture_job", target: "local_design_institute", count: 30, expectTargetSuccess: true },
  { strategy: "architecture_job", route: "architecture_job", target: "state_owned_design_institute", count: 30, expectTargetSuccess: true },
  { strategy: "architecture_job", route: "architecture_job", target: "foreign_firm", count: 30, expectTargetSuccess: true },
  { strategy: "architecture_job", route: "architecture_job", target: "master_studio", count: 30, expectTargetSuccess: true },
  { strategy: "career_change", route: "career_change", target: "new_media_content", count: 30, expectTargetSuccess: true },
  { strategy: "career_change", route: "career_change", target: "ai_product_manager", count: 30, expectTargetSuccess: true, expectFailure: true },
  { strategy: "career_change", route: "career_change", target: "game_scene_artist", count: 30, expectTargetSuccess: true },
  { strategy: "career_change", route: "career_change", target: "sales_business", count: 30, expectTargetSuccess: true },
  { strategy: "career_change", route: "career_change", target: "illustrator", count: 30, expectTargetSuccess: true },
];

export function isTargetSuccess(testCase: RouteTargetCase, outcome: string | null | undefined): boolean {
  switch (testCase.route) {
    case "postgrad_exam":
      return testCase.target === "ordinary_postgrad_school" ? outcome === "basic_postgrad" : outcome === "strong_postgrad";
    case "overseas":
      return testCase.target === "overseas_s_tier" ? outcome === "overseas_strong" : outcome === "overseas_basic";
    case "civil_service":
      return outcome === "civil_service_success";
    case "architecture_job":
      return outcome === "architecture_job_success";
    case "career_change":
      return testCase.target === "entrepreneurship"
        ? outcome === "no_way_back_choice"
        : outcome === "career_change_success";
  }
}
