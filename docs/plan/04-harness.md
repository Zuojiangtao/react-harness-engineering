# 04 Harness 体系

> **状态：设计稿。** 本文记录目标方案与取舍，不是当前实现的完整清单；实际命令、门禁与已知限制以 [AGENTS.md](../../AGENTS.md) 和 [README.md](../../README.md) 为准。文中标注「规划」的项未实现，OpenAPI/契约导出也未接入 CI。

## 0. 先把词定义清楚

> **脚手架**：一次性生成目录和样板代码。
> **Harness**：让 AI 与人**持续**产出正确代码的上下文、约束、反馈回路、工作流程与过程证据。

本题考的是后者。所以交付物里必须能看到"AI 写错时，是什么拦住了它"，而不只是"AI 帮我写了 5000 行"。

## 0.5 最终交付的 harness 是什么（面试官视角）

**它不是某个目录，而是"接手成本"。**

一句可检验的定义：

> 换一个人、或换一个新的 AI 会话，只读仓库里的东西，能否在 30 分钟内安全地加一个字段、或加一个同类模块，并且改错时被自动拦住。

所以交付物按"能被怎么用"分四篮，而不是按"我写了什么"分：

| 篮子       | 具体产物                                                                                            | 面试官会怎么用                         |
| ---------- | --------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **可执行** | `pnpm verify`、`pnpm test:e2e`、CI workflow、`pnpm spec:validate`、`pnpm dev`（mock 默认）          | 当场跑一遍，看耗时与失败信息是否可定位 |
| **可阅读** | `AGENTS.md`、`.claude/commands/`、`docs/rules.md`、`openspec/`、`docs/adr/`、README 的 harness 一节 | 读 10 分钟，判断"新会话能不能接上"     |
| **可复用** | 目录骨架、`shared/ui` 的 DataTable/ResourceForm、命令模板、CI 模板、spec 模板                       | 问"加第三个模块要多久、要改 shared 吗" |
| **可验证** | git log 粒度、CI 运行记录、`docs/iteration-log.md`、契约覆盖 17/17、`verify` 耗时                   | 用事实核对"快速且高质量"这句话         |

### 面试官真正想确认的三层

1. **表层**：你会用 AI，但不是被 AI 用——能说清哪段是 AI 写的、你改了什么、为什么改。
2. **中层**：这套东西**可交接**。新人 + 新会话能在半小时内加一个字段，而不是只能由你本人维护。
3. **深层**：你有**取舍判断**——知道什么该自动化（lint、类型、契约、回归），什么必须人审（抽象边界、业务规则、错误文案），什么不值得做（视觉、图表、多标签页）。

### 5 分钟验收路径（建议写进 README，主动引导面试官）

```bash
pnpm i && pnpm dev          # 1) 能不能起来、种子数据是否有
cat AGENTS.md               # 2) 加一个字段要改哪些文件，能否照着做
# 故意在组件里写 fetch，跑 pnpm lint   # 3) 约束是否真的生效
pnpm verify                 # 4) 全绿 + 耗时数字
git log --oneline           # 5) 迭代粒度是否可信
```

### 一眼减分的五件事

- 单独建一个 `harness/` 目录摆样子，却没有一条能跑的命令；
- 文档是 AI 生成腔（大段形容词、没有具体命令和文件路径）；
- `eslint-disable` / `any` / `@ts-ignore` 满屏，门禁被自己绕过；
- 测试只覆盖工具函数，核心链路的错误分支从没被测过；
- 演示时手动改 mock 数据来"制造"效果。

## 1. 六层与验收

