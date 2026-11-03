用 OpenSpec 开一个 change（`openspec/changes/<NNN>-<module>/`），基于 AGENTS.md 与 `docs/plan/01-scope.md` 生成三份产物：

- `proposal.md`：为什么做 / 做什么 / 不做什么 / 影响范围
- `tasks.md`：每条任务 ≈ 一个可验证的提交，可勾选
- `specs/<module>/spec.md`：delta 需求，每条带稳定 ID（如 `CUS-01`）

必须覆盖：实体与字段（类型、约束、默认值）、接口清单（method、path、请求、响应、错误码）、状态与流转、列表页交互、表单校验、权限、验收标准（Given-When-Then）、测试计划（每条需求对应哪条 e2e）。

约束：不写实现代码；字段命名与已有 schema 一致；有歧义列到"待确认"而不是自行决定。
完成后输出 5 行摘要、3 个最需要人确认的问题，并跑 `pnpm spec:validate`。
