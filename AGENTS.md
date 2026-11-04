# AGENTS.md

本文件是给 AI 编码代理（Claude Code / Codex / CodeBuddy）和人类协作者的唯一入口。
改代码前必须先读第 3、4、5 节；新增模块按第 6 节的配方走。

## 1. 项目

企业服务公司的内部 CRM：客户（Customers）+ 订单（Orders）。SPA，无 SSR。
后端不存在：用 MSW 按 [Zod 契约](./src/shared/api/schema.ts) 模拟，`VITE_API_MODE=http` 时可切到同契约的本地 server。

- 业务规则：[openspec/project.md](./openspec/project.md)
- 架构与取舍：[docs/plan/02-architecture.md](./docs/plan/02-architecture.md)
- Harness 说明：[docs/plan/04-harness.md](./docs/plan/04-harness.md)

## 2. 命令

| 命令 | 作用 | 何时跑 |
|---|---|---|
| `pnpm run dev` | 启动（默认 mock 模式） | 开发 |
| `pnpm run verify` | lint + boundaries + typecheck + test + spec + build | **每次提交前必跑** |
| `pnpm run test` / `pnpm run test:watch` | 单元与集成测试 | 改逻辑时 |
| `pnpm run test:e2e` | Playwright | 改交互后 |
| `pnpm run spec:validate` | `openspec validate --strict` + 需求 ID 追溯 | 改需求后 |

> OpenAPI 导出与独立 `db:reset` 命令当前未实现：契约以 Zod + 契约测试为准，mock 数据刷新页面即重置。不要把它们写进提交说明或 README 的“已实现”清单。

> 包管理器固定为 pnpm 12（`package.json` 的 `packageManager`），锁文件是 `pnpm-lock.yaml`。不要混用 npm，也不要提交 `package-lock.json`；`nodeLinker: hoisted` 的原因见 [ADR 0004](./docs/adr/0004-pnpm.md)。

> TypeScript 固定在 6.x：typescript-eslint 尚不支持 TS 7。升级前先确认 lint 能过。

## 3. 目录与依赖方向

```
src/app → src/pages → src/features/* → src/shared
```

依赖只能向下。`shared` 不认识 `features`；`features` 之间禁止互相 import；`feature` 不得反向依赖 `app`。
规则由 `eslint-plugin-boundaries` 强制，违反即 lint 失败。

```
src/app        路由、Provider、布局、守卫
src/pages      路由级页面，只做编排
src/features   每个业务模块的 schema / api / columns / form / hooks
src/shared     ui 封装、api 客户端、mock、lib、config
openspec       规格与变更（做什么）
docs/adr       决策（为什么）
```

## 4. 硬规则（Must）

1. 所有 HTTP 走 `src/shared/api/client.ts`。组件、hook 里出现 `fetch` / `axios` 即错。
2. 新接口顺序固定：改 schema → 改 mock handler → 跑契约测试 → 再写 UI。禁止先写 UI 再补契约。
3. 列表必须用 `shared/ui/data-table`；表单必须用 `shared/ui/resource-form`。要扩展就加 props，不允许在 feature 里复制一份。
4. 任何用户可见的数据区域必须覆盖 loading / empty / error 三态，error 必须可重试。
5. 筛选、分页、排序写入 URL；默认值不写入。
6. 金额一律整数分（`amountCents`），展示用 `MoneyText`；禁止在业务代码里做浮点乘除。
7. 表单校验只写 Zod schema，不写 antd `rules`；服务端 422 用同一套映射回填。
8. 跨模块复用的逻辑放 `shared/lib`，先有两个调用点再抽取。
9. 提交信息用 Conventional Commits，一个提交只做一件事。
10. 新增依赖必须在提交说明里写"为什么现有方案不够"。
11. 修 bug 必须同时补一条会失败的测试。
12. 改了需求必须同步 `openspec/changes/<id>/tasks.md` 与 spec delta。

## 5. 禁止（Never）

- 在组件里 `fetch`、引入 `axios`、在 `useEffect` 里手写请求。
- `any`、`@ts-ignore`、`eslint-disable`（确有必要时同一行写明原因，并在 review 说明）。
- 用 `useEffect` 把 Query 数据同步到本地 state；派生值用 `useMemo` 或选择器。
- 复制粘贴表格/表单实现来"先跑通"。
- 为了让测试通过而修改断言（测试本身错要先说明证据）。
- 直接改 mock 数据绕过校验逻辑。
- 引入第二套样式体系（Tailwind / CSS-in-JS 混用）。
- 使用 `@ant-design/pro-components`（ProTable/ProForm）——本项目要自己组织表格与表单。
- 使用 unplugin 自动导入；一律显式 import。
- 提交 `console.log`、注释掉的代码、未使用的导出。

