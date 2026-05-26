# 跑局模拟与调参基线

最后更新时间：`2026-05-26 +08:00`

本文记录已经用 headless simulator 跑通的阶段性结论，方便之后改数值时对照。它不是新的规则源；正式规则仍以 `systems.md` 和 `numbers.md` 为准。这里记录的是“当前可执行子集”的验证入口、调参旋钮和批量基线。

## 验证命令

```bash
npm run sim:verify
npm run sim:verify:competitions
npm run sim:verify:events
npm run sim:verify:internships
npm run sim:verify:routes
npm run sim:verify:route-targets
npm run sim:report -- --count 100 --events
npm run sim:report:route-targets -- --count 100 --events
```

本轮已实际执行完成：以上全部脚本均已在当前工作树跑通。其中 `sim:report:route-targets` 本文保留 `--count 30 --events` 的矩阵基线作为主观察口径，便于和 `verify-route-targets` 对照。

固定 seed 代表局：

```bash
npm run sim -- --seed 25 --strategy normal --events
npm run sim -- --seed 25 --strategy postgrad --events
npm run sim -- --seed 25 --strategy overseas --events
npm run sim -- --seed 25 --strategy civil_service --events
npm run sim -- --seed 25 --strategy architecture_job --events
npm run sim -- --seed 25 --strategy career_change --events
```

指定路线目标跑局：

```bash
npm run sim -- --seed 25 --strategy postgrad --routeTarget strong_postgrad_school --events
npm run sim -- --strategy overseas --routeTarget overseas_a_tier --count 100 --events
npm run sim -- --strategy architecture_job --routeTarget master_studio --count 100 --events
npm run sim -- --strategy career_change --routeTarget ai_product_manager --count 100 --events
```

本轮已实际执行完成：以上 6 个固定 seed 代表局和 4 个关键路线目标样本命令也都已逐条跑过，用来确认文档中的示例命令本身可用，不只是语法占位。

## 本轮执行清单

- 已跑完全部验证脚本：`sim:verify`、`sim:verify:competitions`、`sim:verify:events`、`sim:verify:internships`、`sim:verify:routes`、`sim:verify:route-targets`。
- 已跑完当前主基线报表：`sim:report -- --count 100 --events`、`sim:report:route-targets -- --count 30 --events`。
- 已跑完 6 个固定 seed 代表局：`normal`、`postgrad`、`overseas`、`civil_service`、`architecture_job`、`career_change`。
- 已跑完 4 个关键路线目标样本：`strong_postgrad_school`、`overseas_a_tier`、`master_studio`、`ai_product_manager`。

## 样本命令速记

- `normal` seed 25：`stable_graduation`，`60` 周跑满，`strong` 实习，事件版这次没有触发竞赛投稿。
- `postgrad` seed 25：默认目标 `ordinary_postgrad_school` 成功，隐藏判定 `gpa 3.43 / portfolio 671 / score 350`，4 次竞赛投稿里拿到 1 个三等和 2 个二等。
- `overseas` seed 25：默认目标 `safe_overseas_school` 成功，隐藏判定 `gpa 3.26 / portfolio 623 / score 87`，4 次投稿拿到 2 个二等奖。
- `civil_service` seed 25：默认目标 `public_institution_general` 失败，主诊断是 `presentation_below_threshold` 与 `exam_score_below_threshold`。
- `architecture_job` seed 25：默认目标 `local_design_institute` 成功，隐藏判定时已经具备 `strong` 实习和较高软件能力。
- `career_change` seed 25：默认目标 `new_media_content` 成功，但只拿到 `ordinary` 实习，竞赛这次只有 1 次投稿且未入围。
- `strong_postgrad_school` seed 25：目标绑定成功但结局失败，固定样本主诊断是 `resilience_below_threshold` 与 `exam_score_below_threshold`。
- `overseas_a_tier` 100 局：`12/100` 上岸，主要卡 `gpa_below_threshold`。
- `master_studio` 100 局：`21/100` 成功，主要卡 `internship_below_threshold`，其次是 `portfolio_below_threshold`。
- `ai_product_manager` 100 局：`9/100` 成功，主要卡 `presentation_below_threshold`，其次是 `ai_experience_below_threshold`。

