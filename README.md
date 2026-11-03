# CRM · React + AntD + OpenSpec

一个面向面试的 SaaS 后台：客户与订单两个业务模块，完整的增删改查、状态机、权限与 Mock 后端，以及一套可执行的 harness。

技术栈：React 19 · Ant Design 6 · TypeScript 6 · Vite 8 · TanStack Query 5 · Zod 4 · MSW 3 · Vitest 5。

## 快速开始

```bash
npm install
npm run dev          # http://localhost:5173
```

演示账号（已预填，也可以直接点按钮）：

| 角色 | 邮箱 | 密码 | 能力 |
|---|---|---|---|
| 管理员 | admin@example.com | admin123 | 全部操作 |
| 只读 | viewer@example.com | viewer123 | 只看，无写入口，接口层 403 |

Mock 数据：24 个客户、60 个订单；后 4 个客户没有订单，方便演示"可删除"。刷新页面数据重置。

## 命令

```bash
npm run dev            # 开发（默认 mock 模式）
npm run verify         # lint + typecheck + test + spec + build，快速失败
npm run test           # Vitest（schema / 契约 / 组件 / 页面）
npm run spec:validate  # openspec validate --strict + 需求 ID 追溯
npm run build          # 生产构建

# e2e（首次需要安装浏览器）
npx playwright install chromium
npm run test:e2e
```

`npm run verify` 当前约 10–18s，52 个测试，规格 11 条全部可追溯到测试。

## 功能

| 路由 | 说明 |
|---|---|
| `/login` | 两个演示角色一键进入 |
| `/customers` | 关键词/等级/状态筛选、排序、分页，全部写入 URL；新建/编辑抽屉；删除关联保护 |
| `/orders` | 状态/关键词筛选、金额排序；异步搜索客户；金额按分存储；状态机流转 |
| `*` | 404 |

业务规则（与 `openspec/` 一致）：

- 删除有订单的客户 → `409 CUSTOMER_HAS_ORDERS`，提示订单数，不级联删除。
- 订单只允许 `draft→paid`、`draft→cancelled`、`paid→refunded`，其余 `409 INVALID_TRANSITION`。
- 已收款订单不可删除，只能退款。
- 编辑使用 `updatedAt` 乐观锁，冲突返回 `409 STALE_WRITE`。
- 金额以整数分存储与传输，表单按元输入。

## 架构

```
src/app        路由、Provider、守卫、布局
src/pages      路由级页面，只做编排
src/features   每个模块的 schema / api / columns / form / hooks
src/shared     AntD 薄封装、HTTP client、MSW mock、通用 lib
openspec       规格与变更（做什么）
docs/adr       决策（为什么）
```

依赖只能向下：`app → pages → features → shared`。跨 feature import、组件内 `fetch` 都由 ESLint（`eslint-plugin-boundaries` + `no-restricted-globals`）拦下。

状态归属：

| 状态 | 位置 |
|---|---|
| 服务端数据 | TanStack Query |
| 筛选/分页/排序 | URL（`useUrlState`） |
| 表单 | antd Form 实例 |
| 抽屉、选中行 | 组件本地 state |
| 全局 store | 没有 |

复用分两层：`DataTable` / `ResourceForm` 是稳定的展示模式；`useResourceList` 是在客户、订单**两个调用点都出现之后**才抽出的编排逻辑（见 [ADR 0003](docs/adr/0003-reuse-boundary.md)）。加第三个同类模块的目标是 1 小时内完成且不改 `shared/`。

### AntD 约定

- 主题与语言走 `ConfigProvider`；`message/modal/notification` 一律 `App.useApp()`。
- 不用 `@ant-design/pro-components`：表格与表单的组织是本题要展示的能力。
- 表单只用 Zod 校验，不写 antd `rules`；422 与前端校验共用一套字段错误映射。
- AntD 6 细节与版本决策见 [ADR 0002](docs/adr/0002-antd-version.md)。

## Harness

| 层 | 位置 |
|---|---|
| 上下文 | [AGENTS.md](AGENTS.md)、[docs/rules.md](docs/rules.md)、[openspec/](openspec/) |
| 约束 | TS strict、ESLint 边界、Prettier、env Zod 校验、提交规范 |
| 反馈 | `npm run verify`、52 个测试、契约测试、`spec:validate` |
| 流程 | `.claude/commands/` 四个命令；OpenSpec 的 `/opsx:*` |
| 证据 | git 历史、[docs/iteration-log.md](docs/iteration-log.md)、[docs/traceability.md](docs/traceability.md) |

### 规格驱动

三个 change 对应三个里程碑，均已完成并归档（`openspec/changes/archive/`），当前生效规格在 `openspec/specs/`：

- `001-customer-crud`：CUS-01…CUS-06
- `002-order-crud`：ORD-01…ORD-05
- `003-rbac-readonly`：AUTH-01…AUTH-03

每条需求有稳定 ID，`scripts/check-spec.mjs` 会校验 OpenSpec 结构，并断言每个 ID 至少被一个测试引用。`npm run verify` 里这一步是硬的。

### 契约与 Mock

- 唯一来源：`src/shared/api/schema.ts`（Zod）。
- 17 个端点由 MSW 在网络层拦截；业务代码不知道自己在跟 mock 说话。
- `VITE_API_MODE=http` + `VITE_API_BASE_URL` 可切到真实后端，业务代码零改动。
- handler 内对入参和出参都做 Zod 校验，避免"mock 自己违反契约"。

```bash
VITE_API_MODE=http VITE_API_BASE_URL=http://localhost:8787/api npm run dev
```

## 关键决策

- [ADR 0001 技术选型](docs/adr/0001-tech-stack.md)
- [ADR 0002 AntD 6 与工具链版本](docs/adr/0002-antd-version.md)
- [ADR 0003 复用边界](docs/adr/0003-reuse-boundary.md)

## 已知限制

- 未提供独立的 HTTP server 做"换后端"端到端演练（契约与切换机制已就绪）。
- 客户/订单没有独立详情页，编辑走抽屉；批量删除只有接口，UI 未接。
- e2e 已提供两条冒烟用例（`e2e/auth.spec.ts`），需先安装浏览器；本机沙箱无法启动浏览器进程，未在本地执行，CI 中会跑。
- 列表未虚拟化（数据量 ≤ 60 条），这是有意的取舍。

## 我如何使用 AI

见 [docs/iteration-log.md](docs/iteration-log.md)：记录了哪些是 AI 一次写对的、哪些被测试或 lint 拦下、怎么修的。所有提交前的状态都跑过 `npm run verify`。
