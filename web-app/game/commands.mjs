import {
  ACTIONS,
  ATTRIBUTE_KEYS,
  BASE_ACTIONS_PER_WEEK,
  CHARACTERS,
  COURSE_QUESTIONS,
  COURSES,
  FIXED_EVENTS,
  MENTORS,
  MODEL_MATERIALS,
  OUTSOURCING_PROJECTS,
  PART_TIME_PROJECTS,
  REPORT_STRATEGIES,
  SUMMER_EVENTS,
  WEEKS_PER_SEMESTER,
} from "./data.mjs";
import { queueWeeklyEvents, confirmEvent } from "./events.mjs";
import { randomFloat, sampleMany } from "./rng.mjs";
import {
  actionsForThisWeek,
  applyDelta,
  applyPositiveYieldPenalty,
  applyWeeklySettlement,
  calculateReviewBase,
  clamp,
  currentRiskPenalty,
  finalizeReview,
  isMoneyHighRisk,
  monthlyAllowance,
  progressModifier,
  qualityModifier,
  settleFinalEnding,
  shiftGrade,
  weeklyLivingCost,
} from "./resolver.mjs";
import {
  drawCharacterCandidates,
  emptyAttributes,
  getCharacter,
  getCourse,
  log,
  popModal,
  pushModal,
  requireNoPending,
  updateCalendarFromSemester,
} from "./state.mjs";

export function rerollCharacters(state) {
  if (state.phase !== "character_select" || state.rerollsRemaining <= 0) {
    return { ok: false, reason: "reroll_unavailable" };
  }
  state.previousCharacterCandidates = [...state.characterCandidates];
  state.rngState = drawCharacterCandidates(state, state.previousCharacterCandidates);
  state.rerollsRemaining -= 1;
  log(state, "character_select", "character_reroll", "免费重抽角色", {});
  return { ok: true };
}

export function selectCharacter(state, characterId) {
  if (state.phase !== "character_select") {
    return { ok: false, reason: "not_character_phase" };
  }
  if (!state.characterCandidates.includes(characterId)) {
    return { ok: false, reason: "character_not_in_candidates" };
  }

  const character = CHARACTERS.find((item) => item.id === characterId);
  state.profile.characterId = character.id;
  state.energy = 100;
  state.maxEnergy = 100;
  state.pressure = character.pressure;
  state.attributes = { ...character.attributes };
  state.semesterAttributeGrowth = emptyAttributes();
  state.money = getInitialMoney(character);
  log(state, "character_select", "character_selected", `选择角色：${character.name}`, {});
  queueMentorSelection(state);
  return { ok: true };
}

export function chooseFixedEventOption(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "fixed_event") {
    return { ok: false, reason: "no_fixed_event_pending" };
  }
  const event = FIXED_EVENTS.find((item) => item.id === interaction.eventId);
  const option = event?.options.find((item) => item.id === optionId) ?? event?.options[0];
  if (!event || !option) {
    return { ok: false, reason: "fixed_event_not_found" };
  }

  resolvePending(state, () => {
    if (Object.keys(option.delta ?? {}).length > 0) {
      applyDelta(state, `fixed:${event.id}`, `${event.title}：${option.label}`, option.delta, "fixed_event");
    } else {
      log(state, "fixed_event", `fixed:${event.id}`, `${event.title}：${option.label}`, {});
    }
    state.fixedEventIndex += 1;
    if (Object.keys(option.delta ?? {}).length > 0) {
      queueChoiceResult(state, event.title, option.body, option.delta);
    }
    if (state.ending) return;
    if (state.fixedEventIndex < FIXED_EVENTS.length) {
      queueFixedEvent(state);
    } else {
      queueCourseSelection(state);
    }
  });
  return { ok: true };
}

export function selectMentor(state, mentorId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "mentor_select") {
    return { ok: false, reason: "no_mentor_pending" };
  }
  if (!interaction.options.some((option) => option.id === mentorId)) {
    return { ok: false, reason: "mentor_not_in_candidates" };
  }

  const mentor = MENTORS.find((item) => item.id === mentorId);
  resolvePending(state, () => {
    state.profile.mentorId = mentor.id;
    log(state, "mentor_select", "mentor_selected", `选择导师：${mentor.name}`, {});
    if (state.fixedEventIndex < FIXED_EVENTS.length) {
      queueFixedEvent(state);
    } else {
      queueCourseSelection(state);
    }
  });
  return { ok: true };
}

