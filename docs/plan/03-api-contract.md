# 03 API 契约与 Mock 方案

## 1. 原则

1. **一份真相**：`src/features/*/schema.ts` 与 `src/shared/api/schema.ts` 里的 Zod 是唯一来源；TS 类型、MSW 校验、OpenAPI 文档、契约测试全部从它派生。
2. **网络层唯一出口**：业务代码只调 `features/*/api.ts`，它内部用 `shared/api/client.ts`。组件里出现 `fetch` 即为 lint 错误。
3. **Mock 在网络层，不在组件层**：MSW 拦截 `fetch`，业务代码不知道自己在跟 mock 说话。换真后端 = 改一个环境变量。
4. **前后端协作顺序**：改 schema → 改 handler → 重新导出 OpenAPI → 后端照此实现 → 前端切 `http` 模式回归。契约变更是 PR 的第一等公民。
5. **版本基线**：Zod 4。格式校验用顶层 API（`z.email()`、`z.iso.datetime()`、`z.uuid()`），`.email()` / `.datetime()` 属于废弃写法；`z.record` 必须给 key 与 value 两个参数。

## 2. 通用结构

```ts
// 分页响应
export const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })

// 统一错误体
export const apiErrorSchema = z.object({
  code: z.enum([
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'INVALID_TRANSITION',
    'CUSTOMER_HAS_ORDERS',
    'CUSTOMER_INACTIVE',
    'ORDER_PAID',
    'STALE_WRITE',
    'INTERNAL',
  ]),
  message: z.string(),
  fields: z.record(z.string(), z.string()).optional(), // 字段级错误，key 为字段名
})
export type ApiErrorBody = z.infer<typeof apiErrorSchema>
```

约定：

- 成功：`200` 单资源 / `201` 创建 / `204` 删除（无 body）/ `207` 批量部分失败。
- 失败：`400` 参数不合法、`401` 未登录、`403` 无权限、`404` 不存在、`409` 业务冲突、`422` 字段校验失败、`500` 未预期。
- 所有列表接口统一 `page/pageSize/keyword/sort`；`sort` 用 `-field` 表示降序。
- 时间一律 ISO 8601 字符串（UTC），前端按本地时区展示。

## 3. 端点表

| #   | Method | Path                         | 请求                                                  | 响应                                                | 主要错误                      |
| --- | ------ | ---------------------------- | ----------------------------------------------------- | --------------------------------------------------- | ----------------------------- |
| 1   | POST   | `/api/auth/login`            | `{ email, password }`                                 | `{ token, user }`                                   | 401                           |
| 2   | GET    | `/api/auth/me`               | —                                                     | `{ user }`                                          | 401                           |
| 3   | POST   | `/api/auth/logout`           | —                                                     | 204                                                 | —                             |
| 4   | GET    | `/api/customers`             | query：`page,pageSize,keyword,level,status,sort`      | `Page<Customer>`                                    | 400                           |
| 5   | POST   | `/api/customers`             | `CustomerCreate`                                      | `Customer`（201）                                   | 422                           |
| 6   | GET    | `/api/customers/:id`         | —                                                     | `Customer`                                          | 404                           |
| 7   | PATCH  | `/api/customers/:id`         | `CustomerUpdate`（含 `updatedAt` 乐观锁）             | `Customer`                                          | 404/409/422                   |
| 8   | DELETE | `/api/customers/:id`         | —                                                     | 204                                                 | 404/409 `CUSTOMER_HAS_ORDERS` |
| 9   | POST   | `/api/customers/bulk-delete` | `{ ids: string[] }`                                   | `{ deleted: string[], failed: {id,code}[] }`（207） | 400                           |
| 10  | GET    | `/api/customers/options`     | `?keyword=`                                           | `{ items: {id,name,status}[] }`                     | —                             |
| 11  | GET    | `/api/orders`                | query：`page,pageSize,keyword,status,customerId,sort` | `Page<Order>`                                       | 400                           |
| 12  | POST   | `/api/orders`                | `OrderCreate`                                         | `Order`（201）                                      | 422                           |
| 13  | GET    | `/api/orders/:id`            | —                                                     | `Order`                                             | 404                           |
| 14  | PATCH  | `/api/orders/:id`            | `OrderUpdate`（不含 status）                          | `Order`                                             | 404/409/422                   |
| 15  | DELETE | `/api/orders/:id`            | —                                                     | 204                                                 | 404/409 `ORDER_PAID`          |
| 16  | POST   | `/api/orders/:id/transition` | `{ to: 'paid' \| 'cancelled' \| 'refunded' }`         | `Order`                                             | 409 `INVALID_TRANSITION`      |
| 17  | GET    | `/api/members`               | —                                                     | `{ items: Member[] }`                               | —                             |

