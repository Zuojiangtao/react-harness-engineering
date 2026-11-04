# 05 测试策略

## 1. 原则

1. **测行为，不测实现**：断言"筛选后 URL 变了、列表剩 3 行"，不断言"调用了 setFilters"。
2. **测试是给 AI 的反馈信号**：用例要能在实现写错时失败。写完一条测试，手动改坏实现验证它会红——这一步写进 DoD。
3. **不追覆盖率数字**：只对 `shared/ui`、`shared/lib`、schema 设阈值；页面靠 e2e 覆盖主路径。
4. **同一个 mock，两种运行环境**：Vitest 用 `msw/node`，浏览器用 `msw/browser`，handlers 只有一份。

## 2. 分层与取舍

| 层   | 占比（数量） | 覆盖对象                                                               | 不做什么                 |
| ---- | ------------ | ---------------------------------------------------------------------- | ------------------------ |
| 单元 | 40%          | 格式化、URL 序列化、状态机、zod schema、错误归一化                     | 不测第三方组件库         |
| 组件 | 25%          | DataTable 三态、ResourceForm 校验与 422 回填、FilterBar、ConfirmDialog | 不做整页快照             |
| 集成 | 25%          | 列表查询链路、创建/编辑/删除、状态流转（MSW + RTL）                    | 不重复测单元已覆盖的分支 |
| e2e  | 10%          | 登录、客户 CRUD、订单生命周期、viewer 只读、URL 还原                   | 不覆盖边界校验细节       |

## 3. 用例清单

### 单元

| 对象               | 用例                                                   | 断言要点                           |
| ------------------ | ------------------------------------------------------ | ---------------------------------- |
| `format.ts`        | 分 → 元、负值、千分位、0                               | `1234567` → `¥12,345.67`           |
| `format.ts`        | 日期格式化、无效值                                     | 空值显示 `—` 而不是 `Invalid Date` |
| `useUrlState`      | 默认值不进 URL；非法值回落；数字反序列化               | `?page=abc` → 1，且不抛错          |
| `order-machine.ts` | 合法/非法流转矩阵（4 状态 × 3 动作）                   | 非法返回原因码                     |
| `schema`           | 名称长度、手机号、金额上下界、空字符串转 undefined     | 错误 path 精确到字段               |
| `client.ts`        | 非 2xx 且 body 非法 JSON → `INTERNAL`；422 → 带 fields | UI 永远拿到稳定结构                |

### 组件

| 组件          | 用例                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------ |
| DataTable     | loading 时只出 loading、不闪空态；error 显示重试并可点击；empty 显示行动按钮；ready 渲染行与操作 |
| DataTable     | 点击表头触发 `onQueryChange(sort)`；排序箭头与 URL 一致；分页边界禁用                            |
| ResourceForm  | 必填为空时提交被拦、错误定位到字段；服务端 422 回填到对应字段；提交中禁用按钮防重复              |
| AsyncSelect   | 输入 2 字符才请求；防抖只发一次；无结果时显示空态                                                |
| ConfirmDialog | Esc 关闭、焦点回到触发按钮、危险操作按钮文案包含对象名                                           |

### 集成（MSW）

| 场景     | 步骤                      | 断言                                               |
| -------- | ------------------------- | -------------------------------------------------- |
| 列表筛选 | 输入关键词 → 选 level     | 请求只发一次（防抖生效）；URL 含参数；结果行数正确 |
| 创建     | 打开抽屉 → 填表 → 提交    | POST body 金额为分；列表出现新行；toast 出现       |
| 校验失败 | 提交重名/超长             | 不关闭抽屉；字段下方显示服务端文案                 |
| 删除冲突 | 删除有订单的客户          | 对话框展示"有 3 个订单"；列表不变                  |
| 状态流转 | paid 订单点退款           | 行状态变为"已退款"；再点其他动作按钮消失           |
| 非法流转 | 直接调 transition 到 paid | 提示"当前状态不允许"；回滚为原状态                 |
| 权限     | viewer 调删除接口         | 403 且 UI 提示无权限（不是静默失败）               |

