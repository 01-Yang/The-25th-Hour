# 文档索引

目标：规则源唯一、文档短而清楚、核心文本不被无意改写。

## 阅读顺序

1. `../CONTEXT.md`：领域词汇表，只定义术语。
2. `PRD.md`：产品目标、边界、冻结口径和文档优先级。
3. `systems.md`：流程、状态机、系统关系和结局读取顺序。
4. `numbers.md`：值域、行动、评图、竞赛、路线门槛、概率和调参目标。
5. `technical-architecture.md`：首版实现路径、存档、排行榜、部署和工程边界。

## 内容源

- `content-plan.md`：角色、导师、课程、院校、岗位和 UI 文案内容池。
- `events.md`：事件池、事件标题、正文和交互选项。
- `endings.md`：人生结局、成长成就、图鉴与排行榜规则。
- `question-banks.md`：大学课程、雅思、升学专业和行测题库。
- `ending-music-and-subtitles.md`：结束曲、授权歌词字幕、歌曲弹窗和专辑视觉。
- `ui-links-guide-and-support.md`：游戏引导、外链和支持页面。

## 技术实现

- `technical-architecture.md`：技术实现决策源，不定义玩法数值或内容正文。

## 当前技术落地口径

- 当前开发先收口文档和正式规则内核，再接粗糙 UI。
- 粗糙 UI 只用于试玩和验证流程，不作为规则源，也不作为最终视觉方向。
- 正式实现以 `game-core / game-data / app/view-model / app/ui / storage / api` 分层推进。
- 部署目标为 `Vercel Hobby + Cloudflare 免费层`；静态主程序走 `Vercel`，大文件走 `R2`，排行榜走 `Workers + D1`。
- 当前发布流程优先依赖 `GitHub main -> Vercel Production` 自动化；`dev / staging / production` 三环境隔离作为后续工程目标。
- 排行榜是首发唯一云端能力，接口和存储口径读取 `technical-architecture.md`。

## 分工规则

- 流程写入 `systems.md`。
- 数值、概率、门槛和结算写入 `numbers.md`。
- 事件、结局、题库和展示文案写入对应内容文档。
- 导师阶段任务表是例外：判定条件、奖励和处罚随导师文本维护在 `content-plan.md`，并由 `numbers.md` 引用。
- 已拍板的事件标题、结局标题、属性名、路线名和正文内容不直接改写；若发现冲突，先集中给用户确认。

## 冲突优先级

1. `PRD.md`
2. `systems.md`
3. `numbers.md`
4. 内容文档

技术实现冲突时，以 `technical-architecture.md` 为准；但技术文档不得覆盖 `PRD.md / systems.md / numbers.md` 已确定的玩法规则。