| 层     | 产出物                                                                 | 解决什么问题                             | 怎么算做到                                                      |
| ------ | ---------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| 上下文 | `AGENTS.md`、`docs/rules.md`、`openspec/`、`docs/adr/*`                | AI 不知道项目约定，每次都要重新解释      | 新开会话只读 AGENTS.md 就能改对一个字段；需求能从 spec 追到测试 |
| 约束   | TS strict、ESLint（含 boundaries）、Prettier、commitlint、env zod 校验 | 错误在写的时候就被挡住，而不是 review 时 | 故意在组件里写 `fetch` 会被 lint 拦下                           |
| 反馈   | `pnpm verify`、Vitest、Playwright、契约测试                            | AI 无法自己判断对错，只能猜              | 一次 verify ≤ 120s，失败信息能定位到文件行                      |
| 流程   | 4 个 slash command + OpenSpec 的 `/opsx:*`、PR 模板、spec 模板         | 任务边界不清导致大改和返工               | 新模块按配方 7 步走完，无需口头补充                             |
| 证据   | git log、`docs/iteration-log.md`、ADR、CI 徽章                         | 面试官无法验证"过程"                     | 每条 P0 功能都能指出对应 commit 与测试                          |
| 度量   | verify 时长、端点覆盖、模块接入成本                                    | 不知道 harness 是否在退化                | README 里给出三个数字并随迭代更新                               |

## 2. AGENTS.md 草案（可直接落盘）

