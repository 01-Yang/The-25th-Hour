# 文档索引

当前文档目标是：少而清楚，方便继续讨论，也方便以后进入开发。

## 核心文档

- `../CONTEXT.md`：领域语言（Ubiquitous Language）与术语统一口径。
- `PRD.md`：主 PRD 文档，先看这个。
- `world-and-tone.md`：世界观、情绪气质、叙事原则。
- `systems.md`：游戏系统总览与各系统规则。
- `numbers.md`：属性、行动、评图、路线门槛等数值规则。
- `content-plan.md`：角色、导师、课程、路线、岗位等内容池规划。
- `events.md`：随机事件体系的骨架清单与后续事件文本。
- `endings.md`：人生结局与成长成就结构。
- `question-banks.md`：大学课程题库与雅思题库。
- `development-freeze.md`：开发前系统收敛冻结口径，记录已经确认不再回滚的主系统边界。
- `unresolved-issues.md`：唯一待确认与未定稿总表。
- `adr/`：关键结构决策记录，当前包含事件分池、事件字段颗粒度与竞赛结果落库口径。

## 文档分工

- `PRD.md`：只写产品目标、体验目标、系统边界。
- `systems.md`：只写系统规则、流程和结构，不展开内容池清单。
- `numbers.md`：只写量化规则、公式、门槛和数值。
- `content-plan.md`：只写角色池、导师池、课程池、岗位池、地点池等内容池。
- `events.md`：只写事件原则、事件骨架和后续事件文本。
- `endings.md`：只写人生结局和成长成就。
- `question-banks.md`：只写大学课程题库和雅思题库。
- `development-freeze.md`：只写冻结口径、系统边界、结算顺序和开发前约束。
- `unresolved-issues.md`：统一记录未定稿问题与冻结项。

## 使用原则

- 新规则先进入对应文档，不要堆进一个超长 PRD。
- 术语统一看根目录的 `CONTEXT.md`。
- 事件清单统一写进 `docs/events.md`。
- 后续开发前，先把 `systems.md` 和 `numbers.md` 压成稳定版本。
- 开发前若要判断某个想法能不能新增为主系统，先看 `development-freeze.md`。
- 如果要找主文档，直接打开 `docs/PRD.md`。
- `unresolved-issues.md` 里的已解决问题不删除，统一用删除线保留痕迹。
