import { ATTRIBUTE_LABELS } from "../game/data.mjs";

const START_MENU = [
  ["show-start-form", "", "开始新游戏"],
  ["load-save", "", "继续上次游戏"],
  ["ui-dialog", "announcement", "公告"],
  ["ui-dialog", "author", "作者的话"],
  ["ui-dialog", "coffee", "请作者喝咖啡续命"],
  ["ui-dialog", "theme", "主题背景"],
  ["ui-dialog", "community", "建院社区"],
  ["ui-dialog", "leaderboard", "玩家排行榜"],
  ["ui-dialog", "achievements", "结局与成就"],
  ["ui-dialog", "language", "显示语言"],
];

const GAME_SETTINGS = [
  ["ui-dialog", "announcement", "公告"],
  ["ui-dialog", "guide", "介绍与引导"],
  ["ui-dialog", "theme", "主题背景"],
  ["ui-dialog", "leaderboard", "玩家排行榜"],
  ["ui-dialog", "achievements", "结局与成就"],
  ["new-game", "", "放弃学业重新开始"],
  ["ui-dialog", "author", "作者的话"],
  ["ui-dialog", "coffee", "请作者喝咖啡续命"],
  ["ui-dialog", "community", "建院社区"],
  ["ui-dialog", "language", "显示语言"],
];

export function renderLoading() {
  return `
    <main class="loading-shell">
      <section class="loading-panel" aria-live="polite">
        <p class="kicker">SERVER / RENDER / WAIT</p>
        <h1>第二十五小时</h1>
        <p>正在载入你的五年建筑生生涯，请稍候——别急，画图也是从等渲染开始的。</p>
        <div class="loading-bar" aria-hidden="true"><span></span></div>
      </section>
    </main>
  `;
}

export function renderStart({ hasSave, startMode, theme, uiDialog, currentClock }) {
  const menu = START_MENU.map(([command, id, label]) => {
    const disabled = command === "load-save" && !hasSave;
    return `<button class="pixel-button ${command === "show-start-form" ? "is-primary" : ""}" type="button" data-command="${command}" ${id ? `data-id="${id}"` : ""} ${disabled ? "disabled" : ""}>${label}</button>`;
  }).join("");

  return `
    <main class="start-shell">
      <section class="start-hero" aria-labelledby="start-title">
        <div class="hero-copy">
          <p class="kicker">建筑生人生模拟器 · 粗 UI 可玩版</p>
          <div class="title-stack">
            <h1 id="start-title">第二十五小时</h1>
            <strong>建筑生模拟器</strong>
          </div>
          <p class="english-line">THE 25TH HOUR · ARCHITECTURE STUDENT SIMULATOR</p>
          <div class="intro-box">
            <p>从大一开学到大五答辩，你要在精力、压力、金钱、课程、评图和随机事件之间做选择。每周行动会改变作品、属性和未来结局。</p>
          </div>
          <div class="start-meta">
            <p class="theme-chip">主题背景：${theme === "dark" ? "深色模式" : "浅色模式"}</p>
            <p class="theme-chip">真实时间：<span data-current-clock>${escapeHtml(currentClock)}</span></p>
          </div>
        </div>
        <div class="start-panel">
          ${startMode === "profile" ? renderStartForm() : `<div class="menu-grid">${menu}</div>`}
        </div>
      </section>
      ${renderUiDialog(uiDialog)}
    </main>
  `;
}

