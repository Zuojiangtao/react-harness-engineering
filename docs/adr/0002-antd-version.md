# ADR 0002：AntD 6 与工具链版本

- 状态：已采纳，版本核对待执行
- 日期：2026-11-03

## 背景

团队使用 AntD，npm 最新为 6.6.8，React 最新 19.3.1。

## 决策

- 使用 **AntD 6.6.x + React 19**，跟随当前主版本。
- **TypeScript 固定 6.0.x**：typescript-eslint 8.72 明确不支持 TS 7，升级前必须先确认 lint 可用。
- 不使用 `@ant-design/pro-components`；表格、表单自己包一层（见 ADR 0003）。
- 用 `App.useApp()` 取 `message/modal/notification`，不使用静态方法。
- 主题定制走 `ConfigProvider` token，不覆盖组件内部样式。

## 待核对清单（M3 开工前 30 分钟）

- [ ] Modal/Drawer 关闭销毁的属性名（`destroyOnClose` / `destroyOnHidden`）
- [ ] `Form.validateFields` 的 reject 结构与 `setFields` 入参
- [ ] `Table` 的 `pagination` / `onChange` / `rowSelection` 类型
- [ ] 主题是否默认 CSS 变量模式，对 token 覆盖的影响
- [ ] `@ant-design/icons` 6 的按需导入与 tree-shaking

若出现阻塞性问题，退回 5.27.x，其余设计不变。

## 后果

- 正面：使用当前主版本，答辩时可讲迁移与版本判断；与团队 AntD 技术栈同族。
- 负面：6.x 的资料少于 5.x，需要一次 API 核对；TypeScript 暂时不能升 7。
- 约束：升级 AntD 前先跑 `pnpm verify` 与一次手工回归（表格、表单、抽屉、提示）。
