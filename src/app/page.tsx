"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Banknote,
  Brain,
  Coffee,
  Dumbbell,
  Laptop,
  Map,
  Moon,
  PanelsTopLeft,
  PenTool,
  Presentation,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

type DailyStatKey = "energy" | "pressure" | "mind" | "gpa" | "money";
type CharacterStatKey =
  | "design"
  | "software"
  | "aesthetic"
  | "presentation"
  | "resilience"
  | "socialSkill";

type GameState = Record<DailyStatKey | CharacterStatKey, number> & {
  week: number;
  actionsLeft: number;
};

type StatChange = Partial<Record<DailyStatKey | CharacterStatKey, number>>;

type ActionId =
  | "study_ai_tools"
  | "reading_exhibition_lecture"
  | "scheme_iteration"
  | "site_research"
  | "draw_normal"
  | "draw_crunch"
  | "workout"
  | "social_entertainment"
  | "rest"
  | "freelance_design"
  | "part_time_job"
  | "exclusive_skill";

type GameAction = {
  id: ActionId;
  title: string;
  description: string;
  icon: typeof Laptop;
  baseChange: StatChange;
  eventPool: string[];
};

type LogEntry = {
  id: number;
  title: string;
  body: string;
  changes: StatChange;
};

const dailyStats: { key: DailyStatKey; label: string; suffix?: string }[] = [
  { key: "energy", label: "精力" },
  { key: "pressure", label: "压力" },
  { key: "mind", label: "精神状态" },
  { key: "gpa", label: "GPA" },
  { key: "money", label: "金钱", suffix: "¥" },
];

const characterStats: { key: CharacterStatKey; label: string }[] = [
  { key: "design", label: "设计水平" },
  { key: "software", label: "软件技术" },
  { key: "aesthetic", label: "创意审美" },
  { key: "presentation", label: "汇报表达" },
  { key: "resilience", label: "抗压能力" },
  { key: "socialSkill", label: "人际交往" },
];

const initialState: GameState = {
  week: 1,
  actionsLeft: 3,
  energy: 72,
  pressure: 45,
  mind: 74,
  gpa: 3.0,
  money: 3800,
  design: 60,
  software: 52,
  aesthetic: 60,
  presentation: 55,
  resilience: 58,
  socialSkill: 50,
};