**订单列表的读模型**：`Order` 响应内联 `customer: { id, name }` 快照，避免前端为每行再查客户（N+1）。这不是冗余，是面向列表的读模型设计，写进 ADR。

## 4. 实体 Schema 草案

```ts
// shared/api/schema.ts
const trimmed = z.string().trim()

/** 表单里没填的可选字段会提交空字符串，统一在入口转成 undefined */
const emptyToUndefined = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), inner.optional())

const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
const emailSchema = z.email('邮箱格式不正确')

export const customerLevelSchema = z.enum(['key', 'normal', 'potential'])
export const customerStatusSchema = z.enum(['active', 'inactive'])

export const customerSchema = z.object({
  id: z.string().startsWith('cus_'),
  name: trimmed.min(2, '客户名称至少 2 个字').max(40, '客户名称最多 40 个字'),
  industry: z.enum(['tech', 'retail', 'finance', 'manufacturing', 'other']),
  level: customerLevelSchema,
  status: customerStatusSchema,
  ownerId: z.string(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  note: trimmed.max(200).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const customerCreateSchema = customerSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({ phone: emptyToUndefined(phoneSchema), email: emptyToUndefined(emailSchema) })

export const customerUpdateSchema = customerCreateSchema
  .partial()
  .extend({ updatedAt: z.iso.datetime() }) // 乐观锁令牌

export const customerFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  keyword: trimmed.max(50).optional(),
  level: customerLevelSchema.optional(),
  status: customerStatusSchema.optional(),
  sort: z.enum(['-createdAt', 'createdAt', 'name', '-name']).default('-createdAt'),
})
```

```ts
export const orderSchema = z.object({
  id: z.string().startsWith('ord_'),
  orderNo: z.string().regex(/^ORD-\d{8}-\d{4}$/),
  customerId: z.string().startsWith('cus_'),
  customer: z.object({ id: z.string(), name: z.string() }), // 列表读模型
  amountCents: z.number().int().min(1).max(100_000_000),
  status: z.enum(['draft', 'paid', 'refunded', 'cancelled']),
  paidAt: z.iso.datetime().nullable(),
  note: trimmed.max(200).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const orderCreateSchema = z.object({
  customerId: z.string().startsWith('cus_'),
  amountCents: z.number().int().min(1).max(100_000_000),
  note: trimmed.max(200).optional(),
})

/** 注意：update 不含 status —— 状态只能走 transition 接口 */
export const orderUpdateSchema = orderCreateSchema.partial().extend({ updatedAt: z.iso.datetime() })

export const transitionSchema = z.object({
  to: z.enum(['paid', 'cancelled', 'refunded']),
})
```

前端把"元"转"分"放在 `features/orders/form.ts` 的 `toPayload` 里，`MoneyText` 负责反向展示。**所有金额运算都用整数**，ADR 记录。

## 5. MSW 结构