## 已验证闭环

- 固定 seed 普通局可以完整跑满 `60` 周并进入稳定毕业。
- 四类失败边界已可复现：金钱、精力、压力、连续评图失败。
- 事件启用后，同 seed 事件序列可复现；模型周事件只在每学期第 `5` 周触发；AI 相关事件只在大一后半到大三阶段触发。
- 竞赛已从确定性表现分升级为投稿、入围概率、未获奖记录和奖项分档；单局和批量报告都能看到投稿、入围、拒稿、获奖和奖金。
- 实习已从阈值自动升级推进为概率申请、逐档申请、申请窗口、档位尝试上限和三周实习结算；单局和批量报告都能看到申请、录取、拒绝和最终档位。
- 路线流程已验证为：大四上设置路线意向，大五上形成正式路线，大五上评图后缓存隐藏结果，毕业设计完成后由结局解析器统一读取。
- 路线目标矩阵已可执行验证：强校、留学 S/A/C 档、选调/考公/考编、建筑就业多岗位、转行多岗位都可以通过 `--routeTarget` 单独跑局。
- 路线目标批量报表已拆成 `sim:report:route-targets`，用于观察每个目标的成功率、兜底、诊断和实习档位分布。
- 单局 summary 同时输出最终属性、路线判定时属性和路线判定时实习履历，避免第 `10` 学期后续成长误导调参判断。

## 当前调参入口

代码入口：`simulator/balance.ts`

优先改这里：

- `ROUTE_TIMING`：路线意向、正式参与、隐藏结果缓存、路线准备期。
- `ROUTE_TARGETS`：后期路线具体目标门槛、考试地板、考试过线题数、留学概率。
- `ROUTE_THRESHOLDS`：默认代表目标仍复用的历史门槛常量。
- `STRATEGY_TUNING`：自动跑局策略的路线准备节奏、课题质量 buffer、状态阈值。
- `COMPETITION_APPLICATION`：竞赛基础投稿门槛、可投稿学期、入围基础概率和表现分转概率曲线。
- `COMPETITION_AWARD_TIERS`：竞赛未获奖、三等奖、二等奖、一等奖的表现分分界和奖金。
- `COMPETITION_POOL`：四个具名赛事的学期窗口、额外门槛、入围修正和奖金倍率。
- `INTERNSHIP_THRESHOLDS`：普通、强所、名企的属性门槛和履历价值。
- `INTERNSHIP_APPLICATION`：实习最早申请学期、档位申请窗口、档位尝试上限、持续周数、逐档前置履历要求和录取概率曲线。

如果只想让某条路线更难，优先改路线门槛；如果想让自动跑局玩家更会准备，优先改 `STRATEGY_TUNING`。两者不要混在一起改，否则很难判断变化来自“规则变难”还是“玩家变聪明”。

## 报告字段

单局 `summary` 里重点看这些字段：

- `hiddenRouteFailureReasons`：路线判定未满足项。对有兜底的路线，它表示“为什么没进最高档”，不一定表示最终失败。
- `internshipTier`、`internshipRecordCount`：最终实习档位和档位升级次数。
- `internshipApplicationCount`、`internshipAcceptedCount`、`internshipRejectedCount`：实习申请、录取、拒绝次数。
- `hiddenRouteInternshipValue`、`hiddenRouteNamedFirmInternship`、`hiddenRouteInternshipTier`：隐藏路线判定当时的实习履历，不是毕业最终履历。
- `competitionSubmissionCount`、`competitionShortlistCount`、`competitionRejectionCount`：竞赛投稿、入围、拒稿次数。
- `competitionAwards`、`competitionPrizeMoney`：竞赛奖项分档和奖金，其中 `none` 表示已投稿但未入围。
- `competitionResults`：单局每次投稿对应的赛事 ID、赛事名、奖项、是否入围和奖金。
- `hiddenRouteAttributes`、`hiddenRouteGpa`、`hiddenRoutePortfolio`：隐藏路线判定当时的数值，不是毕业最终值。
- `routeTarget`、`routeTargetOverride`：本局正式绑定的路线目标；用于确认建筑工作和转行不会跨岗位串线。

