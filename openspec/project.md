# CRM 项目规格

## 1. 业务背景

一家企业服务公司需要内部 CRM：销售维护客户档案，并为客户创建、跟进订单。
系统有两个角色：管理员（admin）与只读观察员（viewer）。没有仪表盘、图表与多租户。

## 2. 角色与权限

| 能力                  | admin | viewer |
| --------------------- | ----- | ------ |
| 登录、查看列表与详情  | ✅    | ✅     |
| 新建 / 编辑客户与订单 | ✅    | ❌     |
| 删除客户与订单        | ✅    | ❌     |
| 订单状态流转          | ✅    | ❌     |
| 接口层校验            | 放行  | 403    |

权限必须在接口层（MSW handler）生效，前端隐藏按钮只是体验优化。

## 3. 领域模型

### Customer

| 字段                  | 类型       | 约束                                            |
| --------------------- | ---------- | ----------------------------------------------- |
| id                    | string     | `cus_` 前缀，服务端生成                         |
| name                  | string     | trim 后 2–40 字，必填                           |
| industry              | enum       | tech / retail / finance / manufacturing / other |
| level                 | enum       | key / normal / potential                        |
| status                | enum       | active / inactive（inactive 即归档）            |
| ownerId               | string     | 必须是存在的成员                                |
| phone                 | string?    | `^1[3-9]\d{9}$`                                 |
| email                 | string?    | 合法邮箱                                        |
| note                  | string?    | ≤ 200 字                                        |
| createdAt / updatedAt | ISO string | 服务端生成                                      |

### Order

| 字段                  | 类型        | 约束                                      |
| --------------------- | ----------- | ----------------------------------------- |
| id                    | string      | `ord_` 前缀                               |
| orderNo               | string      | `ORD-YYYYMMDD-####`，唯一，服务端生成     |
| customerId            | string      | 必须存在且客户为 active                   |
| customer              | object      | 读模型快照 `{ id, name }`，客户改名时同步 |
| amountCents           | integer     | 1 – 100,000,000（整数分）                 |
| status                | enum        | draft / paid / refunded / cancelled       |
| paidAt                | ISO string? | 进入 paid 时写入                          |
| note                  | string?     | ≤ 200 字                                  |
| createdAt / updatedAt | ISO string  | 服务端生成                                |

## 4. 业务规则

1. 订单状态只允许：draft → paid、draft → cancelled、paid → refunded；其余返回 409 `INVALID_TRANSITION`。
2. `paid` 订单不可删除（409 `ORDER_PAID`），只能退款。
3. `refunded` / `cancelled` 为终态，只读。
4. 编辑订单不允许直接改 status，状态只能走 `POST /orders/:id/transition`。
5. 删除有订单的客户返回 409 `CUSTOMER_HAS_ORDERS`，并给出订单数；不级联删除。
6. 给 inactive 客户建单返回 422 `CUSTOMER_INACTIVE`。
7. 金额以整数分存储与传输，展示层格式化为元。

## 5. 非目标

仪表盘与图表、复杂 RBAC、i18n、暗色模式、列表虚拟滚动、富文本、文件上传、多标签页、真后端与数据库。

## 6. 技术约定

- 前端：React 19 + Ant Design 6 + Vite + TanStack Query + Zod 4。
- 契约：Zod 为唯一来源，MSW handler 同契约实现，可导出 OpenAPI。
- Mock：`VITE_API_MODE=mock` 默认；`http` 模式指向真实服务。
- 金额：`amountCents`；日期：ISO 8601 UTC 字符串，展示按本地时区。
