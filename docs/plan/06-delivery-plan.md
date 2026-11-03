# 06 交付计划

## 1. 前提

- 总投入 16 小时（2 个工作日），按 8h/天估；若实际只有 8 小时，见第 9 节裁剪版。
- 单人完成，AI 承担约 70% 的代码量，人负责契约、边界、review 与验证。
- 不追求视觉，UI 用 AntD 默认风格，视觉改动预算 ≤ 10% 时间。
- 规格用 OpenSpec（见 [07-spec-driven.md](./07-spec-driven.md)），三个 change 覆盖三个里程碑。

## 2. 里程碑

| 里程碑 | 时长 | 产出 | 退出标准 |
|---|---|---|---|
| M0 工程底座 | 0.5h | Vite + React 19 + AntD 6 + TS strict + ESLint/Prettier + Vitest + CI 骨架 | `pnpm dev` 能起，`pnpm lint` 能跑 |
| M1 harness + 规格 | 1.5h | AGENTS.md、4 个 command、verify 脚本、env 校验、api client、`openspec init` + change 001 | 故意写 `fetch` 会被 lint 拦下；`openspec validate --strict` 通过 |
| M2 契约与 mock | 1.5h | 客户实体 schema、种子数据、handler、契约测试 | 契约测试全绿；端点覆盖 17/17 |
| M3 共享组件 | 2.5h | AntD 版本核对（0.5h）、DataTable、FilterBar、ResourceForm、三态组件 | 组件测试覆盖三态与校验；版本结论进 ADR |
| M4 客户模块 | 2.5h | 列表（URL 状态）、新建/编辑抽屉、删除与 409 | 集成测试全绿；刷新筛选不丢；change 001 收口 |
| M5 订单模块 | 2h | 列表、异步客户选择、金额转分、状态流转 | 集成测试全绿；非法流转有提示；change 002 收口 |
| M6 鉴权与布局 | 1.5h | 登录、角色守卫、侧边栏、响应式、详情页 | viewer 无写入口；401/403 行为正确；change 003 收口 |
| M7 收口 | 2h | e2e 6 条、错误态打磨、README、ADR、迭代日志、archive、演示录制 | `verify` + `e2e` 全绿；干净目录可复现 |
| 缓冲 | 1.5h | 修 flaky、补文档、录演示 | — |

## 3. 提交序列（约 24 条）

每条都必须 `pnpm verify` 绿；功能与重构分开；规格变更单独成提交。

| # | 提交 | 关键内容 |
|---|---|---|
| 1 | `chore: scaffold vite react ts with antd` | strict tsconfig、路径别名、.nvmrc、engines、reset.css |
| 2 | `chore: eslint flat config with import boundaries` | 边界规则 + prettier |
| 3 | `chore: vitest + testing library + msw` | setup（含 matchMedia/ResizeObserver polyfill）、renderWithProviders |
| 4 | `docs: AGENTS.md, plan and slash commands` | 上下文层落地 |
| 5 | `docs(spec): openspec project and change 001` | proposal / tasks / customer spec delta |
| 6 | `feat(harness): verify script, env validation, api client` | 反馈层与网络出口 |
| 7 | `feat(contract): customer schema and mock seed` | 契约先于 UI |
| 8 | `test(contract): customer endpoints and error shapes` | 契约测试 |
| 9 | `feat(ui): DataTable wrapper with three states` | 模式层第一块（包 antd Table） |
| 10 | `feat(ui): FilterBar and url state hook` | URL 即状态 |
| 11 | `feat(customers): list with filters, sorting, pagination` | 模块 A |
| 12 | `test(customers): list integration` | 防抖、URL、结果 |
| 13 | `feat(customers): create and edit drawer with 422 mapping` | 表单链路 |
| 14 | `feat(customers): delete with conflict handling` | 409 文案与关联数 |
| 15 | `docs(spec): archive 001 and open change 002` | 规格收口，历史可查 |
| 16 | `feat(orders): schema, handlers, list` | 模块 B |
| 17 | `refactor(customers): extract useResourceList for reuse` | **复用证据**：A 改用共享 hook |
| 18 | `feat(orders): form with async customer select and cents` | 金额转分、异步下拉 |
| 19 | `feat(orders): status transitions with rollback` | 状态机 + 乐观更新回滚 |
| 20 | `feat(auth): mock login, role guard, viewer read-only` | 权限两层（change 003） |
| 21 | `test(e2e): customer crud and order lifecycle` | 6 条场景，标题带需求 ID |
| 22 | `ci: verify pipeline with contract and spec checks` | 门禁上云 |
| 23 | `docs: README, adr, iteration log` | 交付物（含 antd 版本决策） |
| 24 | `docs(spec): archive all changes and traceability matrix` | 需求 → 实现 → 测试 对照 |