```markdown
# AGENTS.md

本文件是给 AI 编码代理（Claude Code / Codex）和人类协作者的唯一入口。
改代码前必须先读第 3、4、5 节。

## 1. 项目

企业服务公司的内部 CRM：客户 + 订单。SPA，无 SSR。后端不存在，用 MSW 按契约模拟。

## 2. 命令

| 命令                   | 作用                                                | 何时跑             |
| ---------------------- | --------------------------------------------------- | ------------------ |
| pnpm dev               | 启动（默认 mock 模式）                              | 开发               |
| pnpm dev:http          | （规划）指向本地真后端 :8787                        | 换后端演练         |
| pnpm verify            | lint + boundaries + typecheck + test + spec + build | **每次提交前必跑** |
| pnpm test / test:watch | 单元与集成测试                                      | 改逻辑时           |
| pnpm test:e2e          | Playwright                                          | 改交互后           |
| pnpm contract:openapi  | （规划）由 zod 导出 OpenAPI                         | 改契约后           |
| pnpm spec:validate     | 校验 openspec 规格与需求 ID 追溯                    | 改需求后           |
| pnpm db:reset          | （规划）重置 mock 种子；当前刷新页面即可            | 演示前             |

> 标（规划）的命令当前未在 `package.json` 实现；实际命令以 [AGENTS.md](../../AGENTS.md) 为准。

## 3. 目录与依赖方向

src/app → src/pages → src/features/* → src/shared
依赖只能向下。shared 不认识 features；features 之间禁止互相 import。

## 4. 硬规则（Must）

1. 所有 HTTP 走 `shared/api/client.ts`。组件、hook 里出现 fetch/axios 即错。
2. 新接口的顺序固定：改 schema → 改 mock handler → 跑契约测试 → 再写 UI。禁止先写 UI 再补契约。
3. 列表/表格必须用 `shared/ui/data-table`；表单必须用 `shared/ui/resource-form`。要扩展就改共享组件的 props，不允许在 feature 里复制一份。
4. 任何用户可见的数据区域必须覆盖 loading / empty / error 三态，error 必须可重试。
5. 筛选、分页、排序写入 URL；默认值不写入。
6. 金额一律整数分（`amountCents`），展示用 `MoneyText`；禁止在业务代码里做浮点乘除。
7. 跨模块复用的逻辑放 `shared/lib`，先有两个调用点再抽取。
8. 提交信息用 Conventional Commits，一个提交只做一件事。
9. 新增依赖必须在提交说明里写"为什么现有方案不够"。
10. 修 bug 必须同时补一条会失败的测试。

## 5. 禁止（Never）

- 在组件里 `fetch`、`axios`、`useEffect` 里手写请求。
- `any`、`@ts-ignore`、`eslint-disable`（确有必要时，同一行写明原因，并在 review 中说明）。
- 用 `useEffect` 把 Query 数据同步到本地 state（需要派生值就用 `useMemo` 或选择器）。
- 复制粘贴表格/表单实现来"先跑通"。
- 为了让测试通过而修改断言（测试错了要先说明理由）。
- 直接改 mock 数据绕过校验逻辑。
- 引入第二套样式体系（CSS-in-JS、AntD 主题等）。
- 提交 `console.log`、注释掉的代码、未使用的导出。

## 6. 新增一个业务模块（7 步）

1. 用 `/opsx:propose` 开一个 change（`proposal.md` + `tasks.md` + spec delta），列清实体、字段、接口、状态与验收。
2. 在 `shared/api/schema.ts` 加实体与 filters schema，导出类型。
3. 在 `mock/handlers/<module>.ts` 实现 5 个端点（list/get/create/update/delete），注册到 `handlers/index.ts`，跑契约测试。
4. 在 `features/<module>/` 建 `api.ts`（调 client）、`columns.tsx`、`form.ts`、`hooks.ts`。
5. 在 `pages/<module>/` 建 list 页，接 `useResourceList` + `DataTable` + `ResourceForm`。
6. 加路由与侧边栏入口（含权限判断）。
7. 补三类测试：schema 单测、列表集成测试、e2e happy path；跑 `pnpm verify`。

## 7. 改契约的顺序

schema → 失败测试 → handler → 前端类型 → openapi 导出 → 全量 verify。
顺序反了会出现"类型对但运行时 500"。

## 8. Definition of Done（提交前逐条打勾）

- [ ] `pnpm verify` 全绿
- [ ] 新逻辑有测试，且测试在改坏实现时会失败（手动验证一次）
- [ ] 三态齐全，错误文案对用户可读
- [ ] URL 状态可还原，刷新不丢筛选
- [ ] 权限：viewer 看不到入口，接口层也拒绝
- [ ] 无新增 any / ts-ignore / eslint-disable
- [ ] 无跨 feature import（lint 已保证）
- [ ] 键盘可完成主要操作，焦点可见
- [ ] 提交信息符合规范，diff 内无无关改动
- [ ] 如果改了契约，openapi 已重新导出
- [ ] 如果改了需求，`openspec/changes/<id>/tasks.md` 已勾选、spec delta 已更新

## 9. 已知陷阱

- MSW 在 `pnpm build && pnpm preview` 下默认不启用；e2e 必须用 mock 模式的 dev server，或显式开 `VITE_API_MODE=mock` 的 preview。
- `import.meta.env` 只能读字符串；数字要用 zod `coerce`。
- React Router 的 searchParams 是字符串，分页参数必须 `Number()` 后再进 schema。
- TanStack Query v5 的 `onSuccess` 已从 useQuery 移除，提示逻辑放 mutation 的 `onSuccess`。
- Windows 下 Playwright 的 `webServer` 命令要用 `pnpm exec`，不要依赖全局。

## 10. 不确定时

- 契约有歧义：先改 schema 并在 PR 描述里写明假设，不要私自扩展字段。
- 需求没覆盖：在 spec 里加"待确认"，按最小实现推进，不猜产品意图。
- 测试与实现冲突：先确认哪个是错的，把判断写进 commit message。
```

## 3. Slash commands

`.claude/commands/` 下四个文件（`change` / `new-module` / `review` / `fix-ci`），每个都是"可重复执行的工作流"，不是提示词收藏夹。

它们与 OpenSpec 的 `/opsx:propose`、`/opsx:apply`、`/opsx:verify`、`/opsx:archive` 是**互补**关系：opsx 管"做什么、做完没有"，这四个管"代码写成什么样、坏没坏"。`/change` 是 opsx propose 的项目化封装（带模板、ID 规则、测试计划），其余三个不重复实现 opsx 流程。