export function renderGame(vm, { theme, uiDialog, settingsOpen }) {
  if (vm.phase === "character_select") {
    return renderCharacterSelect(vm, uiDialog);
  }

  return `
    <main class="game-shell risk-${vm.risk.level}">
      <aside class="sidebar">
        <div class="brand-lockup">
          <span class="brand-mark" aria-hidden="true"></span>
          <div>
            <p>第二十五小时</p>
            <strong>${escapeHtml(vm.profile.nickname)}</strong>
          </div>
        </div>

        <div class="profile-card">
          <span>${escapeHtml(vm.profile.universityName)}</span>
          <strong>${escapeHtml(vm.profile.characterName)}</strong>
          <p>${escapeHtml(vm.profile.education)} · ${escapeHtml(vm.profile.family)}</p>
        </div>

        <dl class="side-facts">
          <div><dt>导师</dt><dd>${escapeHtml(vm.profile.mentor)}</dd></div>
          <div><dt>课程</dt><dd>${escapeHtml(vm.profile.course)}</dd></div>
          <div><dt>课题</dt><dd>${escapeHtml(vm.calendar.topic)}</dd></div>
          <div><dt>Seed</dt><dd>${vm.seed}</dd></div>
        </dl>

        <div class="music-dock">
          <div class="section-head compact"><h2>音乐</h2><span>${escapeHtml(vm.music.kind)}</span></div>
          <div class="track-card">
            <strong>${escapeHtml(vm.music.title)}</strong>
            <span>${escapeHtml(vm.music.artist)} · ${escapeHtml(vm.music.placeholder)}</span>
          </div>
          <audio data-audio-player data-track-id="${escapeHtml(vm.music.id)}" data-track-src="${escapeHtml(vm.music.src)}" data-lyrics-src="${escapeHtml(vm.music.lyricsSrc)}" data-allows-lyrics="${vm.music.allowsLyrics ? "true" : "false"}" controls></audio>
          <label class="file-button">选择 MP3<input data-music="audio" type="file" accept="audio/mpeg,audio/*" /></label>
          ${vm.music.allowsLyrics ? `<label class="file-button">选择 LRC<input data-music="lrc" type="file" accept=".lrc,text/plain" /></label>` : ""}
          <p class="lyric-line ${vm.music.allowsLyrics ? "" : "is-hidden"}" data-current-lyric></p>
          <p class="music-status" data-music-status>正在检查音乐资源</p>
        </div>

        <div class="settings-panel">
          <div class="section-head compact"><h2>设置</h2><span>${theme === "dark" ? "深" : "浅"}</span></div>
          <button class="mini-button settings-toggle" type="button" data-command="toggle-settings">${settingsOpen ? "收起设置" : "打开设置"}</button>
          ${settingsOpen ? `
            <div class="settings-grid">
              ${GAME_SETTINGS.map(([command, id, label]) => `<button class="mini-button" type="button" data-command="${command}" ${id ? `data-id="${id}"` : ""}>${label}</button>`).join("")}
            </div>
          ` : ""}
        </div>
      </aside>

      <section class="main-panel">
        <header class="topbar">
          <div>
            <p class="kicker">${escapeHtml(vm.calendar.semester)} · 第 ${vm.calendar.weekInSemester || 1} 周</p>
            <h1>${escapeHtml(vm.title)}</h1>
            <p>${escapeHtml(vm.subtitle)}</p>
          </div>
          <div class="topbar-actions">
            <span class="auto-chip">行动用完自动进下一周</span>
          </div>
        </header>

        ${renderRisk(vm)}
        ${vm.ending ? renderEnding(vm) : ""}

        <section class="status-grid" aria-label="状态">
          <div class="status-board">
            ${vm.meters.map(renderMeter).join("")}
            ${vm.metrics.map(renderMetric).join("")}
          </div>
          <div class="attribute-panel">
            <div class="section-head compact">
              <h2>六项属性</h2>
              <span>0-100</span>
            </div>
            <div class="attribute-grid">
              ${vm.attributes.map(renderAttribute).join("")}
            </div>
          </div>
        </section>

        ${vm.ending ? "" : renderActions(vm)}

        <section class="records-layout">
          <div class="record-panel">
            <div class="section-head compact">
              <h2>最近日志</h2>
              <span>${vm.logs.length}</span>
            </div>
            <ol class="log-list">
              ${vm.logs.map(renderLog).join("") || `<li class="empty-text">暂无日志</li>`}
            </ol>
          </div>
          <div class="record-panel">
            <div class="section-head compact">
              <h2>评图记录</h2>
              <span>${vm.reviews.length}</span>
            </div>
            <div class="review-list">
              ${vm.reviews.map(renderReview).join("") || `<p class="empty-text">还没有评图。</p>`}
            </div>
          </div>
        </section>
      </section>
      ${renderModal(vm.pendingInteraction)}
      ${renderUiDialog(uiDialog)}
    </main>
  `;
}

function renderStartForm() {
  return `
    <form class="profile-form" data-form="start">
      <label class="field">
        <span>你的名字</span>
        <input name="nickname" required maxlength="18" autocomplete="nickname" />
      </label>
      <label class="field">
        <span>大学名字</span>
        <input name="universityName" required maxlength="24" />
      </label>
      <label class="field">
        <span>随机种子</span>
        <input name="seed" required inputmode="numeric" pattern="[0-9]*" value="25" />
      </label>
      <div class="start-actions">
        <button class="pixel-button is-primary" type="submit">进入角色抽取</button>
        <button class="pixel-button" type="button" data-command="close-start-form">返回开始界面</button>
      </div>
    </form>
  `;
}

