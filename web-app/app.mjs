import { createGame, reviveState } from "./game/state.mjs";
import {
  answerCourseQuestion,
  chooseFixedEventOption,
  chooseModelMaterial,
  chooseProject,
  chooseReportStrategy,
  chooseSummerEventOption,
  continueAfterWeeklyEvents,
  confirmCourseResult,
  confirmRandomEvent,
  confirmReportFeedback,
  confirmReviewResult,
  finishWeek,
  beginCourseExam,
  performAction,
  rerollCharacters,
  selectCharacter,
  selectCourse,
  selectMentor,
  confirmYearStart,
} from "./game/commands.mjs";
import { toViewModel } from "./game/view-model.mjs";
import { renderGame, renderLoading, renderStart } from "./ui/render.mjs";

const SAVE_KEY = "twenty-fifth-hour-docs-core-v1";
const THEME_KEY = "twenty-fifth-hour-theme";

const app = document.querySelector("#app");
let state = loadSave();
let bootReady = false;
let startMode = "menu";
let uiDialog = null;
let theme = localStorage.getItem(THEME_KEY) || "dark";
let settingsOpen = false;
let lyrics = [];
let currentClock = formatClock(new Date());
const musicState = {
  trackId: "",
  src: "",
  currentTime: 0,
  paused: true,
  volume: 1,
  playbackRate: 1,
  manual: false,
};

document.documentElement.dataset.theme = theme;

render();
setTimeout(() => {
  bootReady = true;
  render();
}, 520);

setInterval(() => {
  currentClock = formatClock(new Date());
  if (bootReady && !state) {
    updateClock();
  }
}, 1000);

function render() {
  captureAudioState();
  if (!bootReady) {
    app.innerHTML = renderLoading();
    return;
  }
  app.innerHTML = state
    ? renderGame(toViewModel(state), { theme, uiDialog, settingsOpen })
    : renderStart({ hasSave: Boolean(localStorage.getItem(SAVE_KEY)), startMode, theme, uiDialog, currentClock });
  restoreAudioState();
  updateClock();
}

app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form='start']");
  if (!form) return;
  event.preventDefault();
  const formData = new FormData(form);
  state = createGame({
    nickname: formData.get("nickname"),
    universityName: formData.get("universityName"),
    seed: formData.get("seed"),
  });
  startMode = "menu";
  saveState();
  render();
});

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-command]");
  if (!target) return;

  const command = target.dataset.command;
  const id = target.dataset.id;
  let result = { ok: true };

  if (command === "show-start-form") {
    startMode = "profile";
    render();
    return;
  }
  if (command === "close-start-form") {
    startMode = "menu";
    render();
    return;
  }
  if (command === "ui-dialog") {
    uiDialog = id;
    render();
    return;
  }
  if (command === "toggle-settings") {
    settingsOpen = !settingsOpen;
    render();
    return;
  }
  if (command === "close-ui-dialog") {
    uiDialog = null;
    render();
    return;
  }
  if (command === "set-theme") {
    theme = id === "light" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    render();
    return;
  }
  if (command === "toggle-theme") {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    render();
    return;
  }
  if (command === "load-save") {
    state = loadSave();
    render();
    return;
  }
  if (command === "new-game") {
    state = null;
    localStorage.removeItem(SAVE_KEY);
    render();
    return;
  }
  if (command === "save") {
    saveState();
    render();
    return;
  }

  if (!state) return;

  switch (command) {
    case "reroll":
      result = rerollCharacters(state);
      break;
    case "select-character":
      result = selectCharacter(state, id);
      break;
    case "perform-action":
      result = performAction(state, id);
      break;
    case "finish-week":
      result = finishWeek(state);
      break;
    case "modal-option":
      result = handleModalOption(id);
      break;
    default:
      result = { ok: false, reason: "unknown_command" };
  }

  if (!result.ok) {
    console.warn("Command rejected", result);
  }
  autoProgress();
  saveState();
  render();
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-music='audio']")) {
    const file = target.files?.[0];
    const audio = app.querySelector("[data-audio-player]");
    if (file && audio) {
      musicState.trackId = audio.dataset.trackId || musicState.trackId;
      musicState.src = URL.createObjectURL(file);
      musicState.currentTime = 0;
      musicState.paused = false;
      musicState.manual = true;
      audio.src = musicState.src;
      audio.play().catch(() => {});
      setMusicStatus(`正在播放本地文件：${file.name}`);
    }
  }
  if (target.matches("[data-music='lrc']")) {
    const file = target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      lyrics = parseLrc(text);
      updateLyric(0);
    });
  }
});

app.addEventListener("timeupdate", (event) => {
  if (event.target.matches("[data-audio-player]")) {
    updateLyric(event.target.currentTime);
  }
});