const actions: GameAction[] = [
  {
    id: "study_ai_tools",
    title: "学习AI和设计软件",
    description: "提高技术能力，提升画图效率。",
    icon: Laptop,
    baseChange: { software: 7, energy: -8, pressure: 4 },
    eventPool: [
      "你第一次发现，原来快捷键也能像肌肉记忆一样长出来。",
      "AI在屏幕上吐出一组陌生方案，你忽然有点兴奋，也有点不安。",
      "教程看到凌晨，软件终于不再像一间没有门的房子。",
    ],
  },
  {
    id: "reading_exhibition_lecture",
    title: "阅读、展览、讲座",
    description: "拓宽视野思维，提高创意审美。",
    icon: Sparkles,
    baseChange: { aesthetic: 7, presentation: 2, energy: -6, money: -80 },
    eventPool: [
      "讲座最后一页停在一张旧街区照片上，你突然明白了一点没法写进作业的东西。",
      "展厅很安静，模型里的小人永远不会毕业。",
      "你在书页边角写下一句话，后来发现它成了方案的开头。",
    ],
  },
  {
    id: "scheme_iteration",
    title: "方案推敲",
    description: "改到第八版，突然觉得第一版也不错。",
    icon: PanelsTopLeft,
    baseChange: { design: 7, aesthetic: 3, energy: -10, pressure: 6 },
    eventPool: [
      "第八版方案看起来更完整了，只是你开始怀念第一版的勇气。",
      "你盯着平面图沉默了很久，线条好像终于愿意告诉你一点秘密。",
      "同学路过看了一眼，说：这个方向好像有点东西。",
    ],
  },
  {
    id: "site_research",
    title: "场地调研",
    description: "去现场吹风，顺便思考人生。",
    icon: Map,
    baseChange: { design: 3, aesthetic: 5, mind: 3, energy: -8, money: -60 },
    eventPool: [
      "风从场地尽头吹来，你忽然觉得基地不是一张图，而是一段正在发生的生活。",
      "你拍下墙角的水痕，导师可能不会看，但你知道它很重要。",
      "回程公交上，你把城市看成了一张巨大的剖面图。",
    ],
  },
  {
    id: "draw_normal",
    title: "正常速度画图",
    description: "稳步推进，至少今晚能睡觉。",
    icon: PenTool,
    baseChange: { design: 4, software: 3, energy: -8, pressure: 2 },
    eventPool: [
      "图纸一点点变干净，今晚也许真的不用看见凌晨四点。",
      "你把轴网重新对齐，心里某个地方也跟着安静了一点。",
      "进度不算惊人，但至少它真实地向前走了。",
    ],
  },
  {
    id: "draw_crunch",
    title: "爆肝通宵赶图",
    description: "DDL是第一生产力。",
    icon: Coffee,
    baseChange: {
      design: 9,
      software: 4,
      energy: -22,
      pressure: 13,
      mind: -8,
    },
    eventPool: [
      "凌晨三点，显示器的白光像一盏审讯灯。",
      "你一边导出PDF，一边祈祷打印店今晚不要坏。",
      "天亮的时候，方案终于像个方案了，你也终于不像个人了。",
    ],
  },
  {
    id: "workout",
    title: "健身运动",
    description: "身体是革命的本钱。",
    icon: Dumbbell,
    baseChange: { energy: 8, pressure: -6, mind: 5, resilience: 3 },
    eventPool: [
      "跑步机上的数字很机械，但你的脑子终于停止旋转。",
      "出汗之后，你突然相信自己还能撑很久。",
      "身体重新回到身体里，不再只是交图工具。",
    ],
  },
  {
    id: "social_entertainment",
    title: "社交聚餐娱乐",
    description: "短暂忘记明天要评图。",
    icon: Users,
    baseChange: { mind: 7, pressure: -7, socialSkill: 4, money: -160 },
    eventPool: [
      "火锅沸腾的时候，大家短暂地不像建筑生。",
      "有人吐槽导师，有人笑到拍桌，明天的焦虑暂时坐到了隔壁桌。",
      "散场后你们走回宿舍，路灯把影子拉得很长。",
    ],
  },
  {
    id: "rest",
    title: "休养生息",
    description: "前进道路上，允许自己停下歇息。",
    icon: Moon,
    baseChange: { energy: 18, pressure: -10, mind: 8 },
    eventPool: [
      "你睡了一个没有闹钟的下午，醒来时世界没有倒塌。",
      "停下来并没有让你退步，它只是让你重新像自己。",
      "窗外的云慢慢挪过去，你第一次没有急着打开电脑。",
    ],
  },
  {
    id: "freelance_design",
    title: "接设计外包",
    description: "赚取收入，同时积累设计经验。",
    icon: Presentation,
    baseChange: {
      money: 520,
      design: 3,
      presentation: 3,
      energy: -14,
      pressure: 8,
    },
    eventPool: [
      "甲方说想要高级一点，你礼貌地点头，心里开始翻译这句话。",
      "钱到账的瞬间，疲惫突然有了比较具体的形状。",
      "你发现真实需求比课程题目更混乱，也更诚实。",
    ],
  },
  {
    id: "part_time_job",
    title: "校外兼职",
    description: "先解决生活，再谈理想。",
    icon: Banknote,
    baseChange: { money: 360, energy: -12, pressure: 3, mind: -2 },
    eventPool: [
      "下班路上，你看见同学还在Studio亮着灯。",
      "收银台的灯不浪漫，但它确实照亮了这个月的饭钱。",
      "你把工牌塞进包里，赶回学校继续改图。",
    ],
  },
  {
    id: "exclusive_skill",
    title: "专属技能",
    description: "身份不同，技能不同。",
    icon: Activity,
    baseChange: { design: 3, resilience: 4, mind: 2, energy: -7 },
    eventPool: [
      "你用自己的方式解决了问题，那是角色底色里长出来的能力。",
      "有些路不是更轻松，只是更像你会走的路。",
      "这一刻，你的出身、习惯和选择短暂地站到了一起。",
    ],
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const randomWave = (amount: number) => {
  if (amount === 0) return 0;
  const wave = Math.floor(Math.random() * 3) - 1;
  return amount > 0 ? amount + wave : amount - wave;
};

const formatChange = (changes: StatChange) =>
  Object.entries(changes)
    .map(([key, value]) => {
      const label =
        dailyStats.find((stat) => stat.key === key)?.label ??
        characterStats.find((stat) => stat.key === key)?.label ??
        key;
      const prefix = value && value > 0 ? "+" : "";
      return `${label} ${prefix}${value}`;
    })
    .join(" / ");

const applyChanges = (state: GameState, changes: StatChange): GameState => {
  const next = { ...state };
  for (const [key, rawValue] of Object.entries(changes)) {
    const value = rawValue ?? 0;
    if (key === "gpa") {
      next.gpa = clamp(Number((next.gpa + value).toFixed(2)), 0, 4);
      continue;
    }
    if (key === "money") {
      next.money = Math.round(next.money + value);
      continue;
    }
    const statKey = key as Exclude<keyof GameState, "week" | "actionsLeft">;
    next[statKey] = clamp(Math.round(next[statKey] + value), 0, 100);
  }
  return next;
};

const buildSoftLimitChanges = (state: GameState, action: GameAction) => {
  const changes: StatChange = {};
  for (const [key, value] of Object.entries(action.baseChange)) {
    changes[key as keyof StatChange] =
      typeof value === "number" ? randomWave(value) : value;
  }

  if (state.energy < 25) {
    changes.pressure = (changes.pressure ?? 0) + 4;
    changes.mind = (changes.mind ?? 0) - 3;
    for (const key of characterStats.map((stat) => stat.key)) {
      if (changes[key] && changes[key]! > 0) {
        changes[key] = Math.max(1, Math.floor(changes[key]! * 0.65));
      }
    }
  }

  if (state.money < 300) {
    changes.pressure = (changes.pressure ?? 0) + 3;
  }

  if (state.mind < 25) {
    changes.energy = (changes.energy ?? 0) - 3;
    changes.pressure = (changes.pressure ?? 0) + 2;
  }

  return changes;
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      title: "第1周开始",
      body: "Studio的灯刚刚亮起。你还有三次行动机会，足够做一点事，也足够留下遗憾。",
      changes: {},
    },
  ]);

  const dangerNotes = useMemo(() => {
    const notes: string[] = [];
    if (gameState.pressure >= 80) notes.push("压力过载");
    if (gameState.mind <= 30) notes.push("精神状态危险");
    if (gameState.energy <= 25) notes.push("精力枯竭");
    if (gameState.money < 300) notes.push("金钱紧张");
    return notes;
  }, [gameState]);

  const performAction = (action: GameAction) => {
    if (gameState.actionsLeft <= 0) return;

    const changes = buildSoftLimitChanges(gameState, action);
    const eventText =
      action.eventPool[Math.floor(Math.random() * action.eventPool.length)];
    const nextState = applyChanges(
      { ...gameState, actionsLeft: gameState.actionsLeft - 1 },
      changes,
    );

    setGameState(nextState);
    setLogs((current) => [
      {
        id: Date.now(),
        title: action.title,
        body: eventText,
        changes,
      },
      ...current,
    ]);
  };

  const settleWeek = () => {
    const pressureDamage =
      gameState.pressure > 70 ? -Math.round((gameState.pressure - 70) / 4) : 0;
    const exhaustionDamage =
      gameState.energy < 30 ? -Math.round((30 - gameState.energy) / 5) : 0;
    const recovery = gameState.pressure < 45 ? 3 : 0;
    const changes: StatChange = {
      mind: pressureDamage + exhaustionDamage + recovery,
      gpa: gameState.gpa < 2.2 ? -0.03 : 0.02,
      pressure: gameState.actionsLeft > 0 ? -2 : 1,
    };

    const nextState = applyChanges(
      {
        ...gameState,
        week: gameState.week + 1,
        actionsLeft: 3,
      },
      changes,
    );

    setGameState(nextState);
    setLogs((current) => [
      {
        id: Date.now(),
        title: `第${gameState.week}周结算`,
        body:
          changes.mind && changes.mind < 0
            ? "这一周没有突然崩塌，只是某些疲惫悄悄留在了身体里。"
            : "你把这一周折好，夹进草图本。下一周又来了。",
        changes,
      },
      ...current,
    ]);
  };

  const resetGame = () => {
    setGameState(initialState);
    setLogs([
      {
        id: 1,
        title: "第1周开始",
        body: "Studio的灯刚刚亮起。你还有三次行动机会，足够做一点事，也足够留下遗憾。",
        changes: {},
      },
    ]);
  };

  return (
    <main className="min-h-screen px-5 py-5 text-[#151515] lg:px-8">
      <section className="mx-auto grid max-w-[1500px] gap-5">
        <header className="border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-4 shadow-[0_24px_70px_rgba(38,31,18,0.11)] backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                The Twenty-Fifth Hour
              </p>
              <h1 className="mt-2 text-3xl font-semibold md:text-5xl">
                第二十五小时
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-muted)] md:text-base">
                黄色的树林里不止分出两条路。你的选择是什么呢，少年？
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5 xl:min-w-[660px]">
              {dailyStats.map((stat) => (
                <StatTile
                  key={stat.key}
                  label={stat.label}
                  value={gameState[stat.key]}
                  suffix={stat.suffix}
                  danger={
                    (stat.key === "pressure" && gameState.pressure >= 80) ||
                    (stat.key === "energy" && gameState.energy <= 25) ||
                    (stat.key === "mind" && gameState.mind <= 30) ||
                    (stat.key === "money" && gameState.money < 300)
                  }
                />
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <section className="grid gap-5">
            <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
              <aside className="border border-[var(--line)] bg-[var(--paper)] p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      Week
                    </p>
                    <h2 className="mt-1 text-3xl font-semibold">
                      第 {gameState.week} 周
                    </h2>
                  </div>
                  <div className="border border-[var(--line)] px-3 py-2 text-center">
                    <p className="text-xs text-[var(--ink-muted)]">行动</p>
                    <p className="text-2xl font-semibold">
                      {gameState.actionsLeft}/3
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-px bg-[var(--line)]" />

                <div className="mt-5 space-y-3">
                  <h3 className="text-sm font-semibold">角色长期属性</h3>
                  {characterStats.map((stat) => (
                    <Meter
                      key={stat.key}
                      label={stat.label}
                      value={gameState[stat.key]}
                    />
                  ))}
                </div>

                <div className="mt-5 space-y-2">
                  <button
                    className="w-full border border-[#151515] bg-[#151515] px-4 py-3 text-sm text-[#fffaf0] transition hover:bg-[var(--warning)]"
                    onClick={settleWeek}
                  >
                    结束本周
                  </button>
                  <button
                    className="w-full border border-[var(--line-strong)] bg-transparent px-4 py-3 text-sm transition hover:bg-[#fffaf0]"
                    onClick={resetGame}
                  >
                    重新开始
                  </button>
                </div>

                {dangerNotes.length > 0 && (
                  <div className="mt-5 border border-[rgba(183,55,47,0.38)] bg-[rgba(183,55,47,0.08)] p-3 text-sm text-[var(--warning)]">
                    {dangerNotes.join(" / ")}
                  </div>
                )}
              </aside>

              <section className="border border-[var(--line)] bg-[rgba(255,250,240,0.6)] p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                      Actions
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">行动栏</h2>
                  </div>
                  <p className="text-sm text-[var(--ink-muted)]">
                    每周只能选择三次。每次选择都会留下痕迹。
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {actions.map((action, index) => (
                    <ActionButton
                      key={action.id}
                      action={action}
                      index={index}
                      disabled={gameState.actionsLeft <= 0}
                      onClick={() => performAction(action)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </section>

          <aside className="border border-[var(--line)] bg-[var(--paper)] p-4 backdrop-blur">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Studio Log
                </p>
                <h2 className="mt-1 text-2xl font-semibold">事件记录</h2>
              </div>
            </div>

            <div className="mt-4 max-h-[720px] space-y-3 overflow-auto pr-1">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.article
                    key={log.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="border border-[var(--line)] bg-[#fffaf0] p-4"
                  >
                    <h3 className="text-base font-semibold">{log.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--ink-muted)]">
                      {log.body}
                    </p>
                    {Object.keys(log.changes).length > 0 && (
                      <p className="mt-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--warning)]">
                        {formatChange(log.changes)}
                      </p>
                    )}
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatTile({
  label,
  value,
  suffix,
  danger,
}: {
  label: string;
  value: number;
  suffix?: string;
  danger?: boolean;
}) {
  const display = suffix === "¥" ? `${suffix}${Math.round(value)}` : value;

  return (
    <div
      className={`border px-3 py-3 ${
        danger
          ? "border-[rgba(183,55,47,0.54)] bg-[rgba(183,55,47,0.1)]"
          : "border-[var(--line)] bg-[#fffaf0]"
      }`}
    >
      <p className="text-xs text-[var(--ink-muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{display}</p>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--ink-muted)]">{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-1.5 bg-[rgba(21,21,21,0.1)]">
        <div
          className="h-full bg-[#151515]"
          style={{ width: `${clamp(value, 0, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  action,
  index,
  disabled,
  onClick,
}: {
  action: GameAction;
  index: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = action.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      whileHover={disabled ? undefined : { y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      className="group min-h-[142px] border border-[var(--line)] bg-[#fffaf0] p-4 text-left transition hover:border-[#151515] hover:shadow-[0_18px_40px_rgba(38,31,18,0.12)] disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <Icon
          size={21}
          strokeWidth={1.6}
          className="mt-0.5 text-[var(--blueprint)] transition group-hover:text-[var(--warning)]"
        />
        <span className="text-xs text-[var(--ink-muted)]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold leading-snug">
        {action.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
        {action.description}
      </p>
    </motion.button>
  );
}