export function selectCourse(state, courseId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "course_select") {
    return { ok: false, reason: "no_course_pending" };
  }
  if (!COURSES.some((course) => course.id === courseId)) {
    return { ok: false, reason: "course_not_found" };
  }

  const course = COURSES.find((item) => item.id === courseId);
  resolvePending(state, () => {
    state.courseId = course.id;
    state.courseYear = state.year;
    log(state, "course_select", "course_selected", `选择大${state.year}学年课程：${course.name}`, {});
    if (state.year > 1) {
      queueYearStartPrompt(state);
    } else {
      startWeek(state);
    }
  });
  return { ok: true };
}

export function confirmYearStart(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "year_start") {
    return { ok: false, reason: "no_year_start_pending" };
  }
  resolvePending(state, () => startWeek(state));
  return { ok: true };
}

export function chooseModelMaterial(state, materialId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "model_material") {
    return { ok: false, reason: "no_model_material_pending" };
  }
  const material = MODEL_MATERIALS.find((item) => item.id === materialId);
  if (!material) {
    return { ok: false, reason: "material_not_found" };
  }

  resolvePending(state, () => {
    state.modelMaterialBySemester[state.semesterIndex] = material.id;
    state.currentModelMaterialId = material.id;
    applyDelta(state, `model_material:${material.id}`, `模型材料：${material.name}`, material.delta, "model_material");
    if (!state.ending) {
      state.phase = "week_action";
    }
  });
  return { ok: true };
}

export function performAction(state, actionId) {
  const availability = resolveActionAvailability(state).find((item) => item.id === actionId);
  if (!availability || (availability.state !== "available" && !availability.canInspect)) {
    return { ok: false, reason: availability?.reason ?? "action_unavailable" };
  }
  const action = ACTIONS.find((item) => item.id === actionId);

  if (action.projectType) {
    queueProjectSelection(state, action.projectType);
    return { ok: true };
  }

  consumeActionSlot(state, actionId);

  if (action.specialSkill) {
    return performSpecialSkill(state);
  }

  const delta = calculateActionDelta(state, action);
  applyDelta(state, `action:${action.id}`, action.label, delta, "week_action", {
    actionId: action.id,
    positiveKind: action.positiveKind,
  });
  return { ok: true };
}

export function chooseProject(state, projectId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "project_select") {
    return { ok: false, reason: "no_project_pending" };
  }

  const projects = interaction.projectType === "outsourcing" ? OUTSOURCING_PROJECTS : PART_TIME_PROJECTS;
  const project = projects.find((item) => item.id === projectId);
  if (!project) {
    return { ok: false, reason: "project_not_found" };
  }
  const availability = projectAvailability(state, project, interaction.projectType);
  if (availability.state !== "available") {
    const previous = interaction;
    state.pendingInteraction = {
      type: "choice_result",
      title: "暂时不能承接",
      body: `${project.name}\n${availability.reason || "条件不足，先把能力和状态补起来。"}`,
      blocks: true,
      options: [{ id: "confirm", label: "返回项目列表" }],
    };
    state.modalQueue.unshift(previous);
    return { ok: true };
  }

  resolvePending(state, () => {
    consumeActionSlot(state, interaction.projectType);
    const delta = { ...project.delta };
    const character = getCharacter(state);
    if (character?.id === "future_boss") {
      delta.money = (delta.money ?? 0) + (interaction.projectType === "outsourcing" ? 200 : 100);
    }
    applyDelta(state, `${interaction.projectType}:${project.id}`, project.name, delta, "week_action", {
      actionId: interaction.projectType,
    });
  });
  return { ok: true };
}

export function confirmRandomEvent(state, optionId) {
  const result = confirmEvent(state, optionId);
  if (!result.ok) {
    return result;
  }
  resolvePending(state);
  return { ok: true };
}