批量 `aggregate` 里重点看这些字段：

- `averageCompetitionAwardsByLevel`：每局平均未获奖、一、二、三等奖数量。
- `averageCompetitionPrizeMoney`：每局平均竞赛奖金。
- `averageCompetitionSubmissions`、`averageCompetitionShortlists`、`averageCompetitionRejections`：每局平均竞赛投稿、入围、拒稿次数。
- `competitionById`：四个具名赛事各自的投稿次数、入围次数、拒稿次数、奖金和奖项结构。
- `averageInternshipApplications`、`averageInternshipAccepted`、`averageInternshipRejected`：每局平均实习申请、录取、拒绝次数。
- `internshipTierDistribution`：最终实习档位分布。
- `routeFailureReasons`：路线判定未满足项计数。
- `hiddenRouteDecision.averageInternshipValue`、`hiddenRouteDecision.namedFirmInternshipRate`、`hiddenRouteDecision.internshipTierDistribution`：路线判定时实习履历均值与分布。
- `routeTargetDistribution`：批量中实际绑定的路线目标分布。

## 100 局事件基线

命令：

```bash
npm run sim:report -- --count 100 --events
```

当前结果：

| 策略 | 结局分布 | 平均 GPA | 平均作品集 | 平均事件数 | 平均竞赛记录 | 平均奖金 |
|---|---|---:|---:|---:|---:|---:|
| `normal` | `stable_graduation` 100 | 2.75 | 558.72 | 24.42 | 0.55 | 211 |
| `balanced` | `stable_graduation` 100 | 3.10 | 649.14 | 24.47 | 2.33 | 952 |
| `postgrad` | `basic_postgrad` 99 / `postgrad_failed` 1 | 3.46 | 773.83 | 24.18 | 2.60 | 1996 |
| `overseas` | `overseas_basic` 96 / `overseas_failed` 4 | 3.22 | 700.46 | 24.36 | 2.47 | 1809 |
| `civil_service` | `civil_service_fallback` 48 / `civil_service_success` 43 / `civil_service_failed` 9 | 2.94 | 601.98 | 24.41 | 1.22 | 370 |
| `architecture_job` | `architecture_job_success` 100 | 3.30 | 719.62 | 24.20 | 2.56 | 1644 |
| `career_change` | `career_change_success` 96 / `career_change_failed` 4 | 2.81 | 560.70 | 24.46 | 0.99 | 509 |

## 竞赛投稿与分档均值

| 策略 | 投稿 | 入围 | 拒稿 | 未获奖 | 三等奖 | 二等奖 | 一等奖 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `normal` | 0.91 | 0.55 | 0.36 | 0.36 | 0.50 | 0.05 | 0.00 |
| `balanced` | 3.60 | 2.33 | 1.27 | 1.27 | 2.11 | 0.21 | 0.01 |
| `postgrad` | 3.72 | 2.60 | 1.12 | 1.12 | 1.34 | 0.96 | 0.30 |
| `overseas` | 3.66 | 2.47 | 1.19 | 1.19 | 1.10 | 1.19 | 0.18 |
| `civil_service` | 2.02 | 1.22 | 0.80 | 0.80 | 1.22 | 0.00 | 0.00 |
| `architecture_job` | 3.67 | 2.56 | 1.11 | 1.11 | 1.37 | 1.15 | 0.04 |
| `career_change` | 1.49 | 0.99 | 0.50 | 0.50 | 0.66 | 0.33 | 0.00 |

## 具名竞赛分布

当前竞赛已不再是单一通用投稿池，而是四个具名赛事的顺序投稿窗口：`Campus Corner Renovation`、`Old Block Micro Renewal`、`Green Building Concept`、`Young Architect Portfolio`。它们共享基础入围曲线，但各自带有不同的学期窗口、额外门槛、入围修正和奖金倍率。

以 100 局事件基线看，具名赛道已经能拉开明确风格差异：

