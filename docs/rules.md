# 按需规则

> AGENTS.md 是入口；本文件是细则，只在相关任务时读对应小节。

## 1. 网络与契约

- 业务代码只调 `features/*/api.ts`；它内部用 `shared/api/client.ts`。
- 响应必须经 Zod 校验（`request(path, schema)` 已内置）；错误体解析失败回落 `INTERNAL`。
- 改契约顺序：schema → 失败测试 → handler → 前端 → openapi → verify。
- Mock 里也要校验入参与出参，否则契约测试会假绿。

## 2. 状态

- 服务端状态：TanStack Query；key 统一放 `query-keys.ts`，禁止手写字符串。
- 筛选/分页/排序：URL；默认值不写入 URL。
- 表单：antd Form 实例；不要再用 `useState` 维护一份表单值。
- 抽屉开关、选中行：本地 state。
- 禁止 `useEffect` 把 query 数据同步到 state；派生值用 `useMemo`。

## 3. 表格

- 必须用 `shared/ui/data-table`；列定义放在 `features/*/columns.tsx`。
- 三态由 `status` 联合类型驱动：`loading | error | empty | ready`。
- 分页受控，`current` 来自 URL；删除当前页最后一条时回退页码。

## 4. 表单

- 字段配置放 `features/*/form.tsx`；不写 antd `rules`。
- 提交时 `schema.safeParse`，失败用 `form.setFields` 回填。
- 服务端 422：同一套 `toFormErrors` 映射；409/500 用表单级 Alert。
- `money` 字段只在 `toPayload` 里做元→分转换。

## 5. 金额与日期

- 金额：整数分；展示 `MoneyText`；禁止 `parseFloat` 参与计算。
- 日期：存 ISO UTC；展示用 dayjs 本地时区；空值显示 `—`。

## 6. 权限

- 路由 `handle.roles` + `RequireRole`；菜单与路由同源。
- 按钮按角色不渲染（不是 disabled）；接口层仍要 403。
- 401 清 token 并跳登录，带 `redirect` 参数。

## 7. 测试

- 新逻辑必须有测试；写完手动改坏实现确认会红。
- 组件测试用 `renderWithProviders`（含 ConfigProvider + App）。
- 集成测试走真实 `client` + MSW，不 mock fetch。
- e2e 断言用 role/label，不用 CSS 选择器。

## 8. 提交

- Conventional Commits；一个提交一个切片；每次提交前 `pnpm run verify`。
- 重构与功能分开；契约变更单独成提交。
- 提交说明写"为什么"，不只写"改了什么"。
