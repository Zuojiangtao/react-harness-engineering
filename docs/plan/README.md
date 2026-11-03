# 面试题方案：React SaaS 后台 + Harness Engineering

> 本文档集是**动工前的方案**，不含业务代码。目标是在 16 小时内交出一个"跑得起来、复用站得住、harness 成体系、迭代有证据"的项目。

## 一页纸摘要

| 项 | 决定 |
|---|---|
| 业务 | 轻量 CRM：客户（Customers）+ 订单（Orders），1:N 关联 |
| 技术栈 | Vite + React 19 + TypeScript + Ant Design 6 + React Router + TanStack Query + Zod 4 + MSW |
| 契约 | Zod 为唯一来源，前端类型由它推导，MSW handler 按它实现，脚本导出 OpenAPI 给后端 |
| Mock | MSW 在网络层拦截，`VITE_API_MODE=mock\|http` 一行切换，另有同契约的本地 HTTP server 做换后端演练 |
| 复用 | 三层封顶：原语 → 模式（DataTable/ResourceForm/FilterBar）→ 资源 hook；**不做 DSL** |
| Harness | 上下文（AGENTS.md + openspec）+ 约束（TS/ESLint 边界/env 校验）+ 反馈（verify 一条命令）+ 流程（4 个 command + `/opsx:*`）+ 证据（ADR / 迭代日志 / CI / 需求追溯） |
| 规格 | OpenSpec：三个 change（客户 / 订单 / 权限），需求带稳定 ID 并被 e2e 引用，完成后 archive |
| 工期 | 2 天 / 16 小时，约 24 个可回滚提交，每个提交必须 `pnpm verify` 绿 |
| 演示 | 10 分钟脚本，最后一步演示"加一个字段只改 schema" |

## 核心判断

1. **题面免除视觉复杂度，等于把评分让给了工程系统。** 时间预算里 UI 只占 10%。
2. **CRUD 本身没有区分度，区分度在"约束"**：URL 承载筛选状态、金额用分存储、状态机而非自由改 status、403/409 有明确 UI、mock 与真后端同一份契约。
3. **复用要靠"写两遍再抽象"证明**，不是靠一个万能组件宣称。文档里要能回答："第三个模块要多久？要改 shared 吗？"
4. **"快速迭代"必须留痕**：commit 粒度、每次提交是否绿、AI 产出被哪道门禁拦下。这些是面试官唯一能验证"过程"的东西。
5. **harness 的验收标准是"接手成本"**：换人、换会话，30 分钟内能否安全加一个字段。见 [04 第 0.5 节](./04-harness.md)。

## 文档地图

| 文档 | 内容 | 谁看 |
|---|---|---|
| [01-scope.md](./01-scope.md) | 业务模型、字段与校验、状态机、权限矩阵、P0/P1/P2 功能与验收标准、非目标 | 评审者 / 自己定范围 |
| [02-architecture.md](./02-architecture.md) | AntD 集成约束、目录分层、依赖规则、状态归属、DataTable/ResourceForm/useResourceList 的 API 草案、与 Vue 模板的对应关系 | 评审者 / 写代码时对照 |
| [03-api-contract.md](./03-api-contract.md) | Zod 契约、端点表、错误码、分页排序约定、MSW 结构、模式切换、OpenAPI 导出、契约测试 | 自己 / 未来"后端" |
| [04-harness.md](./04-harness.md) | **harness 交付物与面试官验收**、六层、AGENTS.md 全文草案、command 骨架、verify 脚本、CI、DoD、AI 反模式与门禁对照 | 本题的评分主体 |
| [05-test-strategy.md](./05-test-strategy.md) | 测试金字塔取舍、用例清单、AntD 在 jsdom 的坑、e2e 场景、契约测试、防 flaky | 自己 |
| [06-delivery-plan.md](./06-delivery-plan.md) | 16 小时时间盒、24 条 commit 序列、演示脚本、交付清单、README 结构、风险、待确认问题 | 自己 / 汇报 |
| [07-spec-driven.md](./07-spec-driven.md) | OpenSpec vs Spec Kit、为什么用、怎么落地、需求追溯、答辩话术 | 评审者 / 自己 |

## 关键决策与理由

| 决策 | 备选 | 为什么选它 |
|---|---|---|
| 客户 + 订单 | 文章 + 分类、租户 + 成员 | 1:N 能自然长出异步下拉、关联删除约束、状态流转、金额格式化，不需要图表 |
| AntD 6 + 薄封装 | ProComponents / 自研组件库 / shadcn | 组件形态交给 AntD，我们只补三态、URL 同步、字段配置；ProTable 会把考点外包 |
| Zod 而非 OpenAPI 手写 | 先写 openapi.yaml | 少一份会漂移的真相；类型、校验、mock、文档一次定义，OpenAPI 由脚本产出 |
| MSW 而非组件内假数据 | json-server、mirage | 假数据留在网络层，换真后端不改业务代码；同一套 handler 还能跑测试 |
| TanStack Query 而非全局 store | Redux/Zustand | 题目没有跨页共享的客户端状态，引入 store 只会催生面条代码 |
| 三层复用封顶 | 配置驱动 CRUD 引擎 | 引擎的维护成本在第三个模块才显现，且面试官必问"加字段要改引擎吗" |
| 先写两遍再抽象 | 一开始就抽公共组件 | 第一次就抽象通常是猜的；两遍之后抽象出来的接口才贴合真实差异 |
| OpenSpec | Spec Kit / 手写 spec | 轻、变更制、`validate` 可当门禁；Spec Kit 的 constitution/plan 层对两天单人项目是重复建设 |
| 显式 import | unplugin 自动导入 | AI 与 review 需要可追踪的依赖图；这是对现有 Vue 模板的有意偏离 |

## 非目标（明确不做，并写进 README）

- 仪表盘、图表、大屏
- 复杂 RBAC（仅 admin / viewer 两角色）
- i18n、主题切换、暗色模式
- 列表虚拟滚动（数据量 ≤ 200 条）
- 富文本、文件上传
- 多标签页 / keep-alive（Vue 模板有，但对本题无收益）
- 真后端与数据库（只提供同契约的本地 server 用于演练）

## 下一步

方案确认后按 [06-delivery-plan.md](./06-delivery-plan.md) 的 M1 开始：初始化仓库 → 落 AGENTS.md 与 verify 脚本 → `openspec init` 与 change 001 → 契约 → 共享组件 → 模块 A。**先有门禁，再写业务**，顺序不能反。