```
src/shared/api/mock/
  db.ts          # 内存数据 + 固定种子 + reset()，时间戳由 seed 的固定基准推导
  seed.ts        # 24 个客户、60 个订单，确定性数据（不随机，便于快照）
  latency.ts     # 150–450ms 可配置延迟，让 loading 态真的可见
  failure.ts     # 故障注入：x-mock-scenario 头或 ?__mock= 参数
  auth.ts        # token → user 解析、角色校验中间件
  handlers/
    auth.ts customers.ts orders.ts members.ts
    index.ts     # 汇总，供 browser 与 node 复用
src/mocks/browser.ts   # setupWorker，仅 mock 模式动态 import
```

要点：

- **同一份 handlers 给浏览器和 Vitest 用**（`msw/node` 的 `setupServer`），测试与手动体验走同一条路径。
- handler 内部先用 zod 校验入参，再写库；写库后再用响应 schema 校验出参。**mock 自己也不许违反契约**，否则契约测试形同虚设。
- 角色校验在 handler 层：viewer 调写接口返回 403，前端隐藏按钮只是体验优化。
- 种子数据固定：客户名称用固定词表（如"远山科技""北辰零售"），订单号按序号生成，便于 e2e 断言。
- `reset()` 暴露到 dev 工具栏（P1），刷新即回初始态。

## 6. 模式切换

```ts
// shared/config/env.ts
const envSchema = z.object({
  VITE_API_MODE: z.enum(['mock', 'http']).default('mock'),
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_MOCK_LATENCY_MS: z.coerce.number().int().min(0).max(3000).default(250),
})
export const env = envSchema.parse(import.meta.env) // 非法配置在启动即失败
```

```ts
// main.tsx
if (env.VITE_API_MODE === 'mock') {
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}
```

```bash
pnpm dev                 # mock 模式
VITE_API_MODE=http VITE_API_BASE_URL=http://localhost:8787/api pnpm dev   # 真后端
```

`.env.example` 提交，`.env.local` 忽略。**mock 代码不进生产包**：动态 import + 构建后 manifest 核对一次。

## 7. 换后端演练（P1，半小时）

`server/index.ts` 用 Hono（或 Express）实现同一份契约，直接复用 `features/*/schema.ts` 与种子数据：

```bash
pnpm server        # :8787
pnpm dev:http      # 前端指向 8787
```

价值：证明"可 Mock"不是嘴上说说。e2e 用 Playwright 的第二个 project 跑 `http` 模式，同一批用例、零业务代码改动，这是"快速前后端协作"最硬的证据。

## 8. OpenAPI 导出（P1）

```bash
pnpm contract:openapi   # zod → contract/openapi.json
```

CI 里加一步 `git diff --exit-code contract/`：schema 改了但没重新导出，直接红。后端拿到的永远是最新契约，不会出现"文档是上个月的"。

## 9. 契约测试

| 测试       | 做什么                                                | 抓什么           |
| ---------- | ----------------------------------------------------- | ---------------- |
| 端点覆盖   | 遍历端点注册表，断言每个 method+path 都有 handler     | 漏实现接口       |
| 入参校验   | 用非法 body 调 handler，断言 422 且 `fields` 有对应键 | 校验缺失         |
| 出参校验   | 每个端点返回体必须通过对应 zod schema                 | mock 与类型漂移  |
| 错误形状   | 401/403/404/409 的 body 必须通过 `apiErrorSchema`     | 前端错误分支失效 |
| 种子一致性 | `customerId` 外键都存在、订单号唯一                   | 假数据自相矛盾   |

端点注册表同时驱动覆盖率统计：`17 个端点 / 17 个有测试` 写进 README。

## 10. 契约变更流程（写进 README，给"后端同事"看）

1. 改 `schema.ts`，本地跑 `pnpm test` 看哪些用例红。
2. 改 mock handler 让契约测试变绿。
3. `pnpm contract:openapi` 重新导出。
4. PR 描述里贴出 breaking change（如有），后端据此排期。
5. 后端实现后，本地起 server，`pnpm dev:http` 跑一遍 e2e。
6. 切换默认模式只需改 CI 的环境变量，业务代码零改动。