function renderCharacterSelect(vm, uiDialog) {
  return `
    <main class="character-shell">
      <header class="character-header">
        <div>
          <p class="kicker">${escapeHtml(vm.profile.nickname)} · ${escapeHtml(vm.profile.universityName)}</p>
          <h1>${escapeHtml(vm.title)}</h1>
          <p>${escapeHtml(vm.subtitle)} 角色抽取完成后，将先抽取第一学年的导师。</p>
        </div>
        <div class="topbar-actions">
          <button class="pixel-button" type="button" data-command="reroll" ${vm.canReroll ? "" : "disabled"}>重抽角色 ${vm.rerollsRemaining}</button>
          <button class="pixel-button" type="button" data-command="new-game">返回开局</button>
        </div>
      </header>
      <section class="character-grid">
        ${vm.characterCandidates.map(renderCharacterCard).join("")}
      </section>
      ${renderUiDialog(uiDialog)}
    </main>
  `;
}

function renderCharacterCard(character) {
  return `
    <article class="character-card">
      <div>
        <span>${escapeHtml(character.education)} · ${escapeHtml(character.family)}</span>
        <h2>${escapeHtml(character.name)}</h2>
        <p>${escapeHtml(character.intro)}</p>
      </div>
      <dl class="mini-attrs">
        ${Object.entries(character.attributes).map(([key, value]) => `<div><dt>${ATTRIBUTE_LABELS[key]}</dt><dd>${value}</dd></div>`).join("")}
      </dl>
      <div class="trait-block">
        <p>${escapeHtml(character.passive)}</p>
        <p>${escapeHtml(character.skill)}</p>
      </div>
      <button class="pixel-button is-primary" type="button" data-command="select-character" data-id="${character.id}">选择这个角色</button>
    </article>
  `;
}

function renderRisk(vm) {
  if (vm.risk.messages.length === 0) return "";
  return `
    <section class="risk-banner" role="status">
      ${vm.risk.messages.map((message) => `<p>${escapeHtml(message)}</p>`).join("")}
    </section>
  `;
}

function renderMeter(meter) {
  const percent = Math.round(meter.ratio * 100);
  return `
    <div class="meter-card meter-${meter.id}">
      <div class="meter-head">
        <span>${escapeHtml(meter.label)}</span>
        <strong>${meter.value} / ${meter.max}</strong>
      </div>
      <div class="meter-track">
        <span style="inline-size:${percent}%"></span>
      </div>
    </div>
  `;
}

function renderMetric(metric) {
  return `
    <div class="metric-card">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${escapeHtml(String(metric.value))}</strong>
    </div>
  `;
}

function renderAttribute(attribute) {
  return `
    <div class="attribute-row">
      <span>${escapeHtml(attribute.label)}</span>
      <strong>${attribute.value}</strong>
      <div><span style="inline-size:${attribute.value}%"></span></div>
    </div>
  `;
}

function renderActions(vm) {
  return `
    <section class="action-section">
      <div class="section-head compact">
        <h2>本周行动</h2>
        <span>${vm.calendar.actionsRemaining} / ${vm.calendar.actionsPerWeek}</span>
      </div>
      <div class="action-groups">
        ${vm.actions.map(renderActionGroup).join("")}
      </div>
    </section>
  `;
}

function renderActionGroup(group) {
  return `
    <div class="action-group">
      <h3>${escapeHtml(group.name)}</h3>
      <div class="action-grid">
        ${group.actions.map(renderActionButton).join("")}
      </div>
    </div>
  `;
}

function renderActionButton(action) {
  const disabled = action.state !== "available" && !action.canInspect;
  return `
    <button class="action-button action-${action.state}" type="button" data-command="perform-action" data-id="${action.id}" ${disabled ? "disabled" : ""}>
      <strong>${escapeHtml(action.label)}</strong>
      <span>${escapeHtml(disabled ? action.reason : action.preview)}</span>
    </button>
  `;
}

function renderLog(log) {
  return `
    <li>
      <span>第 ${log.week || 0} 周 · ${escapeHtml(log.phase)}</span>
      <p>${escapeHtml(log.message)}</p>
      <em>${escapeHtml(formatDelta(log.delta))}</em>
    </li>
  `;
}

function renderReview(review) {
  return `
    <article class="review-item">
      <strong>${review.year}年级${review.term === 1 ? "上" : "下"} · ${review.finalGrade}</strong>
      <p>作品分 ${review.finalScore}，GPA ${review.semesterGpa.toFixed(2)}，作品集 +${review.portfolioAdded}</p>
    </article>
  `;
}

function renderEnding(vm) {
  return `
    <section class="ending-panel">
      <h2>${escapeHtml(vm.ending.title)}</h2>
      <p>${escapeHtml(vm.ending.body)}</p>
    </section>
  `;
}

