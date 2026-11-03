# 002 订单模块

## Why

客户建档后需要跟进订单：创建、收款、退款、取消。订单带状态机与金额，是验证"不只是 CRUD"的核心模块。

## What Changes

- 新增 `orders` 能力：列表（按状态/客户/关键词筛选）、创建（选客户、金额）、编辑（不改状态）、删除（已收款禁止）。
- 状态流转走独立接口，只有 draft→paid、draft→cancelled、paid→refunded 三条边。
- 列表内联客户名快照，避免 N+1。
- 金额以整数分存储与传输，表单按元输入。

## Impact

- 新增：`src/features/orders/**`、`src/pages/orders/list.tsx`、`src/shared/api/mock/handlers/orders.ts`
- 修改：`schema.ts`（Order 契约）、路由
- 依赖：无新增
