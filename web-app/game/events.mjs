import { MODEL_MATERIALS, RANDOM_EVENTS } from "./data.mjs";
import { drawWeighted, randomFloat } from "./rng.mjs";
import { applyDelta } from "./resolver.mjs";
import { pushModal } from "./state.mjs";

export function queueWeeklyEvents(state) {
  if (state.ending) {
    return;
  }

  const guaranteed = guaranteedEvent(state);
  if (guaranteed) {
    queueEventModal(state, guaranteed, "guaranteed");
    return;
  }

  if (recentRandomEventWeek(state) === state.week - 1) {
    return;
  }

  const modelEvent = state.weekInSemester === 5 ? maybeDrawModelEvent(state) : null;
  if (modelEvent) {
    queueEventModal(state, modelEvent, "model");
    return;
  }

  if (state.semesterIndex === 1 && state.weekInSemester === 1 && !state.eventTally.first_week_random) {
    const firstEvent = drawEvent(state, "normal");
    if (firstEvent) {
      state.eventTally.first_week_random = 1;
      queueEventModal(state, firstEvent, "first_week");
    }
    return;
  }

  const chance = eventChance(state);
  let rngState = state.rngState;
  const roll = randomFloat(rngState);
  rngState = roll[0];
  state.rngState = rngState;
  if (roll[1] > chance) {
    return;
  }

  const event = drawEvent(state, "normal");
  if (event) {
    queueEventModal(state, event, "normal");
  }
}

export function confirmEvent(state, optionId) {
  const interaction = state.pendingInteraction;
  if (!interaction || interaction.type !== "random_event") {
    return { ok: false, reason: "no_random_event_pending" };
  }

  const event = RANDOM_EVENTS.find((item) => item.id === interaction.eventId);
  if (!event) {
    return { ok: false, reason: "event_not_found" };
  }

  let selectedOption = null;
  let delta = event.result ?? {};
  if (event.options) {
    selectedOption = event.options.find((option) => option.id === optionId) ?? event.options[0];
    delta = selectedOption.delta;
  }

  applyDelta(
    state,
    `event:${event.id}`,
    selectedOption ? `${event.title}：${selectedOption.label}` : event.title,
    delta,
    "random_event",
    { sourceType: "event" },
  );

  state.eventHistory.push({ id: event.id, week: state.week, semesterIndex: state.semesterIndex, optionId: selectedOption?.id ?? null });
  state.eventLastTriggeredWeek[event.id] = state.week;
  state.eventTally[event.id] = (state.eventTally[event.id] ?? 0) + 1;

  if (event.id === "lightly_holding") {
    state.guaranteedEvents.lightlyHolding = true;
  }
  if (event.id === "desk_note") {
    state.guaranteedEvents.deskNote = true;
  }
  if (event.aiExperienceDelta) {
    state.aiExperience += event.aiExperienceDelta;
  }

  if (selectedOption) {
    pushModal(state, {
      type: "choice_result",
      title: `${event.title}结算`,
      body: `${selectedOption.body ?? selectedOption.label}\n${formatDelta(delta)}`,
      blocks: true,
      options: [{ id: "confirm", label: "确定" }],
    });
  }

  return { ok: true };
}

function queueEventModal(state, event, trigger) {
  pushModal(state, {
    type: "random_event",
    eventId: event.id,
    title: event.title,
    body: event.body,
    trigger,
    blocks: true,
    options: (event.options ?? [{ id: "confirm", label: formatDelta(event.result ?? {}) }]).map((option) => ({
      id: option.id,
      label: option.label,
      body: option.body ?? "",
      delta: option.delta ?? event.result ?? {},
    })),
  });
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

function guaranteedEvent(state) {
  if (state.semesterIndex === 2 && state.weekInSemester >= 1 && !state.guaranteedEvents.lightlyHolding) {
    return RANDOM_EVENTS.find((event) => event.id === "lightly_holding");
  }
  if (state.semesterIndex === 9 && state.weekInSemester <= 4 && !state.guaranteedEvents.deskNote) {
    return RANDOM_EVENTS.find((event) => event.id === "desk_note");
  }
  return null;
}

function eventChance(state) {
  if (state.semesterIndex <= 4) return 0.92;
  if (state.semesterIndex <= 6) return 0.78;
  if (state.semesterIndex <= 8) return 0.7;
  return 0.58;
}

function drawEvent(state, pool) {
  const candidates = RANDOM_EVENTS.filter((event) => {
    if (event.pool !== pool && !(pool === "normal" && event.pool === "interactive")) return false;
    return eventIsEligible(state, event);
  });
  const entries = candidates.map((event) => ({
    item: event,
    weight: eventWeight(state, event),
  }));
  const [rngState, event] = drawWeighted(state.rngState, entries);
  state.rngState = rngState;
  return event;
}

function maybeDrawModelEvent(state) {
  const entries = RANDOM_EVENTS
    .filter((event) => event.pool === "model" && eventIsEligible(state, event))
    .map((event) => ({
      item: event,
      weight: eventWeight(state, event) + modelMaterialBias(state, event),
    }));
  const [rngState, event] = drawWeighted(state.rngState, entries);
  state.rngState = rngState;
  return event;
}

function modelMaterialBias(state, event) {
  const material = MODEL_MATERIALS.find((item) => item.id === state.currentModelMaterialId);
  if (!material) {
    return 0;
  }
  if (event.sentiment === "negative") {
    return material.riskBias;
  }
  if (event.sentiment === "positive") {
    return -Math.floor(material.riskBias / 2);
  }
  return 0;
}

function eventIsEligible(state, event) {
  if (event.semesterMin && state.semesterIndex < event.semesterMin) return false;
  if (event.semesterMax && state.semesterIndex > event.semesterMax) return false;
  if (!event.repeatable && state.eventTally[event.id]) return false;
  const lastWeek = state.eventLastTriggeredWeek[event.id];
  if (lastWeek !== undefined && state.week - lastWeek < (event.cooldownWeeks ?? 4)) return false;
  return true;
}

function eventWeight(state, event) {
  let weight = event.baseWeight ?? 10;
  if (state.pressure > 80 && event.sentiment === "negative") {
    weight += 20;
  }
  return Math.max(0, weight);
}

function recentRandomEventWeek(state) {
  const last = state.eventHistory[state.eventHistory.length - 1];
  return last?.week ?? null;
}
