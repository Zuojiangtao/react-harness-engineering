# 07 规格驱动开发：OpenSpec / Spec Kit 怎么用、为什么

## 0. 结论先行

| 问题 | 回答 |
|---|---|
| 要不要用 | **要**，但只用一套，且只让它管"做什么、改了什么"，不要变成第三份真相 |
| 用哪个 | **OpenSpec**（轻、变更制、有 `validate` 硬门禁）；Spec Kit 作为备选 |
| 花多少时间 | 1.5 小时（安装 + 两个 change + 收口），从缓冲里出 |
| 原方案为什么没写 | 16 小时预算下优先保"能跑的门禁"，怕 SDD 变成文档表演；但这个判断值得改——它正好补上原方案缺的"需求追溯"层 |

## 1. 两个工具是什么（2026-11 现状）

**OpenSpec**——自称"轻量、可配置的规格框架"，安装 `npm i -g @fission-ai/openspec`。工作流是 `/opsx:explore → /opsx:propose → /opsx:apply → /opsx:verify → /opsx:archive`，产物为 `proposal.md`、`specs/`、`design.md`、`tasks.md`，支持 Claude Code、Codex、Cursor 等三十多种工具（[openspec.dev](https://openspec.dev/)）。它的核心是**变更制**：每次改动是一个 change，自带 delta 规格，完成后 archive，历史可追溯。

**GitHub Spec Kit**——更重的 SDD 工具链，`specify init <project> --integration <agent>`，核心流程 **Specify → Plan → Tasks → Implement → Converge**，带 constitution（项目宪法）、模板、质量清单与跨产物一致性分析，官方称支持 38 种 agent 集成，还有 bugfix、idea assessment 等可选扩展（[Spec Kit 文档](https://github.github.io/spec-kit/)）。

## 2. 对比

| 维度 | OpenSpec | Spec Kit |
|---|---|---|
| 定位 | 轻量规格 / 变更管理 | 完整 SDD 流程 + 可扩展流程引擎 |
| 最小产物 | proposal + specs + tasks + design | constitution + spec + plan + tasks（+ research/data-model/contracts） |
| 变更模型 | **delta + archive**，天然适合迭代 | 以 feature 为单位，靠 converge 收口 |
| 硬门禁 | `openspec validate --strict` | 质量清单 + 跨产物分析（偏提示） |
| 上手成本 | 低（半小时能跑通） | 中（要理解 constitution 与各阶段产物） |
| 适合 | 2 天冲刺、单人、频繁小变更、brownfield | 多周项目、多人多 agent、需要组织级规范 |
| 答辩观感 | "我知道怎么让需求可追溯" | "我引入了完整方法论"（说不好会显得重） |

## 3. 原方案为什么没用（诚实版）

1. **预算是硬约束**。16 小时里，装工具、学命令、写两份 spec 至少要 1.5–2 小时，而当时我把这段时间给了 `verify` 和契约测试——那两样是"能当场演示"的。
2. **怕文档表演**。SDD 工具最大的失败模式是产出一堆没人读的 spec，评审者一眼就能看出来。宁可少一份文档，也不要一份摆设。
3. **避免第三份真相**。原方案已经有 AGENTS.md（怎么写）、docs/plan（怎么想）、ADR（为什么），再加 spec 必须先划清边界，否则同一件事写三遍、改一处漏两处。

## 4. 为什么现在建议用

- **题目第 4 点就是 harness**。SDD 是 harness 的"需求层"，正好补上原方案的空白：我有工程约束和反馈回路，但没有"需求 → 实现 → 验收"的追溯链。
- **它能被验证**。`openspec validate` 可以进 `pnpm verify`，tasks 可以逐条对上 commit，需求 ID 可以被 e2e 引用——不是嘴上说"我有流程"。
- **区分度**。多数候选人会说"我用 Claude Code 写了 CRUD"；你能说清"proposal → tasks → 实现 → verify → archive，且 spec 与代码同版本"，这是不同层次的回答。

## 5. 落地方案（OpenSpec）

### 5.1 目录

```
openspec/
├─ project.md                     # 业务、角色、术语、非目标（由 docs/plan/01-scope.md 迁移）
├─ specs/
│  ├─ customers/spec.md           # 当前有效规格（archive 后沉淀）
│  └─ orders/spec.md
├─ changes/
│  ├─ 001-customer-crud/
│  │  ├─ proposal.md              # 为什么做、做什么、不做什么
│  │  ├─ design.md                # 关键取舍（链接 ADR）
│  │  ├─ tasks.md                 # 可勾选任务，一条≈一个 commit
│  │  └─ specs/customers/spec.md  # delta：ADDED / MODIFIED 需求
│  ├─ 002-order-crud/
│  └─ 003-rbac-readonly/
└─ archive/                       # M7 归档，保留历史
```

### 5.2 三个 change 的切法

| change | 范围 | 对应里程碑 |
|---|---|---|
| `001-customer-crud` | 客户列表 + 表单 + 删除 + URL 状态 + 契约 | M2–M4 |
| `002-order-crud` | 订单列表 + 异步客户 + 金额 + 状态机 | M5 |
| `003-rbac-readonly` | 登录、角色、只读、接口层 403 | M6 |

一个 change 对应一段可验收的增量，不是一个页面。这样 `tasks.md` 天然就是 commit 计划。

### 5.3 需求 ID 与追溯

规格里每条需求一个稳定 ID：

```markdown
### CUS-03 删除有关联订单的客户必须被拒绝
- WHEN 客户存在任意状态订单
- THEN 返回 409 CUSTOMER_HAS_ORDERS，details.orderCount 为订单数
- AND UI 展示"该客户有 3 个订单，请先归档或转移"
```

- e2e 用例标题带上 ID：`test('CUS-03 删除有订单的客户被拒绝')`。
- README 放一张 12 行的追溯矩阵：需求 ID → 实现文件 → 测试 → commit。
- `pnpm spec:check` 脚本扫描所有 `### [A-Z]{3}-\d{2}`，断言每个 ID 至少被一个测试文件引用。

这一步是"spec 不是摆设"的证明，成本只有几十行脚本。

### 5.4 命令与门禁

- 内置：`/opsx:propose`、`/opsx:apply`、`/opsx:verify`、`/opsx:archive`。
- 自研保留：`/change`（opsx propose 的项目化封装）、`/review`、`/fix-ci`（后两个管代码质量，不和 opsx 重叠）。
- `scripts/verify.mjs` 增加一步：`spec:validate` = `openspec validate --strict` + `spec:check`。
- M7 收口：三个 change 全部 archive，`openspec/specs/` 即最终规格。

### 5.5 三份文件的分工（防止双真相）

| 文件 | 只回答一个问题 | 更新时机 |
|---|---|---|
| `AGENTS.md` | 代码**怎么写** | 规则变化时 |
| `openspec/` | **做什么、改了什么、是否验收** | 每个 change |
| `docs/adr/` | **为什么这么选** | 不可逆决策时 |

## 6. 风险与对策

| 风险 | 对策 |
|---|---|
| spec 写成小说 | 每模块 ≤ 2 页；只写可验收的条目，不写背景抒情 |
| AI 自行改 spec 迁就实现 | proposal/需求变更必须单独 commit 并人审；`/opsx:apply` 禁止改需求 |
| 忘记 archive | M7 清单 + CI 检查 `changes/` 下未归档数量为 0 |
| 工具不熟、卡住 | M0 预留 45 分钟 spike；失败则退回手写 `docs/specs/*.md`，结构照抄，流程不变 |
| 评审者不熟 OpenSpec | README 一页说明 + 演示时 1 分钟带过"change 在哪、archive 在哪" |
| 与计划文档重复 | `docs/plan/01-scope.md` 迁移后删除，只留链接，不并行维护 |

## 7. 答辩话术（30 秒）

> 需求先落成 spec：每个 change 有 proposal 和 tasks，验收标准带稳定 ID，e2e 用例直接引用这些 ID，所以"需求有没有被实现"是可查的。实现完 archive，spec 永远和代码同版本。工具选 OpenSpec 而不是 Spec Kit，是因为两天里变更频繁、需要 delta 和 validate 门禁；Spec Kit 的 constitution + plan 层对单人两模块属于重复建设。

## 8. 如果面试官偏好 Spec Kit

做法：用它的 `constitution.md` 承担 AGENTS.md 的规范段，`spec.md / plan.md / tasks.md` 用它的模板，其余（verify、commands、契约、MSW）不动。预计多花 1 小时，收益是"流程更完整"，代价是产物更多、单人维护成本更高。

**不要两套并存**——同时出现 `openspec/` 和 `.specify/` 会立刻暴露"工具堆砌"，这是答辩减分项。
