# Simulator

这是迁移到正式 `game-core` 前的最小可执行规则内核，不是第二套规则源。

## 用途

- 验证固定 seed 能从开局跑到结局。
- 验证四类中途失败边界。
- 验证路线正式参与、隐藏结果缓存和毕业后统一揭示。
- 验证竞赛、实习、创业契约等规则没有断。

## 命令

```bash
npm run sim -- --seed 25 --strategy normal
npm run sim:verify
npm run sim:verify:routes
npm run sim:verify:route-targets
```

细查专项时再运行：

```bash
npm run sim:verify:events
npm run sim:verify:competitions
npm run sim:verify:internships
npm run sim:verify:internship-value
npm run sim:verify:entrepreneurship
```

## 边界

- 保留规则内核、固定 seed 验证和最小 smoke test。
- 不再保留批量报告、纯调参脚本和研究型模拟入口。
- 等网页正式接入 `game-core` 后，再迁移可复用规则并删除剩余模拟壳。