export function finishWeek(state) {
  const pending = requireNoPending(state);
  if (!pending.ok) return pending;
  if (state.phase !== "week_action") {
    return { ok: false, reason: "not_week_action_phase" };
  }

  state.phase = "week_settlement";
  applyWeeklySettlement(state);
  if (state.ending) return { ok: true };

  queueWeeklyEvents(state);
  if (state.pendingInteraction) {
    return { ok: true };
  }
  continueAfterWeeklyEvents(state);
  return { ok: true };
}

export function continueAfterWeeklyEvents(state) {
  if (state.pendingInteraction || state.ending) {
    return { ok: true };
  }
  if (state.phase !== "week_settlement") {
    return { ok: false, reason: "not_week_settlement_phase" };
  }
  if (shouldStartYearlyCourseExam(state)) {
    startCourseExam(state);
  } else if (state.weekInSemester >= WEEKS_PER_SEMESTER) {
    startReview(state);
  } else {
    startWeek(state);
  }
  return { ok: true };
}

export function answerCourseQuestion(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "course_question") {
    return { ok: false, reason: "no_course_question_pending" };
  }

  const exam = state.courseExam;
  const current = exam.questions[exam.index];
  exam.answers.push({ question: current.q, selected: optionId, correct: optionId === current.answer });
  exam.index += 1;

  resolvePending(state, () => {
    if (exam.index < exam.questions.length) {
      queueCourseQuestion(state);
    } else {
      resolveCourseExam(state);
    }
  });
  return { ok: true };
}

export function confirmCourseResult(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "course_result") {
    return { ok: false, reason: "no_course_result_pending" };
  }
  resolvePending(state, () => startReview(state));
  return { ok: true };
}

export function chooseReportStrategy(state, strategyId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "report_strategy") {
    return { ok: false, reason: "no_report_strategy_pending" };
  }
  const available = interaction.options.find((option) => option.id === strategyId && option.state === "available");
  if (!available) {
    return { ok: false, reason: "strategy_unavailable" };
  }

  const strategy = REPORT_STRATEGIES.find((item) => item.id === strategyId);
  const base = state.reviewDraft.base;
  const [rngState, roll] = randomFloat(state.rngState);
  state.rngState = rngState;
  const succeeded = roll <= strategy.successRate;
  const branch = succeeded ? strategy.success : strategy.failure;
  const strategyResult = applyReportStrategyResult(state, base, strategy, branch, succeeded);
  state.reviewDraft.strategyResult = strategyResult;

  resolvePending(state, () => {
    pushModal(state, {
      type: "report_feedback",
      title: succeeded ? "汇报成功" : "汇报失败",
      body: branch.text,
      blocks: true,
      options: [{ id: "confirm", label: "查看评图结果" }],
    });
  });
  return { ok: true };
}

export function confirmReportFeedback(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "report_feedback") {
    return { ok: false, reason: "no_report_feedback_pending" };
  }

  resolvePending(state, () => {
    const record = finalizeReview(state, state.reviewDraft?.strategyResult);
    state.reviewDraft = null;
    queueReviewResult(state, record);
  });
  return { ok: true };
}

export function confirmReviewResult(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "review_result") {
    return { ok: false, reason: "no_review_result_pending" };
  }

  resolvePending(state, () => {
    if (state.ending) {
      return;
    }
    const summer = SUMMER_EVENTS.filter((event) => event.semesterAfter === state.semesterIndex);
    if (summer.length > 0) {
      state.summerQueue = summer.map((event) => event.id);
      queueSummerEvent(state);
    } else {
      advanceSemester(state);
    }
  });
  return { ok: true };
}

export function chooseSummerEventOption(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "summer_event") {
    return { ok: false, reason: "no_summer_event_pending" };
  }
  const event = SUMMER_EVENTS.find((item) => item.id === interaction.eventId);
  const option = event?.options.find((item) => item.id === optionId);
  if (!event || !option) {
    return { ok: false, reason: "summer_option_not_found" };
  }

  resolvePending(state, () => {
    applyDelta(state, `summer:${event.id}`, `${event.title}：${option.label}`, option.delta, "summer_event");
    queueChoiceResult(state, event.title, option.body, option.delta);
    state.summerQueue = (state.summerQueue ?? []).filter((id) => id !== event.id);
    if (state.summerQueue.length > 0) {
      queueSummerEvent(state);
    } else {
      advanceSemester(state);
    }
  });
  return { ok: true };
}

