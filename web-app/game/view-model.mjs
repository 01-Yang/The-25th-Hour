import {
  ACTIONS,
  ATTRIBUTE_LABELS,
  CHARACTERS,
  COURSES,
  EDUCATION_BACKGROUNDS,
  ENDINGS,
  FAMILY_BACKGROUNDS,
  MENTORS,
  MODEL_MATERIALS,
  OUTSOURCING_PROJECTS,
  PART_TIME_PROJECTS,
  SEMESTER_TOPICS,
  STAT_LABELS,
} from "./data.mjs";
import { availableProjects, resolveActionAvailability } from "./commands.mjs";
import { currentRiskLevel, isMoneyHighRisk, progressCap, qualityCap, reviewProgressRequirement, weeklyLivingCost } from "./resolver.mjs";
import { currentSemesterLabel, getCharacter } from "./state.mjs";
import { musicForState } from "./music.mjs";

export function toViewModel(state) {
  if (!state) {
    return { screen: "start" };
  }

  const character = getCharacter(state);
  const mentor = MENTORS.find((item) => item.id === state.profile.mentorId);
  const course = COURSES.find((item) => item.id === state.courseId);
  const riskLevel = currentRiskLevel(state);
  const ending = state.ending ? ENDINGS[state.ending] : null;

  return {
    screen: "game",
    phase: state.phase,
    seed: state.seed,
    music: musicForState(state),
    title: ending?.title ?? titleForState(state),
    subtitle: subtitleForState(state),
    profile: {
      nickname: state.profile.nickname,
      universityName: state.profile.universityName,
      characterName: character?.name ?? "未选择",
      characterIntro: character?.intro ?? "",
      education: character ? EDUCATION_BACKGROUNDS[character.educationId].label : "",
      family: character ? FAMILY_BACKGROUNDS[character.familyId].label : "",
      mentor: mentor ? `${mentor.name}：${mentor.title}` : "未选择",
      course: course?.name ?? "未选课",
    },
    calendar: {
      semester: currentSemesterLabel(state),
      week: state.week,
      weekInSemester: state.weekInSemester,
      topic: SEMESTER_TOPICS[state.semesterIndex - 1] ?? "课程设计",
      actionsRemaining: state.actionsRemaining,
      actionsPerWeek: state.actionsPerWeek,
      progressRequirement: reviewProgressRequirement(state),
    },
    meters: [
      meter("energy", state.energy, state.maxEnergy),
      meter("pressure", state.pressure, 100, true),
      meter("money", state.money, Math.max(weeklyLivingCost(state) * 8, state.money, 1)),
      meter("progress", state.progress, progressCap(state)),
      meter("quality", state.quality, qualityCap(state)),
    ],
    metrics: [
      { id: "gpa", label: STAT_LABELS.gpa, value: state.gpa.toFixed(2) },
      { id: "portfolio", label: STAT_LABELS.portfolio, value: Math.round(state.portfolio) },
      { id: "ai", label: "AI 相关经历", value: state.aiExperience },
      { id: "reviews", label: "评图次数", value: state.reviews.length },
    ],
    attributes: Object.entries(ATTRIBUTE_LABELS).map(([id, label]) => ({
      id,
      label,
      value: state.attributes[id],
    })),
    risk: {
      level: riskLevel,
      money: isMoneyHighRisk(state),
      messages: riskMessages(state, riskLevel),
    },
    actions: groupedActions(resolveActionAvailability(state)),
    pendingInteraction: normalizeInteraction(state.pendingInteraction),
    logs: state.logs.slice(-10).reverse(),
    reviews: state.reviews.slice(-5).reverse(),
    characterCandidates: state.characterCandidates.map((id) => {
      const item = CHARACTERS.find((characterItem) => characterItem.id === id);
      return {
        id: item.id,
        name: item.name,
        intro: item.intro,
        education: EDUCATION_BACKGROUNDS[item.educationId].label,
        family: FAMILY_BACKGROUNDS[item.familyId].label,
        passive: `${item.passiveName}：${item.passiveText}`,
        skill: `${item.skillName}：${item.skillText}`,
        pressure: item.pressure,
        attributes: item.attributes,
      };
    }),
    canReroll: state.phase === "character_select" && state.rerollsRemaining > 0,
    rerollsRemaining: state.rerollsRemaining,
    ending,
  };
}

function titleForState(state) {
  if (state.phase === "character_select") return "选择你的建筑生开局";
  if (state.phase === "fixed_event") return "开学固定流程";
  if (state.phase === "mentor_select") return "选择导师";
  if (state.phase === "course_select") return "选择本学年课程";
  if (state.phase === "model_material") return "模型周";
  if (state.phase === "course_exam") return "课程题";
  if (state.phase === "year_start") return `大${state.year}学年开始`;
  if (state.phase === "review") return "评图阶段";
  if (state.phase === "summer_event") return "暑假写生";
  return `${currentSemesterLabel(state)} 第 ${state.weekInSemester || 1} 周`;
}

function subtitleForState(state) {
  const topic = SEMESTER_TOPICS[state.semesterIndex - 1] ?? "课程设计";
  if (state.ending) return ENDINGS[state.ending]?.body ?? "";
  if (state.phase === "character_select") return "开局随机 3 张角色卡，可免费重抽 1 次。";
  if (state.phase === "week_action") return `${topic}。本周剩余 ${state.actionsRemaining} 次行动。`;
  return topic;
}

function meter(id, value, max, inverse = false) {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return {
    id,
    label: STAT_LABELS[id],
    value: Math.round(value),
    max: Math.round(max),
    ratio,
    inverse,
  };
}

function groupedActions(actions) {
  const groups = [];
  for (const action of actions.filter((item) => item.state !== "hidden")) {
    let group = groups.find((item) => item.name === action.group);
    if (!group) {
      group = { name: action.group, actions: [] };
      groups.push(group);
    }
    group.actions.push(action);
  }
  return groups;
}

function riskMessages(state, riskLevel) {
  const messages = [];
  if (riskLevel === "critical") {
    messages.push("你正在崩溃边缘，别画图了，快去休息！");
  } else if (riskLevel === "warning") {
    messages.push("状态进入轻度风险，行动收益会被削弱。");
  }
  if (isMoneyHighRisk(state)) {
    messages.push("你快要饿死了，省着点花！");
  }
  return messages;
}

function normalizeInteraction(interaction) {
  if (!interaction) return null;
  return {
    ...interaction,
    options: (interaction.options ?? []).map((option) => ({
      id: option.id,
      label: option.label,
      body: option.body ?? option.reason ?? "",
      state: option.state ?? "available",
      reason: option.reason ?? "",
      delta: option.delta,
    })),
  };
}

export function projectPreviewForDebug(state, projectType) {
  return {
    outsourcing: availableProjects(state, "outsourcing"),
    part_time: availableProjects(state, "part_time"),
  }[projectType];
}