## 6. 新增一个业务模块（7 步）

1. `/change <module>`：用 OpenSpec 开 change，写 `proposal.md`、`tasks.md`、`specs/<module>/spec.md`（需求带稳定 ID）。
2. 在 `src/shared/api/schema.ts` 加实体与 filters schema，导出类型。
3. 在 `src/shared/api/mock/handlers/<module>.ts` 实现端点并注册；跑契约测试。
4. 在 `src/features/<module>/` 建 `api.ts`、`columns.tsx`、`form.tsx`、`hooks.ts`。
5. 在 `src/pages/<module>/` 建 list 页，接 `useResourceList` + `DataTable` + `ResourceForm`。
6. 加路由与侧边栏入口（含角色判断）。
7. 补三类测试：schema 单测、列表集成测试、e2e happy path；跑 `pnpm run verify`。

## 7. 改契约的顺序

schema → 失败测试 → handler → 前端类型 → `pnpm run verify`。
顺序反了会出现"类型对但运行时 500"。

## 8. Definition of Done（提交前逐条打勾）

- [ ] `pnpm run verify` 全绿
- [ ] 新逻辑有测试，且手动改坏实现时测试会红
- [ ] 三态齐全，错误文案对用户可读
- [ ] URL 状态可还原，刷新不丢筛选
- [ ] 权限：viewer 看不到入口，接口层也拒绝
- [ ] 无新增 `any` / `ts-ignore` / `eslint-disable`
- [ ] 无跨 feature import（lint 已保证）
- [ ] 键盘可完成主要操作，焦点可见
- [ ] 改了契约：端点契约测试已覆盖新增/变更的请求与响应
- [ ] 改了需求：openspec tasks 已勾选、spec delta 已更新
- [ ] 提交信息符合规范，diff 内无无关改动

## 9. 已知陷阱

- **AntD 6**：Modal/Drawer 的关闭销毁属性、`Form.validateFields` 的 reject 结构、主题 CSS 变量模式与 5.x 有差异，动组件前先查 6.x 文档；结论记在 `docs/adr/0002-antd-version.md`。
- **AntD 静态方法**：`message` / `modal` / `notification` 必须通过 `App.useApp()` 获取，直接 import 会丢主题与 locale。
- **MSW**：`pnpm run build && pnpm run preview` 默认不启用 mock；e2e 用 `pnpm run dev` 或显式 `VITE_API_MODE=mock`。
- **MSW 3**：`setupWorker` / `setupServer` 的 API 与 2.x 基本一致，但 `http` 命名空间从 `msw` 导入。
- **MSW worker**：`public/mockServiceWorker.js` 必须提交，否则 Vite 的 SPA fallback 会把 `index.html` 当脚本返回，浏览器报 `unsupported MIME type ('text/html')` 且 worker 注册失败。升级 msw 后跑 `pnpm exec msw init public`（路径已记录在 `package.json` 的 `msw.workerDirectory`）。
- **React Router 7**：`useSearchParams` 的参数是字符串，分页参数必须 `Number()` 后再进 schema。
- **TanStack Query v5**：`onSuccess` 已从 useQuery 移除，提示逻辑放 mutation。
- **Windows**：脚本用 node 实现，不依赖 shell 语法；路径统一 `node:path`。
- **pnpm**：`nodeLinker` 必须是 `hoisted`（见 `pnpm-workspace.yaml`）。本机文件沙箱无法 realpath 目录 junction，isolated 布局下 `is-odd → is-number` 这类嵌套依赖会 `Cannot find module`；改回 isolated 前先在沙箱里跑一次 `pnpm run verify`。
- **pnpm-lock.yaml**：pnpm 12 的锁文件可能是**双文档**（boot document + project lockfile），用 `---` 分隔，不是损坏。不要手工删前半段；读依赖图的工具要取最后一个 YAML 文档。
- **金额**：输入框按"元"、存储按"分"，转换只在 `features/**/form.ts` 与 `MoneyText` 两处。

## 10. 不确定时

- 契约有歧义：先改 schema，在 PR/提交说明里写明假设，不私自扩展字段。
- 需求没覆盖：在 change 里加"待确认"，按最小实现推进，不猜产品意图。
- 测试与实现冲突：先确认哪个错，把判断写进 commit message。