function handleModalOption(id) {
  const interaction = state.pendingInteraction;
  if (!interaction) {
    return { ok: false, reason: "no_pending_interaction" };
  }

  switch (interaction.type) {
    case "fixed_event":
      return chooseFixedEventOption(state, id);
    case "mentor_select":
      return selectMentor(state, id);
    case "course_select":
      return selectCourse(state, id);
    case "course_exam_intro":
      return beginCourseExam(state);
    case "model_material":
      return chooseModelMaterial(state, id);
    case "random_event":
      return confirmRandomEvent(state, id);
    case "project_select":
      return chooseProject(state, id);
    case "course_question":
      return answerCourseQuestion(state, id);
    case "course_result":
      return confirmCourseResult(state);
    case "report_strategy":
      return chooseReportStrategy(state, id);
    case "report_feedback":
      return confirmReportFeedback(state);
    case "review_result":
      return confirmReviewResult(state);
    case "summer_event":
      return chooseSummerEventOption(state, id);
    case "year_start":
      return confirmYearStart(state);
    case "choice_result":
      state.pendingInteraction = state.modalQueue.shift() ?? null;
      return state.pendingInteraction || state.phase !== "week_settlement" ? { ok: true } : continueAfterWeeklyEvents(state);
    default:
      return { ok: false, reason: "unsupported_interaction" };
  }
}

function autoProgress() {
  if (!state) return;
  let guard = 0;
  while (!state.pendingInteraction && !state.ending && guard < 12) {
    guard += 1;
    if (state.phase === "week_action" && state.actionsRemaining <= 0) {
      const result = finishWeek(state);
      if (!result.ok) return;
      continue;
    }
    if (state.phase === "week_settlement") {
      const result = continueAfterWeeklyEvents(state);
      if (!result.ok) return;
      continue;
    }
    return;
  }
}

function saveState() {
  if (!state) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return reviveState(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to load save", error);
    return null;
  }
}

function parseLrc(text) {
  return text
    .split(/\r?\n/)
    .flatMap((line) => {
      const matches = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
      const lyric = line.replace(/\[[^\]]+\]/g, "").trim();
      return matches.map((match) => ({
        time: Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] ?? 0}`),
        text: lyric,
      }));
    })
    .filter((line) => line.text)
    .sort((a, b) => a.time - b.time);
}

function updateLyric(currentTime) {
  const target = app.querySelector("[data-current-lyric]");
  if (!target) return;
  if (target.classList.contains("is-hidden")) {
    target.innerHTML = "";
    return;
  }
  const index = findLyricIndex(currentTime);
  const lines = index >= 0 ? lyrics.slice(index, index + 2) : [];
  target.innerHTML = lines.length
    ? lines.map((line) => `<span>${escapeHtml(line.text)}</span>`).join("")
    : "";
}

function findLyricIndex(currentTime) {
  let index = -1;
  for (let i = 0; i < lyrics.length; i += 1) {
    if (lyrics[i].time <= currentTime) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}

function captureAudioState() {
  const audio = app?.querySelector("[data-audio-player]");
  if (!audio) return;
  if (audio.src) musicState.src = audio.src;
  musicState.currentTime = audio.currentTime || musicState.currentTime;
  musicState.paused = audio.paused;
  musicState.volume = audio.volume;
  musicState.playbackRate = audio.playbackRate;
}

function restoreAudioState() {
  const audio = app?.querySelector("[data-audio-player]");
  if (!audio) return;
  const trackId = audio.dataset.trackId || "";
  const trackSrc = audio.dataset.trackSrc || "";
  if (trackId && trackId !== musicState.trackId) {
    musicState.trackId = trackId;
    musicState.src = "";
    musicState.currentTime = 0;
    musicState.paused = true;
    musicState.manual = false;
    lyrics = [];
  }
  audio.volume = musicState.volume;
  audio.playbackRate = musicState.playbackRate;
  if (musicState.manual && musicState.src) {
    audio.src = musicState.src;
    restoreAudioPlayback(audio);
    return;
  }
  if (!trackSrc) {
    setMusicStatus("当前曲目没有配置音频路径");
    return;
  }
  ensureTrackAsset(audio, trackSrc);
}

function restoreAudioPlayback(audio) {
  audio.volume = musicState.volume;
  audio.playbackRate = musicState.playbackRate;
  if (Number.isFinite(musicState.currentTime)) {
    audio.currentTime = musicState.currentTime;
  }
  updateLyric(musicState.currentTime);
  if (!musicState.paused) {
    audio.play().catch(() => {});
  }
}

function ensureTrackAsset(audio, src) {
  if (musicState.src === src && audio.src) {
    restoreAudioPlayback(audio);
    return;
  }
  fetch(src, { method: "HEAD" })
    .then((response) => {
      if (!response.ok) {
        musicState.src = "";
        audio.removeAttribute("src");
        setMusicStatus("音乐资源待上传，可先选择本地 MP3 测试");
        return;
      }
      musicState.src = src;
      audio.src = src;
      audio.load();
      setMusicStatus("已加载当前阶段对应曲目");
      loadTrackLyrics(audio.dataset.lyricsSrc, audio.dataset.allowsLyrics === "true");
    })
    .catch(() => {
      setMusicStatus("音乐资源待上传，可先选择本地 MP3 测试");
    });
}

function loadTrackLyrics(src, allowsLyrics) {
  if (!allowsLyrics || !src) {
    lyrics = [];
    updateLyric(0);
    return;
  }
  fetch(src)
    .then((response) => (response.ok ? response.text() : ""))
    .then((text) => {
      lyrics = text ? parseLrc(text) : [];
      updateLyric(musicState.currentTime);
    })
    .catch(() => {
      lyrics = [];
      updateLyric(0);
    });
}

function setMusicStatus(text) {
  const target = app.querySelector("[data-music-status]");
  if (target) {
    target.textContent = text;
  }
}

function updateClock() {
  const target = app.querySelector("[data-current-clock]");
  if (target) {
    target.textContent = currentClock;
  }
}

function formatClock(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