如果团队用 CodeBuddy（与 `antd-vue3-admin` 一致），把同样内容放到 `.codebuddy/skills/`，`AGENTS.md` 仍是唯一入口——换工具不换规范。

### `/change <模块名>`

```
用 OpenSpec 开一个 change（openspec/changes/<NNN>-<module>/），基于 AGENTS.md 与 docs/plan/01-scope.md 生成三份产物：
proposal.md（为什么做 / 做什么 / 不做什么）、tasks.md（每条 ≈ 一个提交，可勾选）、
specs/<module>/spec.md（delta 需求，每条带稳定 ID，如 CUS-01）。
必须覆盖：实体与字段（类型、约束、默认值）/ 接口清单（method、path、请求、响应、错误码）/
状态与流转 / 列表页交互 / 表单校验 / 权限 / 验收标准（Given-When-Then）/ 测试计划（每条需求对应哪条 e2e）。
约束：不写实现代码；字段命名与已有 schema 一致；有歧义列到"待确认"而不是自行决定。
完成后输出 5 行摘要、3 个最需要人确认的问题，并跑 openspec validate --strict。
```

### `/new-module <模块名>`

```
按 AGENTS.md 第 6 节的 7 步实现 <模块名>。
先输出计划（改哪些文件、每步验证命令），等我确认后再执行。
每完成一步立即跑对应的验证命令；失败先修，不要继续下一步。
禁止修改 shared/ui 的既有 props 语义；需要扩展时先说明理由。
最后跑 pnpm verify，把结果（通过/失败项）贴出来。
```

### `/review`

```
审阅当前 git diff，按 AGENTS.md 第 8 节的 DoD 逐条检查，另外重点看：
1) 是否有跨 feature 依赖或重复实现；2) 三态是否齐全；3) 错误分支是否可达；
4) 是否有 useEffect 同步服务端状态；5) 金额/日期是否走了统一工具；
6) a11y：label、aria、键盘可达；7) 测试是否真能失败。
输出：阻断项（必须改）/ 建议项（可延后）/ 已确认无问题的点。不要直接改代码。
```

### `/fix-ci`

```
读取 <CI 日志或本地命令输出>，定位第一个真实失败原因。
只做最小修复；禁止通过删除测试、放宽断言、加 any、跳过 lint 来让 CI 变绿。
如果判断是测试本身写错，先说明证据，再改测试。
修完跑 pnpm verify，并说明"为什么这次不会再失败"。
```

## 4. `pnpm verify` 脚本

```js
// scripts/verify.mjs
import { spawnSync } from 'node:child_process'

const steps = [
  ['lint', 'eslint . --max-warnings=0'],
  ['typecheck', 'tsc --noEmit'],
  ['test', 'vitest run --coverage'],
  ['spec', 'node scripts/check-spec.mjs'], // openspec validate --strict + 需求 ID 追溯
  ['contract', 'node scripts/check-contract.mjs'],
  ['build', 'vite build'],
]

const started = Date.now()
const failed = []
for (const [name, cmd] of steps) {
  const t = Date.now()
  const [bin, ...args] = cmd.split(' ')
  const r = spawnSync(bin, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  console.log(`${r.status === 0 ? 'PASS' : 'FAIL'} ${name} ${Date.now() - t}ms`)
  if (r.status !== 0) {
    failed.push(name)
    break
  } // 快速失败，先修第一个
}
console.log(
  `\nverify ${failed.length ? 'FAILED: ' + failed.join(',') : 'OK'} in ${Date.now() - started}ms`,
)
process.exit(failed.length ? 1 : 0)
```

> 当前实际脚本见 [`scripts/verify.mjs`](../../scripts/verify.mjs)：包含 format、lint、boundaries、typecheck、test、spec、build；不包含下例中的 `contract` 步骤，契约由 `src/shared/api/endpoints.test.ts` 覆盖。

设计点：

