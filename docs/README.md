# 文档索引

当前文档目标：少而清楚，规则源唯一，方便继续开发。先读 `PRD.md` 确认边界，再按规则源进入 `systems.md` 和 `numbers.md`。

## 推荐阅读顺序

1. `../CONTEXT.md`：领域词汇表，只管术语。
2. `PRD.md`：产品目标、系统边界、冻结口径和文档优先级。
3. `systems.md`：流程、状态机、系统规则和结局读取顺序。
4. `numbers.md`：值域、行动、评图、竞赛、路线门槛、概率和调参目标。
5. `world-and-tone.md`：世界观、情绪气质和文案原则。
6. `technical-architecture.md`：首版实现路径、技术栈、存档、排行榜、部署和工程边界。

## 内容文档

- `content-plan.md`：角色、导师、课程、音乐、院校、岗位和 UI 文案内容池。
- `events.md`：事件池、事件正文和交互选项。
- `endings.md`：人生结局、成长成就、图鉴与排行榜规则。
- `question-banks.md`：大学课程、雅思、升学专业和行测题库。

## 开发与追溯

- `unresolved-issues.md`：只放仍需实现验证、跑局模拟或人工审核的问题。
- `decision-log.md`：历史决策摘要，不作为现行规则源。
- `technical-architecture.md`：技术实现决策源，不定义玩法规则或内容。
- `simulation-to-content-design.md`：模拟结论归档索引，不作为现行规则源。
- `development-freeze.md`：旧冻结文档归档入口；冻结口径已并入 `PRD.md`。
- `adr/`：关键结构决策记录。

## 文档分工

- `PRD.md` 写“目标、边界、冻结和优先级”。
- `systems.md` 写“流程和系统关系”。
- `numbers.md` 写“数值和结算”。
- `technical-architecture.md` 写“首版实现路径、技术栈、存档、排行榜、部署和工程边界”。
- `content-plan.md / events.md / endings.md / question-banks.md` 写“内容池和展示文本”。
- `content-plan.md` 中的导师阶段任务表是例外：判定条件、奖励和处罚随导师文本同表维护，并由 `numbers.md` 引用。
- `unresolved-issues.md` 写“还要验证或请人审核什么”。
- `decision-log.md / simulation-to-content-design.md / development-freeze.md` 只做追溯和索引，不参与规则读取。

## 维护规则

- 不把已确认规则继续放在 `unresolved-issues.md`。
- 不把旧日志、旧 PRD 或 `decision-log.md` 当作实现依据。
- 不改已拍板的事件标题、结局标题、属性名、路线名和正文内容；若发现冲突，先在 `unresolved-issues.md` 记录。
- 文案内容可以在内容文档维护，数值与触发条件优先回到 `numbers.md`，流程优先回到 `systems.md`。

## 优先级

若文档之间出现冲突，按以下顺序处理：

1. `PRD.md`
2. `systems.md`
3. `numbers.md`
4. 内容文档
5. `decision-log.md`
