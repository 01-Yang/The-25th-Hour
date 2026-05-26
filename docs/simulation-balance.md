# 跑局模拟与调参基线

最后更新时间：`2026-05-26 +08:00`

本文记录已经用 headless simulator 跑通的阶段性结论，方便之后改数值时对照。它不是新的规则源；正式规则仍以 `systems.md` 和 `numbers.md` 为准。这里记录的是“当前可执行子集”的验证入口、调参旋钮和批量基线。

## 验证命令

```bash
npm run sim:verify
npm run sim:verify:events
npm run sim:verify:routes
npm run sim:report -- --count 100 --events
```

固定 seed 代表局：

```bash
npm run sim -- --seed 25 --strategy normal --events
npm run sim -- --seed 25 --strategy postgrad --events
npm run sim -- --seed 25 --strategy overseas --events
npm run sim -- --seed 25 --strategy civil_service --events
npm run sim -- --seed 25 --strategy architecture_job --events
npm run sim -- --seed 25 --strategy career_change --events
```

## 已验证闭环

- 固定 seed 普通局可以完整跑满 `60` 周并进入稳定毕业。
- 四类失败边界已可复现：金钱、精力、压力、连续评图失败。
- 事件启用后，同 seed 事件序列可复现；模型周事件只在每学期第 `5` 周触发；AI 相关事件只在大一后半到大三阶段触发。
- 路线流程已验证为：大四上设置路线意向，大五上形成正式路线，大五上评图后缓存隐藏结果，毕业设计完成后由结局解析器统一读取。
- 单局 summary 同时输出最终属性和路线判定时属性，避免第 `10` 学期后续成长误导调参判断。

## 当前调参入口

代码入口：`simulator/balance.ts`

优先改这里：

- `ROUTE_TIMING`：路线意向、正式参与、隐藏结果缓存、路线准备期。
- `ROUTE_THRESHOLDS`：后期路线门槛、考试地板、考试过线题数、留学概率。
- `STRATEGY_TUNING`：自动跑局策略的路线准备节奏、课题质量 buffer、状态阈值。
- `COMPETITION_STUB_THRESHOLDS`：当前竞赛 stub 的获奖记录条件。
- `COMPETITION_AWARD_TIERS`：竞赛三等奖、二等奖、一等奖的表现分分界和奖金。
- `INTERNSHIP_THRESHOLDS`：当前实习 stub 的普通、强所、名企档位。

如果只想让某条路线更难，优先改路线门槛；如果想让自动跑局玩家更会准备，优先改 `STRATEGY_TUNING`。两者不要混在一起改，否则很难判断变化来自“规则变难”还是“玩家变聪明”。

## 报告字段

单局 `summary` 里重点看这些字段：

- `hiddenRouteFailureReasons`：路线判定未满足项。对有兜底的路线，它表示“为什么没进最高档”，不一定表示最终失败。
- `internshipTier`、`internshipRecordCount`：最终实习档位和档位升级次数。
- `competitionAwards`、`competitionPrizeMoney`：竞赛奖项分档和奖金。
- `hiddenRouteAttributes`、`hiddenRouteGpa`、`hiddenRoutePortfolio`：隐藏路线判定当时的数值，不是毕业最终值。

批量 `aggregate` 里重点看这些字段：

- `averageCompetitionAwardsByLevel`：每局平均一、二、三等奖数量。
- `averageCompetitionPrizeMoney`：每局平均竞赛奖金。
- `internshipTierDistribution`：最终实习档位分布。
- `routeFailureReasons`：路线判定未满足项计数。

## 100 局事件基线

命令：

```bash
npm run sim:report -- --count 100 --events
```

当前结果：

| 策略 | 结局分布 | 平均 GPA | 平均作品集 | 平均事件数 | 平均竞赛记录 | 平均奖金 |
|---|---|---:|---:|---:|---:|---:|
| `normal` | `stable_graduation` 100 | 2.76 | 560.88 | 24.17 | 0.95 | 285 |
| `balanced` | `stable_graduation` 100 | 3.14 | 662.48 | 24.17 | 4.05 | 1525 |
| `postgrad` | `basic_postgrad` 100 | 3.53 | 788.78 | 24.14 | 4.30 | 2437 |
| `overseas` | `overseas_basic` 93 / `overseas_failed` 7 | 3.25 | 709.25 | 24.14 | 4.42 | 2137 |
| `civil_service` | `civil_service_success` 49 / `civil_service_fallback` 41 / `civil_service_failed` 10 | 2.98 | 614.10 | 24.14 | 2.32 | 696 |
| `architecture_job` | `architecture_job_success` 100 | 3.38 | 745.12 | 24.17 | 4.23 | 2344 |
| `career_change` | `career_change_success` 97 / `career_change_failed` 3 | 2.84 | 571.08 | 24.17 | 1.45 | 575 |

