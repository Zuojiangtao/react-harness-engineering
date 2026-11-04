# 需求追溯

每条规格需求（`openspec/`）都必须能被实现与测试定位。`pnpm run spec:validate` 会检查 ID 是否被测试引用，本表是人工可读版本。

| ID      | 需求                                           | 实现                                                                                                | 测试                                                                                   |
| ------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| CUS-01  | 列表分页、关键词/等级/状态筛选、排序、URL 还原 | `shared/api/mock/handlers/customers.ts`、`pages/customers/index.tsx`、`shared/lib/use-url-state.ts` | `contract.test.ts`（CUS-01）、`use-url-state.test.tsx`、`customers.test.tsx`           |
| CUS-02  | 新建客户校验与 422 回填                        | `shared/api/schema.ts`、`shared/ui/resource-form/*`                                                 | `schema.test.ts`、`ResourceForm.test.tsx`、`contract.test.ts`（CUS-02）                |
| CUS-03  | 编辑乐观锁与清空可选字段                       | `handlers/customers.ts`（STALE_WRITE / null）                                                       | `contract.test.ts`（CUS-03）、`customers.test.tsx`（清空手机号/邮箱）                  |
| CUS-04  | 删除关联保护 + 末页回退                        | `handlers/customers.ts`、`pages/customers/index.tsx`                                                | `contract.test.ts`（CUS-04）、`customers.test.tsx`                                     |
| CUS-05  | 列表三态                                       | `shared/ui/data-table/DataTable.tsx`、`empty/error-state`                                           | `DataTable.test.tsx`（CUS-05）                                                         |
| CUS-06  | 客户写操作仅管理员                             | `handlers/customers.ts`、`pages/customers/index.tsx`                                                | `contract.test.ts`（CUS-06）                                                           |
| ORD-01  | 订单列表筛选与客户快照                         | `handlers/orders.ts`、`pages/orders/index.tsx`                                                      | `contract.test.ts`（ORD-01）                                                           |
| ORD-02  | 创建订单校验客户与金额                         | `handlers/orders.ts`、`shared/ui/resource-form/MoneyInput.tsx`                                      | `contract.test.ts`（ORD-02）、`schema.test.ts`                                         |
| ORD-03  | 订单状态机                                     | `handlers/orders.ts`、`features/orders/constants.ts`                                                | `contract.test.ts`（ORD-03）、`orders.test.tsx`                                        |
| ORD-04  | 已收款/终态不可删除                            | `handlers/orders.ts`、`pages/orders/index.tsx`                                                      | `contract.test.ts`（ORD-04：paid/refunded/cancelled）、`orders.test.tsx`               |
| ORD-05  | 订单写操作仅管理员                             | `handlers/orders.ts`                                                                                | `contract.test.ts`（ORD-05）                                                           |
| AUTH-01 | 登录、会话保持与 401 失效                      | `features/auth/*`、`app/guard.tsx`、`app/session.ts`、`shared/api/client.ts`                        | `contract.test.ts`（AUTH-01）、`client.test.ts`、`session.test.ts`、`e2e/auth.spec.ts` |
| AUTH-02 | viewer 只读                                    | `app/guard.tsx`、页面按角色裁剪入口                                                                 | `customers.test.tsx`（AUTH-02）                                                        |
| AUTH-03 | 403 不打断会话                                 | `shared/api/errors.ts`、`shared/api/client.ts`                                                      | `contract.test.ts`（AUTH-03）                                                          |

## 端点覆盖

`src/shared/api/mock/handlers/index.ts` 注册 17 个端点；`endpoints.test.ts` 对每个端点逐个发起请求并用响应 schema 校验，同时断言 `ENDPOINTS`、handler 数量和覆盖集合一致。