export function resolveActionAvailability(state) {
  return ACTIONS.map((action) => {
    if (state.pendingInteraction) {
      return actionAvailabilityResult(action, "disabled", "先处理当前弹窗");
    }
    if (state.phase !== "week_action") {
      return actionAvailabilityResult(action, "hidden", "当前阶段不能行动");
    }
    if (state.actionsRemaining <= 0) {
      return actionAvailabilityResult(action, "disabled", "本周行动次数已用完");
    }
    if (action.maxPerWeek !== undefined && (state.weeklyActionCounts[action.id] ?? 0) >= action.maxPerWeek) {
      return actionAvailabilityResult(action, "disabled", "本周次数已达上限");
    }
    if (state.energy < 30 && action.highEnergyCost) {
      return actionAvailabilityResult(action, "disabled", "精力高危，不能选择高消耗行动");
    }
    if (state.pressure > 80 && action.pressureIncreasing) {
      return actionAvailabilityResult(action, "disabled", "压力高危，不能选择增加压力的行动");
    }
    if (action.specialSkill) {
      return specialSkillAvailability(state, action);
    }
    if (action.projectType === "outsourcing" && availableProjects(state, "outsourcing").every((item) => item.state !== "available")) {
      return { ...actionAvailabilityResult(action, "disabled", "当前没有满足门槛的外包项目"), canInspect: true, preview: "查看外包项目门槛" };
    }
    if (action.costsMoney && (action.baseDelta.money ?? 0) < 0 && state.money + action.baseDelta.money < 0) {
      return actionAvailabilityResult(action, "disabled", "余额不足");
    }
    if (isMoneyHighRisk(state) && action.costsMoney) {
      return actionAvailabilityResult(action, "disabled", "金钱高危，花费行为置灰");
    }
    return actionAvailabilityResult(action, "available", "");
  });
}

export function availableProjects(state, projectType) {
  const projects = projectType === "outsourcing" ? OUTSOURCING_PROJECTS : PART_TIME_PROJECTS;
  return projects.map((project) => projectAvailability(state, project, projectType));
}

function queueFixedEvent(state) {
  const event = FIXED_EVENTS[state.fixedEventIndex];
  if (!event) return;
  pushModal(state, {
    type: "fixed_event",
    eventId: event.id,
    title: event.title,
    body: event.body,
    blocks: true,
    options: event.options.map((option) => ({
      id: option.id,
      label: option.label,
      body: option.body,
      delta: option.delta,
    })),
  });
}

function queueMentorSelection(state) {
  state.phase = "mentor_select";
  const [rngState, candidates] = sampleMany(state.rngState, MENTORS, 3);
  state.rngState = rngState;
  state.mentorCandidates = candidates.map((mentor) => mentor.id);
  pushModal(state, {
    type: "mentor_select",
    title: "选择导师",
    body: "军训结束后，选择 1 位导师作为本学年的导师。导师会发布本学期阶段任务。",
    blocks: true,
    options: candidates.map((mentor) => ({
      id: mentor.id,
      label: `${mentor.name}：${mentor.title}`,
      body: mentor.intro,
    })),
  });
}

function queueCourseSelection(state) {
  state.phase = "course_select";
  pushModal(state, {
    type: "course_select",
    title: `大${state.year}学年选课`,
    body: "每学年选择 1 门大学课程。课程不占周行动次数，在本学年下半学期第 5 周结束后进入期末考试，答题后结算属性收益和 GPA 修正。",
    blocks: true,
    options: COURSES.map((course) => ({
      id: course.id,
      label: course.name,
      body: `${formatDelta(course.delta)}。${course.context}`,
    })),
  });
}

function startWeek(state) {
  state.phase = "week_action";
  state.week += 1;
  state.weekInSemester += 1;
  state.weeklyActionCounts = {};
  state.actionsPerWeek = BASE_ACTIONS_PER_WEEK;
  state.actionsRemaining = actionsForThisWeek(state);
  log(state, "week_start", "week_start", `进入第 ${state.week} 周`, {});

  if (state.weekInSemester === 1 || state.weekInSemester === 4) {
    applyDelta(state, "living_allowance", "本月生活费到账", { money: monthlyAllowance(state) }, "week_start");
  }

  if (state.weekInSemester === 1) {
    log(state, "semester_start", "mentor_task", currentMentorTaskText(state), {});
  }

  if (state.weekInSemester === 5 && !state.modelMaterialBySemester[state.semesterIndex]) {
    queueModelMaterial(state);
  }
}