function renderModal(interaction) {
  if (!interaction) return "";
  const modalClass = interaction.type === "random_event" ? "modal-card event-card" : "modal-card";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="${modalClass}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-copy">
          <p class="kicker">${modalKicker(interaction.type)}</p>
          <h2 id="modal-title">${escapeHtml(interaction.title)}</h2>
          ${escapeHtml(interaction.body).split("\n").map((line) => `<p>${line}</p>`).join("")}
        </div>
        <div class="modal-options">
          ${interaction.options.map((option) => renderModalOption(interaction, option)).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderModalOption(interaction, option) {
  const disabled = option.state === "disabled" && interaction.type !== "project_select";
  const showBody = !["fixed_event", "random_event", "summer_event"].includes(interaction.type);
  return `
    <button class="modal-option option-${option.state}" type="button" data-command="modal-option" data-modal-type="${interaction.type}" data-id="${option.id}" ${disabled ? "disabled" : ""}>
      <strong>${escapeHtml(option.label)}</strong>
      ${showBody && option.body ? `<span>${escapeHtml(option.body)}</span>` : ""}
      ${disabled && option.reason ? `<em>${escapeHtml(option.reason)}</em>` : ""}
    </button>
  `;
}

function renderUiDialog(id) {
  if (!id) return "";
  if (id === "theme") {
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal-card slim" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
          <div class="modal-copy">
            <p class="kicker">SYSTEM PANEL</p>
            <h2 id="ui-dialog-title">主题背景</h2>
            <p>选择更适合当前环境的显示背景。</p>
          </div>
          <div class="theme-options">
            <button class="pixel-button is-primary" type="button" data-command="set-theme" data-id="dark">深色模式</button>
            <button class="pixel-button" type="button" data-command="set-theme" data-id="light">浅色模式</button>
          </div>
          <button class="pixel-button" type="button" data-command="close-ui-dialog">关闭</button>
        </section>
      </div>
    `;
  }
  const content = {
    announcement: ["公告", "欢迎来到《第二十五小时》。当前版本重点补齐开局、行动、课程、事件、音乐字幕和基础系统入口；后续会继续打磨美术、路线和结局展示。"],
    author: ["作者的话", "这版先把粗 UI 当成施工脚手架：不追求漂亮到位，但每个入口、流程、按钮和日志都尽量留住，方便后续精 UI 接管。"],
    coffee: ["请作者喝咖啡续命", "粗 UI 阶段先放赞助占位。正式版可以接二维码、鸣谢名单或一段很建筑生的续命文案。"],
    community: ["建院社区", "预留社区入口：后续可以放交流群、投稿入口、玩家建筑生故事墙。"],
    leaderboard: ["玩家排行榜", "首版目标是总分榜 Top 100、我的排名、昵称 / 大学名称 / 总分。当前粗 UI 先保留入口。"],
    achievements: ["结局与成就", "这里会展示已解锁结局、成长成就、重复达成记录和本地总分。"],
    language: ["显示语言", "当前只实现中文。这里预留简体中文、繁体中文、英文等显示语言切换。"],
    guide: ["介绍与引导", "核心循环：每学期选导师和课程，每周用完行动自动进入结算，随机事件在行动结束后阻塞弹出，学期末考试和评图。"],
  }[id] ?? ["提示", "功能预留中。"];

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal-card slim" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
        <div class="modal-copy">
          <p class="kicker">SYSTEM PANEL</p>
          <h2 id="ui-dialog-title">${content[0]}</h2>
          <p>${content[1]}</p>
        </div>
        <button class="pixel-button is-primary" type="button" data-command="close-ui-dialog">确定</button>
      </section>
    </div>
  `;
}

function modalKicker(type) {
  const labels = {
    fixed_event: "固定流程",
    mentor_select: "导师选择",
    course_select: "课程选择",
    course_exam_intro: "课程期末考试",
    model_material: "强制流程",
    random_event: "随机事件",
    project_select: "项目选择",
    course_question: "课程题",
    course_result: "课程结算",
    report_strategy: "评图阶段",
    report_feedback: "汇报反馈",
    review_result: "评图结果",
    summer_event: "暑假写生",
    year_start: "学年开始",
    choice_result: "数值结算",
  };
  return labels[type] ?? "流程";
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
  const parts = Object.entries(delta ?? {}).map(([key, value]) => `${labels[key] ?? key} ${value > 0 ? "+" : ""}${value}`);
  return parts.length ? parts.join("，") : "无数值变化";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
