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

## 开发与追溯

- `technical-architecture.md`：技术实现决策源，不定义玩法数值或内容正文。
- `decisions.md`：关键决策追溯，不作为现行规则源。
- `core-questions.md`：核心问题归档；已拍板口径已并入正式规则文档，不作为独立规则源。
- `resume-system-confirmation.md`：简历系统旧确认稿，稳定口径已并入 `systems.md`。

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
5. `technical-architecture.md`
6. `decisions.md`