- **快速失败**：第一个红的就停，避免一屏错误。
- **打印每步耗时**：harness 的性能也是 harness 的一部分，超过 90s 就要优化。
- 只依赖 node，跨平台；不引 `npm-run-all`。
- `check-contract.mjs` 做三件事：端点数与 handler 数一致、每个响应能过 schema、openapi 无未提交 diff。

## 5. CI

```yaml
name: ci
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { run_install: false }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test -- --run
      - run: pnpm contract:openapi && git diff --exit-code contract/
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report/ }
```

> 上面是设计示例；当前 CI 只跑 `verify` + Playwright，不执行 `contract:openapi`。失败时会上传 `playwright-report/` 与 `test-results/`。

CI 的作用不只是"跑测试"，而是**给 AI 一个外部的、不可争辩的对错信号**。本地 hook 可以省，CI 不能省。

## 6. AI 反模式 → 门禁对照

这张表是 harness 的"为什么"，答辩时直接讲它。

| AI 常见错误                        | 症状                     | 拦住它的东西                                |
| ---------------------------------- | ------------------------ | ------------------------------------------- |
| 在组件里直接 fetch                 | 换后端要改 10 个文件     | ESLint `no-restricted-globals` + boundaries |
| 跨 feature 引用                    | 模块耦合，删一个崩一片   | `eslint-plugin-boundaries`                  |
| 复制一份表格"先跑通"               | 两处样式和行为漂移       | review 清单 + 后续重构 commit（有记录）     |
| 用 useEffect 把 query 数据塞 state | 竞态、闪屏、双请求       | review 清单 + 集成测试断言请求次数          |
| 只写 happy path                    | 空态一片白、409 时白屏   | 三态检查 + e2e 错误场景                     |
| 改测试让实现通过                   | 测试形同虚设             | `/fix-ci` 明令禁止 + review 看 diff         |
| 手写浮点金额                       | 0.1+0.2 问题、四舍五入错 | `MoneyText` + 单测 + 类型命名 `amountCents` |
| 幻觉依赖或 API                     | 装不上、运行时报错       | lockfile + 每次类型检查                     |
| 一次提交 800 行                    | 无法 review、无法回滚    | commit 规范 + verify 快速失败               |
| 绕过 mock 校验                     | 契约测试假绿             | handler 内 zod 校验 + 出参校验              |

## 7. 过程证据

### `docs/iteration-log.md` 模板

```markdown
## 2026-11-04 14:20 客户列表：URL 状态

- 任务：把 page/keyword/level 从 useState 迁到 searchParams
- 给 AI 的上下文：AGENTS.md + 02-architecture.md 第 4 节 + 现有 useResourceList
- AI 产出：一次成型，但把默认值也写进了 URL
- 拦截：集成测试断言"默认 URL 无参数"失败
- 修正：序列化时跳过默认值；补一条测试
- 耗时：35min（其中返工 12min）
```

八到十条这样的记录，比任何"我熟练使用 AI"的自我评价都有说服力。

### 提交纪律

- 一个提交 = 一个可验证的切片，message 写明"做了什么 + 为什么"。
- 每个提交都跑过 `verify`；重构与功能分开提交。
- 重构共享组件时，先提交"给 A 加测试"，再提交"抽组件 + A 改用"，最后"B 接入"——三步都能独立回滚。

## 8. 度量（写进 README）

| 指标               | 目标               | 怎么测                       |
| ------------------ | ------------------ | ---------------------------- |
| `pnpm verify` 耗时 | ≤ 120s             | 脚本自带计时                 |
| 端点契约覆盖       | 17/17              | `check-contract` 输出        |
| 新增同类模块成本   | ≤ 1h 且不改 shared | 第三个模块的实际 commit 时间 |
| 提交到绿的比例     | 100%               | CI 记录                      |
| e2e 稳定性         | 连跑 3 次全绿      | 本地 `--repeat-each=3`       |