## 竞赛分档均值

| 策略 | 三等奖 | 二等奖 | 一等奖 |
|---|---:|---:|---:|
| `normal` | 0.95 | 0.00 | 0.00 |
| `balanced` | 3.43 | 0.62 | 0.00 |
| `postgrad` | 2.93 | 0.71 | 0.66 |
| `overseas` | 2.84 | 1.55 | 0.03 |
| `civil_service` | 2.32 | 0.00 | 0.00 |
| `architecture_job` | 2.50 | 1.43 | 0.30 |
| `career_change` | 1.17 | 0.28 | 0.00 |

## 实习档位分布

当前 100 局事件基线里，所有代表策略最终都到达 `named_firm` 档位。这说明实习 stub 现在更像“属性成长记录器”，不是难度来源；后续若要让就业路线有差异，应先补录取概率、名额、持续周或退出成本。

| 策略 | 无实习 | 普通 | 强所 | 名企 |
|---|---:|---:|---:|---:|
| `normal` | 0 | 0 | 0 | 100 |
| `balanced` | 0 | 0 | 0 | 100 |
| `postgrad` | 0 | 0 | 0 | 100 |
| `overseas` | 0 | 0 | 0 | 100 |
| `civil_service` | 0 | 0 | 0 | 100 |
| `architecture_job` | 0 | 0 | 0 | 100 |
| `career_change` | 0 | 0 | 0 | 100 |

## 路线诊断计数

这些计数来自 `hiddenRouteFailureReasons`。有兜底档时，诊断项表示没有进入最高档的原因；例如 `civil_service_fallback` 仍会记录没达到正式成功线的原因。

| 策略 | 诊断项 |
|---|---|
| `overseas` | `overseas_probability_roll_failed` 7 |
| `civil_service` | `gpa_below_threshold` 41 / `presentation_below_threshold` 4 / `exam_score_below_threshold` 25 |
| `career_change` | `presentation_below_threshold` 3 |

## 路线判定时均值

这些数值来自隐藏路线结果缓存时刻，不是毕业最终状态。

| 策略 | 判定 GPA | 判定作品集 | 判定分数 | 设计 | 软件 | 审美 | 表达 | 社交 | 抗压 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `postgrad` | 3.47 | 678.78 | 381.50 | 100.00 | 91.92 | 99.81 | 27.00 | 60.01 | 62.57 |
| `overseas` | 3.30 | 648.53 | 52.72 | 99.91 | 85.67 | 100.00 | 32.00 | 59.93 | 58.80 |
| `civil_service` | 3.00 | 553.02 | 138.40 | 92.09 | 85.64 | 93.34 | 67.76 | 82.56 | 73.43 |
| `architecture_job` | 3.40 | 674.68 | - | 100.00 | 93.63 | 99.81 | 27.00 | 61.27 | 62.24 |
| `career_change` | 2.84 | 511.08 | - | 92.11 | 85.70 | 100.00 | 70.19 | 59.31 | 57.90 |

## 当前解释

- `postgrad` 当前代表目标是普通考研上岸，固定 seed 和批量都较稳。后续若加入强校档，应把强校稀有度单独调，不要直接削弱普通考研。
- `overseas` 已保留概率失败，当前主要由作品集超过门槛后的概率公式控制。
- `civil_service` 有成功、兜底、失败三档，适合继续作为考试分布调参样本。
- `architecture_job` 当前代表目标是低门槛地方设计院，100% 成功是可接受的 stub 信号，不代表大师事务所或外企岗位难度。
- `career_change` 当前代表目标是新媒体内容，策略投入后大多能成功。后续如果新增 AI 产品、游戏场景、插画师等岗位，需要分别建代表目标。

## 仍需继续跑局

- 竞赛已有三等奖、二等奖、一等奖分档和奖金，但分档目前是确定性表现分，不是概率抽奖。
- 实习已有普通、强所、名企履历记录，但仍是属性阈值升级，没有录取概率、持续周结算和退出处罚。
- 路线已有失败/未达最高档诊断计数，但还没有把每个诊断项绑定到玩家可见反馈文本。
- 路线只覆盖每个路线组的一个代表目标，尚未覆盖强校、强留学、选调、国企、外企、大师事务所、多个转行岗位。
- 当前自动策略是验证工具，不是玩家 AI；它的目的只是稳定暴露规则信号。
