# 需求追溯

每条规格需求（`openspec/`）都必须能被实现与测试定位。`pnpm run spec:validate` 会检查 ID 是否被测试引用，本表是人工可读版本。

| ID | 需求 | 实现 | 测试 |
|---|---|---|---|
| CUS-01 | 列表分页、关键词/等级/状态筛选、排序、URL 还原 | `shared/api/mock/handlers/customers.ts`、`pages/customers/index.tsx`、`shared/lib/use-url-state.ts` | `contract.test.ts`（CUS-01）、`use-url-state.test.tsx`、`customers.test.tsx` |
| CUS-02 | 新建客户校验与 422 回填 | `shared/api/schema.ts`、`shared/ui/resource-form/*` | `schema.test.ts`、`ResourceForm.test.tsx`、`contract.test.ts`（CUS-02） |
| CUS-03 | 编辑乐观锁 | `handlers/customers.ts`（STALE_WRITE） | `contract.test.ts`（CUS-03） |
| CUS-04 | 删除关联保护 + 末页回退 | `handlers/customers.ts`、`pages/customers/index.tsx` | `contract.test.ts`（CUS-04）、`customers.test.tsx` |
| CUS-05 | 列表三态 | `shared/ui/data-table/DataTable.tsx`、`empty/error-state` | `DataTable.test.tsx`（CUS-05） |
| CUS-06 | 客户写操作仅管理员 | `handlers/customers.ts`、`pages/customers/index.tsx` | `contract.test.ts`（CUS-06） |
| ORD-01 | 订单列表筛选与客户快照 | `handlers/orders.ts`、`pages/orders/index.tsx` | `contract.test.ts`（ORD-01） |
| ORD-02 | 创建订单校验客户与金额 | `handlers/orders.ts`、`shared/ui/resource-form/MoneyInput.tsx` | `contract.test.ts`（ORD-02）、`schema.test.ts` |
| ORD-03 | 订单状态机 | `handlers/orders.ts`、`features/orders/constants.ts` | `contract.test.ts`（ORD-03）、`orders.test.tsx` |
| ORD-04 | 已收款不可删除 | `handlers/orders.ts`、`pages/orders/index.tsx` | `contract.test.ts`（ORD-04）、`orders.test.tsx` |
| ORD-05 | 订单写操作仅管理员 | `handlers/orders.ts` | `contract.test.ts`（ORD-05） |
| AUTH-01 | 登录与会话保持 | `features/auth/*`、`app/guard.tsx`、`shared/api/client.ts` | `contract.test.ts`（AUTH-01） |
| AUTH-02 | viewer 只读 | `app/guard.tsx`、页面按角色裁剪入口 | `customers.test.tsx`（AUTH-02） |
| AUTH-03 | 403 不打断会话 | `shared/api/errors.ts`、`shared/api/client.ts` | `contract.test.ts`（AUTH-03） |

## 端点覆盖

`src/shared/api/mock/handlers/index.ts` 注册 17 个端点，`contract.test.ts` 断言数量一致，并对成功/失败响应做 Zod 校验。