function queueModelMaterial(state) {
  state.phase = "model_material";
  pushModal(state, {
    type: "model_material",
    title: "模型周材料选择",
    body: "模型周开始时必须选择一种材料方案。选择不占行动次数，结算后才进入本周事件与行动。",
    blocks: true,
    options: MODEL_MATERIALS.map((material) => ({
      id: material.id,
      label: `${material.name} ￥${material.price}`,
      body: `${material.text} ${formatDelta(material.delta)}`,
      state: state.money >= material.price || material.id === "hand_cut" ? "available" : "disabled",
      reason: state.money >= material.price || material.id === "hand_cut" ? "" : "余额不足",
    })),
  });
}

function queueProjectSelection(state, projectType) {
  const title = projectType === "outsourcing" ? "选择设计外包项目" : "选择校外兼职项目";
  pushModal(state, {
    type: "project_select",
    projectType,
    title,
    body: "项目选择属于游戏规则层，UI 只展示当前可选项目和置灰原因。",
    blocks: true,
    options: availableProjects(state, projectType),
  });
}

function consumeActionSlot(state, actionId) {
  state.actionsRemaining -= 1;
  state.weeklyActionCounts[actionId] = (state.weeklyActionCounts[actionId] ?? 0) + 1;
  state.semesterActionTally[actionId] = (state.semesterActionTally[actionId] ?? 0) + 1;
  state.actionTally[actionId] = (state.actionTally[actionId] ?? 0) + 1;
}

function calculateActionDelta(state, action) {
  const penalty = currentRiskPenalty(state);
  const delta = { ...action.baseDelta };
  if (action.progressBase !== undefined) {
    delta.progress = applyPositiveYieldPenalty(action.progressBase + progressModifier(state), penalty);
  }
  if (action.qualityBase !== undefined) {
    delta.quality = applyPositiveYieldPenalty(action.qualityBase + qualityModifier(state), penalty);
  }
  for (const key of ATTRIBUTE_KEYS) {
    if (delta[key] !== undefined) {
      delta[key] = applyPositiveYieldPenalty(delta[key], penalty);
    }
  }
  return delta;
}

function performSpecialSkill(state) {
  const character = getCharacter(state);
  const skill = character?.skill;
  if (!skill) {
    return { ok: false, reason: "skill_not_found" };
  }
  state.specialSkill.lastUsedWeek = state.week;

  if (skill.reviewEase) {
    state.specialSkill.reviewEaseSemester = state.semesterIndex;
    state.specialSkill.reviewEase = skill.reviewEase;
    log(state, "week_action", `skill:${character.id}`, `专属技能：${character.skillName}`, {});
    return { ok: true };
  }

  applyDelta(state, `skill:${character.id}`, `专属技能：${character.skillName}`, skill.delta, "week_action", {
    actionId: "special_skill",
  });
  return { ok: true };
}

function startCourseExam(state) {
  state.phase = "course_exam";
  const course = getCourse(state);
  const questions = COURSE_QUESTIONS[course?.id] ?? COURSE_QUESTIONS.architecture_history;
  const [rngState, selected] = sampleMany(state.rngState, questions, 3);
  state.rngState = rngState;
  state.courseExam = {
    courseId: course?.id,
    index: 0,
    questions: selected,
    answers: [],
  };
  pushModal(state, {
    type: "course_exam_intro",
    title: "课程期末考试",
    body: `大${state.year}下第 5 周结束，年度课程「${course?.name ?? "建筑史论"}」进入期末考试。按下开始考试后，将连续回答 3 道课程题。`,
    blocks: true,
    options: [{ id: "start", label: "开始考试" }],
  });
}

export function beginCourseExam(state) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "course_exam_intro") {
    return { ok: false, reason: "no_course_exam_intro_pending" };
  }
  resolvePending(state, () => queueCourseQuestion(state));
  return { ok: true };
}