- `normal` 最常见的是 `green_building_concept` 0.41 次和 `old_block_micro_renewal` 0.29 次；`young_architect_portfolio` 只有 0.07 次，说明高门槛赛事不再默认出现。
- `balanced` 四个赛事基本都能稳定摸到，其中 `green_building_concept` 达到 1.00 次，`young_architect_portfolio` 0.89 次。
- `postgrad` 和 `architecture_job` 的高作品集策略已经能把 `young_architect_portfolio` 推到 0.89-0.93 次，并开始稳定产出二等与一等结果。
- `civil_service` 仍以早中期赛事为主，`young_architect_portfolio` 只有 0.08 次，符合路线投入偏体制内的预期。

这组数据更适合直接喂给内容设计：后续赛事文案、主题包装、结果页和简历写入都可以按具名赛事拆开，而不是继续围绕 generic competition 写。

## 实习申请均值

| 策略 | 平均申请 | 平均录取 | 平均拒绝 |
|---|---:|---:|---:|
| `normal` | 3.42 | 1.84 | 1.58 |
| `balanced` | 3.44 | 2.04 | 1.40 |
| `postgrad` | 3.48 | 2.08 | 1.40 |
| `overseas` | 3.56 | 1.98 | 1.58 |
| `civil_service` | 3.60 | 1.83 | 1.77 |
| `architecture_job` | 3.47 | 2.07 | 1.40 |
| `career_change` | 3.62 | 1.88 | 1.74 |

## 实习档位分布

当前 100 局事件基线里，实习已经出现普通、强所、名企三档分布；名企被申请窗口和每档尝试上限明显压低。默认建筑就业仍稳定，但大师事务所、外企和国企设计院已经会因为判定时实习履历不足而出现待定结果。

| 策略 | 无实习 | 普通 | 强所 | 名企 |
|---|---:|---:|---:|---:|
| `normal` | 0 | 27 | 62 | 11 |
| `balanced` | 0 | 14 | 68 | 18 |
| `postgrad` | 0 | 14 | 64 | 22 |
| `overseas` | 0 | 18 | 66 | 16 |
| `civil_service` | 0 | 26 | 65 | 9 |
| `architecture_job` | 0 | 15 | 63 | 22 |
| `career_change` | 0 | 23 | 66 | 11 |

## 路线诊断计数

这些计数来自 `hiddenRouteFailureReasons`。有兜底档时，诊断项表示没有进入最高档的原因；例如 `civil_service_fallback` 仍会记录没达到正式成功线的原因。

| 策略 | 诊断项 |
|---|---|
| `postgrad` | `gpa_below_threshold` 1 / `exam_score_below_threshold` 1 |
| `overseas` | `gpa_below_threshold` 2 / `overseas_probability_roll_failed` 2 |
| `civil_service` | `gpa_below_threshold` 44 / `presentation_below_threshold` 3 / `exam_score_below_threshold` 28 |
| `career_change` | `presentation_below_threshold` 4 |

## 路线判定时均值

这些数值来自隐藏路线结果缓存时刻，不是毕业最终状态。

| 策略 | 判定 GPA | 判定作品集 | 判定分数 | 设计 | 软件 | 审美 | 表达 | 社交 | 抗压 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `postgrad` | 3.40 | 663.83 | 378.25 | 100.00 | 92.99 | 99.35 | 27.22 | 60.42 | 62.48 |
| `overseas` | 3.26 | 639.06 | 51.56 | 99.99 | 86.44 | 100.00 | 32.16 | 60.07 | 59.71 |
| `civil_service` | 2.95 | 541.44 | 137.65 | 93.38 | 86.28 | 92.98 | 67.75 | 82.61 | 74.27 |
| `architecture_job` | 3.32 | 650.26 | - | 100.00 | 94.37 | 99.40 | 27.22 | 61.29 | 63.37 |
| `career_change` | 2.81 | 500.70 | - | 93.71 | 86.13 | 100.00 | 69.65 | 59.07 | 58.99 |

## 路线判定时实习分布

| 策略 | 平均实习值 | 名企率 | 无实习 | 普通 | 强所 | 名企 |
|---|---:|---:|---:|---:|---:|---:|
| `postgrad` | 2.08 | 0.22 | 0 | 14 | 64 | 22 |
| `overseas` | 1.98 | 0.16 | 0 | 18 | 66 | 16 |
| `civil_service` | 1.83 | 0.09 | 0 | 26 | 65 | 9 |
| `architecture_job` | 2.07 | 0.22 | 0 | 15 | 63 | 22 |
| `career_change` | 1.88 | 0.11 | 0 | 23 | 66 | 11 |

