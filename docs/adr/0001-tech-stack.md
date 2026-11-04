# ADR 0001：前端技术选型

- 状态：已采纳
- 日期：2026-11-03

## 背景

两天内交付一个可运行的 SaaS 后台，重点是工程系统（harness）而不是视觉。需要：快速起项目、稳定的表格/表单、可替换的 Mock、单一契约来源。

## 决策

| 领域       | 选择                         | 放弃                                                          |
| ---------- | ---------------------------- | ------------------------------------------------------------- |
| 构建       | Vite + React 19 + TypeScript | Next.js（无 SSR/SEO 需求，多一层运行时）                      |
| 组件       | Ant Design 6 + 薄封装        | ProComponents（会把考点外包）、自研组件库（成本过高）         |
| 服务端状态 | TanStack Query               | Redux / Zustand（没有跨页客户端状态）                         |
| 契约       | Zod 4 单一来源               | 手写 OpenAPI（会漂移）、Yup（类型推导弱）                     |
| Mock       | MSW（网络层）                | 组件内假数据（换后端要改业务代码）、json-server（多一个进程） |
| 路由       | React Router 7               | TanStack Router（团队更熟 RR，且本题路由简单）                |

## 后果

- 正面：依赖少、启动快、契约与 Mock 同源；换后端只改环境变量。
- 负面：AntD 定制空间有限；Zod 单一校验需要自己写 `setFields` 映射（约 20 行）。
- 约束：不引入第二套样式体系；不引入 ProTable/ProForm；不引入全局 store。

## 相关

- [0002 AntD 6 与工具链版本](./0002-antd-version.md)
- [0003 复用边界](./0003-reuse-boundary.md)