第 16→17 的顺序是刻意的：**先用第二处真实需求逼出抽象，再回头改 A**。这样 `useResourceList` 的接口是被两个调用点校准过的，答辩时能讲清楚"为什么这么设计"。

## 4. 10 分钟演示脚本

| 时间 | 动作 | 想证明什么 |
|---|---|---|
| 0:00–0:30 | `pnpm i && pnpm dev`，打开客户列表 | 一条命令起得来 |
| 0:30–2:00 | 搜索 + 筛选 + 翻页 → 复制 URL → 新标签打开 | 状态在 URL，可分享可还原 |
| 2:00–3:00 | 新建客户 → 故意填错手机号 → 修正 → 保存 | 前端校验 + 服务端 422 回填 |
| 3:00–4:00 | 删除有订单的客户 | 业务约束与 409 文案，不是白屏 |
| 4:00–5:30 | 建订单 → 选客户（异步搜索）→ 金额 1234.56 → 确认收款 → 退款 | 分存储、状态机、按钮随状态变化 |
| 5:30–6:00 | 切 viewer 账号 | 入口消失；直接访问 URL 被拦 |
| 6:00–7:00 | 关掉 mock，`pnpm server` + `pnpm dev:http` 重跑一遍 | 换后端零改动 |
| 7:00–8:00 | `pnpm verify` + CI 页面 + `openspec list` | 门禁全绿、规格与任务可查 |
| 8:00–9:30 | 打开 AGENTS.md，让 AI 加一个字段（如 `website`），只改 schema 链路 | **harness 的"啊哈"时刻** |
| 9:30–10:00 | 翻 `iteration-log.md` 与 git log | 过程可信 |

最后 1.5 分钟是整套方案的核心卖点，务必留足时间。

## 5. 交付清单

```
react-harness-engineering/
├─ README.md                 # 5 分钟能跑起来 + 架构图 + 决策 + 度量
├─ AGENTS.md                 # AI 协作入口（单一事实来源）
├─ .claude/commands/         # change / new-module / review / fix-ci
├─ openspec/
│  ├─ project.md
│  ├─ specs/{customers,orders}/spec.md
│  ├─ changes/001..003/
│  └─ archive/
├─ docs/
│  ├─ architecture.md        # 分层图与依赖规则
│  ├─ api-contract.md        # 端点表与错误码（人读版）
│  ├─ rules.md               # 按需规则（对应 Vue 模板的 .codebuddy/rules）
│  ├─ harness.md             # 六层、门禁、AI 反模式对照
│  ├─ iteration-log.md       # 8–10 条真实返工记录
│  ├─ definition-of-done.md
│  ├─ traceability.md        # 需求 ID → 实现 → 测试
│  └─ adr/0001..0005-*.md
├─ contract/openapi.json     # 交给后端的契约
├─ scripts/{verify,check-contract,check-spec,seed}.mjs
├─ server/index.ts           # 换后端演练（P1）
├─ src/…                     # 业务代码
├─ e2e/
├─ .github/workflows/ci.yml
└─ .env.example
```

README 必须让人在 5 分钟内跑起来，结构建议：