## 当前解释

- `postgrad` 当前默认目标是普通考研上岸，固定 seed 和批量都较稳。强校档已进入 `ROUTE_TARGETS`，应通过 `--routeTarget strong_postgrad_school`、`--routeTarget dream_postgrad_school` 和 `sim:report:route-targets` 单独调。
- `overseas` 已保留概率失败，当前主要由作品集超过门槛后的概率公式控制；100 局里现在是 `96/4`，失败样本略高于上一轮。
- `civil_service` 有成功、兜底、失败三档，当前 100 局保持 `48/43/9`，依然适合继续作为考试分布调参样本。路线验证只锁定三档都属于合法体制内结果，不再把单个 seed 绑死到某一档。
- `architecture_job` 默认目标是低门槛地方设计院，100% 成功仍是可接受的代表目标信号；`master_studio` 在 30 局目标矩阵中为 `4/30`，现在主要卡判定时没有名企实习。
- `career_change` 默认目标是新媒体内容，策略投入后大多能成功；`ai_product_manager` 在 30 局目标矩阵中为 `2/30`，主要卡 `presentation_below_threshold` 与 `ai_experience_below_threshold`；`sales_business` 为 `3/30`，主要卡表达。

## 30 局路线目标矩阵信号

命令：

```bash
npm run sim:verify:route-targets
npm run sim:report:route-targets -- --count 30 --events
```

当前矩阵验证重点不是锁死百分比，而是确保目标绑定、最终解析、成功/失败诊断都可执行。最近一次 30 局事件矩阵暴露出的主要信号：

| 目标 | 目标成功 | 主要诊断 |
|---|---:|---|
| `ordinary_postgrad_school` | 30/30 | - |
| `strong_postgrad_school` | 2/30 | `gpa_below_threshold` / `resilience_below_threshold` / `exam_score_below_threshold` |
| `dream_postgrad_school` | 0/30 | `gpa_below_threshold` / `resilience_below_threshold` / `exam_score_below_threshold` |
| `overseas_c_tier` | 30/30 | - |
| `overseas_a_tier` | 2/30 | `gpa_below_threshold` |
| `overseas_s_tier` | 0/30 | `gpa_below_threshold` / `portfolio_below_threshold` |
| `selection_home` | 0/30 | `gpa_below_threshold` / `presentation_below_threshold` / `recent_failed_reviews_above_threshold` / `exam_score_below_threshold` |
| `public_institution_general` | 12/30 | `gpa_below_threshold` / `presentation_below_threshold` / `exam_score_below_threshold` |
| `civil_service_provincial` | 0/30 | 多数进入 `civil_service_fallback`，目标成功仍稀少 |
| `state_owned_design_institute` | 26/30 | `internship_below_threshold` |
| `foreign_firm` | 26/30 | `internship_below_threshold` |
| `master_studio` | 4/30 | `portfolio_below_threshold` / `internship_below_threshold` |
| `ai_product_manager` | 2/30 | `presentation_below_threshold` / `ai_experience_below_threshold` |
| `sales_business` | 2/30 | `presentation_below_threshold` |

## 仍需继续跑局

- 竞赛已拆成四个具名赛事，并能按赛事输出投稿、拒稿、奖项和奖金；下一步仍需要补赛事主题文本、玩家可见结果页和更细的名额权重。
- 实习已有概率申请、逐档晋升、申请窗口、档位尝试上限和三周结算；仍没有全局名额、申请季竞争强度差异和中途退出处罚。
- 路线已有失败/未达最高档诊断计数，但还没有把每个诊断项绑定到玩家可见反馈文本。
- 路线目标已覆盖强校、强留学、选调、国企、外企、大师事务所、多个转行岗位，但这些目标仍是第一版可执行门槛，尚未做最终稀有度调参。
- 当前自动策略是验证工具，不是玩家 AI；它的目的只是稳定暴露规则信号。
