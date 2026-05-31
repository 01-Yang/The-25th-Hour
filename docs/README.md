# 文档索引

目标：规则源唯一、内容归位、方便后续开发。先读总览，再读规则源；内容表只承载展示文本和素材映射。

## 阅读入口

1. `../CONTEXT.md`：领域词汇表，只管术语。
2. `PRD.md`：产品目标、系统边界、冻结口径和冲突优先级。
3. `systems.md`：流程、状态机、系统关系和结局读取顺序。
4. `numbers.md`：值域、行动、评图、路线门槛、概率和调参目标。
5. `technical-architecture.md`：首版实现路径、存档、排行榜、部署和工程边界。

## 文档分工

| 文档 | 职责 |
|---|---|
| `content-plan.md` | 角色、导师、课程、院校、岗位和 UI 文案内容池；导师阶段任务表是判定条件、奖励和处罚随文本维护的例外。 |
| `events.md` | 随机事件池、固定流程事件、暑假写生交互事件和实习期间短事件的标题、正文与选项。 |
| `endings.md` | 人生结局、成长成就、图鉴、总分和排行榜分数来源。 |
| `question-banks.md` | 大学课程、雅思、升学专业和行测题库。 |
| `resume-system-confirmation.md` | 个人简历写入范围和页面结构；不定义路线数值。 |
| `music-asset-manifest.md` | 音乐素材清单、文件名、时长、播放顺序和结束曲权重。 |
| `ending-music-and-subtitles.md` | 结束曲弹窗、字幕和专辑旋转表现。 |
| `ending-memory-carousel-and-ending-image-map.md` | 结尾回忆走马灯导演稿、素材顺序和结局图片匹配。 |
| `portfolio-board-image-map.md` | 作品集课题展板图挂载规则与学期映射。 |
| `pixel-art-asset-prompts.md` | 专辑封面、UI 图标、头像、商品和成就图标的像素风提示词。 |
| `ui-links-guide-and-support.md` | 游戏引导、BGM 设置、飞书外链和请作者喝咖啡续命页面。 |
| `decisions.md` | 关键决策追溯；不作为现行规则源。 |

## 维护规则

- 流程冲突回到 `systems.md`，数值冲突回到 `numbers.md`，展示文本回到内容文档。
- 不把已确认规则继续放在临时问题文档、旧日志或 `decisions.md` 里。
- 不改已拍板的事件标题、结局标题、属性名、路线名和正文内容。
- 若发现核心文本或数值冲突，先一次性汇总给用户确认。

冲突优先级：`PRD.md -> systems.md -> numbers.md -> 内容文档 -> decisions.md`。
