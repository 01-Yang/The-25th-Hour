# 技术架构与首版实现路径

最后更新时间：`2026-05-28 +08:00`

## 目的

本文只定义首版的技术实现边界、最佳实现路径、存档方案、排行榜方案和部署方案。

- 不定义玩法流程、数值和内容文案。
- 规则冲突时，仍按 `PRD.md -> systems.md -> numbers.md -> 内容文档` 处理。
- 技术实现冲突时，以本文为准。

## 当前定案

- 首版是网页游戏，桌面浏览器体验优先。
- 同一套代码适配移动端浏览器，但移动端不是首发中心。
- 排行榜必须首发。
- 不做原生 App，不走 Unity / Godot / Phaser。
- 不做登录、账号、云存档、身份找回。
- 游戏主逻辑离线可运行。
- 浏览器本地保存完整游戏数据。
- 云端只保存排行榜最小摘要数据。

## 最佳实现路径

基于当前仓库，最佳路径不是继续维护一个“文档 + 模拟器 + 未来前端各一套逻辑”的结构，而是：

1. 把当前 `simulator` 中可复用的规则实现收口成正式 `game-core`
2. 把行动、事件、课程、路线、结局等配置收口成 `game-data`
3. 用 `Vite + React` 做单页 `web-app`
4. 用 `IndexedDB` 做本地存档
5. 用 `Cloudflare Workers + D1` 只做排行榜接口

当前仓库里的 `simulator` 不能直接整块删除。它是现阶段唯一可执行的规则内核来源。

正确做法：

- 先保留规则内核
- 逐步抽出 `game-core`
- 等网页正式接入 `game-core` 后，再删除不再需要的批量模拟、报告和调参壳

## 推荐技术栈

- 语言：`TypeScript`
- 前端构建：`Vite`
- UI：`React`
- 动效：`GSAP`
- 本地存储：`IndexedDB`
- 轻量偏好：`localStorage`
- 静态部署：`Cloudflare Pages`
- 排行榜 API：`Cloudflare Workers`
- 排行榜数据库：`Cloudflare D1`

## 工程边界

推荐结构：

- `game-core`：状态机、规则、结算器、随机数、行动可用性、路线与结局解析
- `game-data`：行动、事件、课程、竞赛、实习、路线目标、结局和成就配置
- `web-app`：页面、组件、弹窗、动画和视图模型
- `storage`：本地存档读写、版本迁移、本地 `playerId`
- `leaderboard`：排行榜读取和提交接口

如果首版不拆多包，也要在同一个前端工程里保持目录边界清楚，例如：

```text
src/
  game/
    core/
    data/
  app/
  storage/
worker/
```

## 硬规则

- `GameState` 是唯一真相源。
- UI 不直接修改 `GameState`。
- 所有游戏推进操作都必须经过统一命令层。
- 所有数值变化都必须走统一结算器，并产出结构化 `delta` 与日志。
- 随机结果必须来自统一 seed 和 RNG。
- 行动、事件、路线、结局、成就等 ID 发布后保持稳定。
- 展示文案不作为程序主键。

推荐命令层至少包括：

- `startGame`
- `startWeek`
- `performAction`
- `chooseRouteTarget`
- `chooseContract`
- `resolveReview`
- `advancePhase`

## 本地存档

本地存档使用 `IndexedDB`。

至少保存：

- 当前 `GameState`
- 自动存档和手动存档元数据
- 已解锁人生结局
- 已解锁成长成就
- 重复达成人生结局记录
- 本地总分
- 本地匿名 `playerId`
- 开局档案中的昵称和大学名称

`localStorage` 只保存：

- 最近一次存档 ID
- 音量、动效开关等轻量偏好
- 是否看过隐私提示

首版不做：

- 云存档
- 导入导出
- 跨设备同步

## 排行榜

排行榜首发只做总分榜。

展示：

- `Top 100`
- 我的当前排名
- `昵称 / 大学名称 / 总分`

总分口径读取 `endings.md`。

提交规则：

- 每个本地匿名 `playerId` 只保留一个历史最高总分
- 只有本地总分更高时才更新
- 提交失败不阻塞游戏
- 可在本地记录待提交状态，联网后重试

云端最小字段：

- `playerId`
- `nickname`
- `universityName`
- `totalScore`
- `scoreVersion`
- `createdAt`
- `updatedAt`

接口固定为：

- `GET /leaderboard/top`
- `GET /leaderboard/me?playerId=...`
- `POST /leaderboard/score`

## 为什么仍然需要一点“后端”

虽然这不是传统后端项目，但只要排行榜首发，就不能让前端直接连数据库。

正确形态是：

- 前端只请求排行榜接口
- `Worker` 做最小校验、限流和写库
- `D1` 只存排行榜摘要

这层很薄，但必须存在。

## 部署

- `Cloudflare Pages`：网页静态资源
- `Cloudflare Workers`：排行榜 API
- `Cloudflare D1`：排行榜数据

首版不需要更重的服务端框架。

## 开发顺序

1. 从当前 `simulator` 抽出 `game-core`
2. 把配置抽成 `game-data`
3. 起 `Vite + React` 网页壳
4. 接入 `IndexedDB` 存档
5. 接入排行榜 `Worker + D1`
6. 完成从开局到结局的首个可玩闭环
7. 最后做 UI 打磨、动画和移动端适配

## 当前仓库的处理建议

- 保留：规则内核、固定 seed 验证、最小 smoke test
- 可逐步删除：批量报告、调参脚本、纯研究型模拟入口
- 不要删除：尚未接入网页前的可执行规则实现

## 非目标

首版不做：

- 登录与账号系统
- 复杂反作弊
- 好友榜、赛季榜、多榜单
- 后台管理系统
- 原生 App
- 云存档

## 一句话结论

这款游戏的首版最佳实践是：

**一个离线优先的 React 单页游戏，一个本地 `IndexedDB` 存档层，一个极薄的 Cloudflare 排行榜接口，以及一套从当前 `simulator` 抽出来的正式规则内核。**