function shouldStartYearlyCourseExam(state) {
  return state.term === 2 && state.weekInSemester >= 5 && state.courseId && state.courseExam?.resolved !== true;
}

function queueYearStartPrompt(state) {
  state.phase = "year_start";
  pushModal(state, {
    type: "year_start",
    title: `大${state.year}学年开始`,
    body: `新的学年开始了。导师、年度课程和课题已经确定，接下来进入大${state.year}${state.term === 1 ? "上" : "下"}第 1 周。`,
    blocks: true,
    options: [{ id: "confirm", label: "进入本学年" }],
  });
}

function queueCourseQuestion(state) {
  const exam = state.courseExam;
  const question = exam.questions[exam.index];
  pushModal(state, {
    type: "course_question",
    title: `课程题 ${exam.index + 1} / ${exam.questions.length}`,
    body: question.q,
    blocks: true,
    options: Object.entries(question.options).map(([id, label]) => ({ id, label })),
  });
}

function resolveCourseExam(state) {
  const course = getCourse(state);
  const correct = state.courseExam.answers.filter((answer) => answer.correct).length;
  let gpaModifier = correct === 3 ? 0.1 : correct === 2 ? 0 : correct === 1 ? -0.2 : -0.3;
  if (getCharacter(state)?.id === "town_exam_ace" && correct === 1) {
    gpaModifier = 0;
  }
  state.courseExam.resolved = true;
  applyDelta(state, `course:${course.id}`, `课程结算：${course.name}`, { ...course.delta, gpaModifier }, "course_exam");
  pushModal(state, {
    type: "course_result",
    title: "课程结算",
    body: `本学年课程「${course.name}」答对 ${correct} / 3 题，GPA 学期修正 ${formatSigned(gpaModifier)}。课程属性收益同步结算。`,
    blocks: true,
    options: [{ id: "confirm", label: "进入评图" }],
  });
}

function startReview(state) {
  state.phase = "review";
  resolveMentorTask(state);
  const base = calculateReviewBase(state);
  state.reviewDraft = { base, strategyResult: null };

  if (base.progressGateFailed) {
    const record = finalizeReview(state, null);
    queueReviewResult(state, record);
    return;
  }

  pushModal(state, {
    type: "report_strategy",
    title: "选择汇报策略",
    body: `基础图纸评级为 ${base.baseGrade}，质量评图分 ${base.qualityScore}。汇报策略不会改变进度或作品质量，只影响最终评级、作品分和绩点。`,
    blocks: true,
    options: REPORT_STRATEGIES.map((strategy) => strategyAvailability(state, strategy, base)),
  });
}

function resolveMentorTask(state) {
  const mentor = MENTORS.find((item) => item.id === state.profile.mentorId);
  if (!mentor) return;
  const success = mentorTaskSucceeded(state, mentor.id);
  const delta = success ? mentor.task.reward : mentor.task.penalty;
  applyDelta(
    state,
    `mentor_task:${mentor.id}`,
    `${mentor.name}阶段任务「${mentor.task.name}」${success ? "完成" : "未完成"}`,
    delta,
    "review",
  );
}

function mentorTaskSucceeded(state, mentorId) {
  const tally = state.semesterActionTally;
  switch (mentorId) {
    case "mentor_wang":
      return (tally.outsourcing ?? 0) >= 2 && (tally.site_research ?? 0) >= 3;
    case "mentor_ge":
      return (tally.design_iteration ?? 0) >= 3 && (tally.read_exhibition ?? 0) >= 3;
    case "mentor_lin":
      return state.quality >= 75 && (tally.design_iteration ?? 0) >= 5;
    case "mentor_chen":
      return (tally.site_research ?? 0) >= 3 && (tally.read_exhibition ?? 0) >= 2;
    case "mentor_zhou":
      return (tally.learn_ai_software ?? 0) >= 3 && state.semesterAttributeGrowth.software >= 15;
    case "mentor_xu":
      return state.progress >= 95 && state.pressure < 70;
    case "mentor_han":
      return state.quality >= 85;
    default:
      return false;
  }
}