### e2e（Playwright）

1. 登录 → 客户列表 → 按关键词+等级筛选 → 刷新 → 筛选仍在 → 清空 → 恢复。
2. 新建客户 → 列表可见 → 编辑名称 → 详情页显示新名称。
3. 删除无订单客户 → 行消失；删除有订单客户 → 冲突提示。
4. 为客户建订单 → 金额展示正确 → 确认收款 → 退款 → 删除按钮不可用。
5. viewer 登录 → 无"新建"按钮 → 直接访问 `/customers/new` 被重定向。
6. `http` 模式 project：起本地 server，跑 1–4 的同一批用例。

## 4. 测试基建

```tsx
// test/utils.tsx
export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        {' '}
        {/* App 提供 message/modal/notification 上下文，缺了它 useApp() 会报错 */}
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>,
  )
}
```

```ts
// test/setup.ts
import { server } from './msw/server'
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetDb()
}) // 状态隔离，避免用例互相污染
afterAll(() => server.close())
```

关键约定：

- `onUnhandledRequest: 'error'`：漏配 handler 直接失败，而不是静默放过。
- 每个用例后 `resetDb()`，种子数据固定，用例之间零依赖。
- 时间用 `vi.setSystemTime` 固定，`createdAt` 断言不随机器时间漂移。
- 查询优先 `getByRole` / `getByLabelText`，`data-testid` 只用于表格行操作这类无稳定语义的元素。
- 不 mock `fetch`，只 mock 网络层（MSW），保证 client、错误归一化、Query 全链路都被测到。

### AntD 在 jsdom 里的坑（M3 一次性处理掉）

```ts
// test/setup.ts 追加
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
```

- `renderWithProviders` 必须包 `ConfigProvider + App`，否则 `App.useApp()` 抛错、`message` 不显示。
- Modal / Drawer 渲染在 portal 里：用 `await screen.findByRole('dialog')` 等挂载，**不要断言动画中间态**，也不要测 antd 内部的下拉定位。
- 表格开了 `scroll={{ x }}` 才会用到 ResizeObserver；组件测试尽量不传 `scroll`，横向滚动交给 e2e。
- 日期断言固定 `vi.setSystemTime`，并显式 `dayjs.locale('zh-cn')`。
- 只测我们封装的行为（三态、422 回填、URL 变化），不测 antd 自身（分页按钮结构、Tooltip 位置）。

## 5. e2e 稳定性

- 禁止 `waitForTimeout`；用 `expect(locator).toBeVisible()` 的自动等待。
- 每个 test 用独立 context；登录态用 `storageState` 复用，不重复点登录。
- 数据准备走 API（`request.post('/api/customers')`）而不是点 UI，缩短用例。
- `webServer` 起 `pnpm dev`，`reuseExistingServer: !process.env.CI`。
- 失败自动留 trace + 截图，CI 上传 artifact。
- 合并前本地 `--repeat-each=3` 跑一遍，抖动用例直接修，不重试掩盖。

## 6. 覆盖率与门禁

```ts
// vitest.config.ts
coverage: {
  provider: 'v8',
  include: ['src/shared/**', 'src/features/**/schema.ts'],
  thresholds: { lines: 80, functions: 80, branches: 70 },
}
```

页面与布局不进覆盖率统计（e2e 负责），避免为了数字写无意义用例。

## 7. 明确不测

- antd 组件内部行为（分页按钮结构、下拉定位、动画），信任上游。
- 纯样式与响应式断点（人工看一次 + 截图）。
- 整页 DOM 快照（脆弱、噪声大）。
- mock 的延迟与故障注入本身（它只是开发工具）。

## 8. 回归纪律

> 每修一个 bug，先写一条能复现的失败测试，再修。

这条写进 PR 模板。面试时能指着某条 commit 说"这个 409 分支就是这么补上的"，比说"我很重视质量"有效。