1. 一句话是什么 + 截图/GIF
2. 快速开始（Node 版本、3 条命令、演示账号）
3. 功能清单与两个模块的关系图
4. 架构与目录（一张图 + 依赖规则）
5. Harness：门禁、命令、AI 协作方式、度量数字
6. 规格：openspec 在哪、怎么看一个 change、需求 ID 怎么追溯
7. 契约与换后端（含 `VITE_API_MODE` 说明）
8. 关键决策（链接 ADR）
9. 已知限制与后续计划
10. 我如何使用 AI（链接 iteration-log）

## 6. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| 陷进 UI 打磨 | 高 | 挤占 harness 时间 | 视觉预算 10%，用 AntD 默认样式，M7 才允许微调 |
| 过度抽象成 CRUD 引擎 | 中 | 答辩被问倒、改字段成本高 | 三层封顶；抽象前必须有两个调用点 |
| e2e 抖动 | 中 | 交付时演示失败 | 固定种子 + storageState + 禁 waitForTimeout；提前 `--repeat-each=3` |
| 契约与 mock 漂移 | 中 | 换后端失败 | handler 内 zod 校验 + 出参校验 + CI 检查 openapi diff |
| AntD 6 的 API 差异 | 中 | 组件层返工 | M3 开头 0.5h spike；有阻塞就退回 5.27.x |
| SDD 仪式成本过高 | 中 | 挤占开发时间 | 三个 change 封顶；spec ≤ 2 页；不做多余产物 |
| 时间不够 | 中 | 功能残缺 | 按第 9 节裁剪，优先保 harness 与两个模块的主路径 |
| Windows 路径/脚本问题 | 低 | 别人跑不起来 | verify 用 node 脚本；CI 在 Linux 上验证；README 写清 Node 22 |
| AI 生成代码难 review | 中 | 隐藏缺陷 | 小步提交 + 每步验证 + `/review` 清单 |

## 7. 需要向对接人确认

1. 期望投入工时与截止时间？（决定是否走裁剪版）
2. 是否需要提交 AI 对话记录，还是只需要 iteration-log 这种摘要？
3. 是否需要在线 demo（Vercel/Netlify），还是本地可跑即可？
4. 评审形式：跑起来看、读代码、还是现场答辩？答辩时长？
5. AntD 版本有要求吗（团队在 5.x 还是 6.x）？
6. 团队是否已有规格规范（OpenSpec / Spec Kit / 自研模板）？有就对齐，没有就用 OpenSpec。
7. Node 版本或包管理器有指定吗？

## 8. 要求 → 证据映射（自查用）

| 题目要求 | 交付物中的证据 |
|---|---|
| 两个业务模块 + CRUD | `features/customers`、`features/orders`，17 个端点，e2e 覆盖 |
| 复用表格、表单 | `shared/ui/data-table`、`resource-form`；commit #17 的抽取与回改 |
| 快速、高质量迭代 | 24 条提交、每条 verify 绿、CI 徽章、iteration-log |
| 快速前后端协作 | zod 契约、openapi.json、MSW 网络层、`http` 模式 e2e |
| 后端可 Mock | `VITE_API_MODE=mock` 默认，`db:reset` 可复现演示 |
| 可运行项目 | README 三条命令；干净目录复现一次并录屏 |
| Harness | AGENTS.md、4 个 command、verify、boundaries、CI、DoD、AI 反模式表 |
| 规格可追溯 | openspec changes + archive、需求 ID、`docs/traceability.md`、`spec:validate` 门禁 |

## 9. 8 小时裁剪版

砍掉：详情页（2 个）、批量删除、换后端 server、openapi 导出、响应式细节、乐观锁、OpenSpec 的 archive 流程（只保留一个 change 的 proposal + tasks）。

保留：两个模块的主路径 CRUD、URL 状态、DataTable/ResourceForm 复用、MSW 契约、`verify`、AGENTS.md、4 条 e2e、README。

顺序不变：**先门禁，再契约，再共享组件，最后业务**。砍功能不砍 harness——这是本题的分值所在。