function strategyAvailability(state, strategy, base) {
  let available = true;
  let reason = "";

  if (strategy.id !== "beg_pass" && base.baseGrade === "F") {
    available = false;
    reason = "基础评级为 F，只有“求求你别挂我”可以尝试质量补救";
  }
  if (strategy.id === "beg_pass" && base.progressGateFailed) {
    available = false;
    reason = "进度硬门槛未达成，不能补救";
  }
  if (strategy.requirements) {
    const missing = Object.entries(strategy.requirements).find(([key, value]) => state.attributes[key] < value);
    if (missing) {
      available = false;
      reason = `${attributeLabel(missing[0])}不足 ${missing[1]}`;
    }
  }

  return {
    id: strategy.id,
    label: strategy.name,
    body: `${strategy.intro} 成功率 ${Math.round(strategy.successRate * 100)}%。`,
    state: available ? "available" : "disabled",
    reason,
  };
}

function applyReportStrategyResult(state, base, strategy, branch, succeeded) {
  const character = getCharacter(state);
  const delta = {};
  if (branch.pressure) delta.pressure = branch.pressure;
  if (branch.energy) delta.energy = branch.energy;
  if (character?.id === "corbusier_heir") {
    delta.pressure = (delta.pressure ?? 0) + 3;
  }
  if (Object.keys(delta).length > 0) {
    applyDelta(state, `report:${strategy.id}`, `${strategy.name}${succeeded ? "成功" : "失败"}`, delta, "review");
  }

  let finalGrade = base.baseGrade;
  let finalScore = base.baseScore;
  let scoreDelta = branch.score ?? 0;

  if (character?.id === "design_enabler") {
    if (succeeded) scoreDelta += 3;
    if (!succeeded && scoreDelta < 0) scoreDelta += 1;
  }

  if (succeeded && branch.gradeShift) {
    finalGrade = shiftGrade(base.baseGrade, branch.gradeShift);
    if (base.baseGrade === "S") {
      scoreDelta += 5;
    }
  }
  if (succeeded && branch.rescueF && base.failureKind === "quality") {
    finalGrade = "D";
    finalScore = Math.max(45, finalScore);
  }
  if (succeeded && branch.readPpt && ["S", "A", "B", "C"].includes(base.baseGrade)) {
    finalGrade = shiftGrade(base.baseGrade, -1);
  }

  finalScore = clamp(finalScore + scoreDelta, 0, 100);
  return {
    strategyId: strategy.id,
    succeeded,
    finalGrade,
    finalScore,
  };
}

function queueReviewResult(state, record) {
  pushModal(state, {
    type: "review_result",
    title: "评图结果",
    body: `最终图纸评级：${record.finalGrade}。作品分：${record.finalScore}。本学期 GPA：${record.semesterGpa.toFixed(2)}。作品集入库：${record.portfolioAdded}。`,
    blocks: true,
    options: [{ id: "confirm", label: state.ending ? "查看结局" : "继续" }],
  });
}

function queueSummerEvent(state) {
  const eventId = state.summerQueue[0];
  const event = SUMMER_EVENTS.find((item) => item.id === eventId);
  if (!event) {
    advanceSemester(state);
    return;
  }
  state.phase = "summer_event";
  pushModal(state, {
    type: "summer_event",
    eventId: event.id,
    title: event.title,
    body: event.body,
    blocks: true,
    options: event.options.map((option) => ({
      id: option.id,
      label: option.label,
      body: option.body,
      delta: option.delta,
    })),
  });
}

function advanceSemester(state) {
  if (state.semesterIndex >= 10) {
    settleFinalEnding(state);
    return;
  }
  state.semesterIndex += 1;
  updateCalendarFromSemester(state);
  state.weekInSemester = 0;
  state.actionsRemaining = 0;
  state.weeklyActionCounts = {};
  state.semesterActionTally = {};
  state.semesterAttributeGrowth = emptyAttributes();
  state.courseExam = null;
  state.currentModelMaterialId = null;
  log(state, "semester_start", "semester_advance", `进入大${state.year}${state.term === 1 ? "上" : "下"}`, {});

  if (state.semesterIndex > 1 && state.semesterIndex % 2 === 1) {
    state.courseId = null;
    state.courseYear = null;
    queueMentorSelection(state);
  } else if (state.term === 2) {
    startWeek(state);
  } else {
    queueCourseSelection(state);
  }
}

function specialSkillAvailability(state, action) {
  const character = getCharacter(state);
  if (!character) {
    return actionAvailabilityResult(action, "disabled", "尚未选择角色");
  }
  if (state.specialSkill.lastUsedWeek !== null && state.week - state.specialSkill.lastUsedWeek < 10) {
    return actionAvailabilityResult(action, "disabled", "专属技能冷却中");
  }
  const skill = character.skill;
  if (skill.require?.pressureMin && state.pressure < skill.require.pressureMin) {
    return actionAvailabilityResult(action, "disabled", `压力需达到 ${skill.require.pressureMin}`);
  }
  const pressureDelta = skill.delta?.pressure ?? 0;
  if (state.pressure > 80 && pressureDelta > 0) {
    return actionAvailabilityResult(action, "disabled", "压力高危，不能使用会增加压力的技能");
  }
  const moneyDelta = skill.delta?.money ?? 0;
  if (moneyDelta < 0 && state.money + moneyDelta < 0) {
    return actionAvailabilityResult(action, "disabled", "余额不足");
  }
  return actionAvailabilityResult(action, "available", "");
}

function projectAvailability(state, project, projectType) {
  if (projectType === "outsourcing" && !requirementsMet(state, project)) {
    return {
      id: project.id,
      label: project.name,
      body: `${project.text} ${formatDelta(project.delta)}`,
      state: "disabled",
      reason: "能力门槛未满足",
    };
  }
  return {
    id: project.id,
    label: project.name,
    body: `${project.text} ${formatDelta(project.delta)}`,
    state: "available",
    reason: "",
  };
}

function requirementsMet(state, project) {
  if (!project.requirements) return true;
  if (project.anyRequirement) {
    return project.requirements.some((group) => requirementGroupMet(state, group));
  }
  return project.requirements.every((group) => requirementGroupMet(state, group));
}

function requirementGroupMet(state, group) {
  return Object.entries(group).every(([key, value]) => state.attributes[key] >= value);
}

function actionAvailabilityResult(action, state, reason) {
  return {
    id: action.id,
    label: action.label,
    group: action.group,
    state,
    reason,
    preview: action.baseDelta ? formatDelta(action.baseDelta) : action.projectType ? "选择具体项目后结算" : "按角色专属技能结算",
  };
}

function getInitialMoney(character) {
  const family = character.familyId;
  if (family === "poor") return 1000;
  if (family === "wealthy") return 10000;
  if (family === "academic") return 5000;
  return 2000;
}

function currentMentorTaskText(state) {
  const mentor = MENTORS.find((item) => item.id === state.profile.mentorId);
  if (!mentor) return "本学期没有导师任务";
  return `${mentor.name}阶段任务「${mentor.task.name}」：${mentor.task.conditionText}`;
}

function resolvePending(state, continuation) {
  state.pendingInteraction = null;
  continuation?.();
  if (!state.pendingInteraction) {
    popModal(state);
  }
}

function queueChoiceResult(state, title, body, delta) {
  pushModal(state, {
    type: "choice_result",
    title: `${title}结算`,
    body: `${body ?? "选择已确认。"}\n${formatDelta(delta)}`,
    blocks: true,
    options: [{ id: "confirm", label: "确定" }],
  });
}

function attributeLabel(key) {
  const labels = {
    design: "设计水平",
    software: "软件技术",
    aesthetic: "创意审美",
    presentation: "汇报表达",
    social: "人际交往",
    resilience: "抗压能力",
  };
  return labels[key] ?? key;
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : String(value);
}

function formatDelta(delta = {}) {
  const labels = {
    energy: "精力",
    pressure: "压力",
    money: "金钱",
    progress: "进度",
    quality: "作品质量",
    portfolio: "作品集",
    gpaModifier: "GPA修正",
    design: "设计水平",
    software: "软件技术",
    aesthetic: "创意审美",
    presentation: "汇报表达",
    social: "人际交往",
    resilience: "抗压能力",
  };
  const parts = Object.entries(delta).map(([key, value]) => `${labels[key] ?? key} ${value > 0 ? "+" : ""}${value}`);
  return parts.length ? parts.join("，") : "无数值变化";
}
