# 001 客户模块 CRUD

## Why

销售需要维护客户档案：查询、筛选、新建、编辑、归档。客户是整个 CRM 的核心实体，也是订单模块的前置依赖。
第一个模块同时用来验证 harness：契约先行、Mock 先行、共享组件先行。

## What Changes

- 新增 `customers` 能力：分页列表、关键词/等级/状态筛选、排序、创建、编辑（乐观锁）、删除（关联保护）。
- 客户表单复用 `ResourceForm`，列表复用 `DataTable`，筛选状态写入 URL。
- 删除有订单的客户必须被拒绝并给出订单数。
- viewer 角色只读；接口层同样拒绝写操作。

## Impact

- 新增：`src/features/customers/**`、`src/pages/customers/list.tsx`、`src/shared/api/mock/handlers/customers.ts`
- 修改：`src/shared/api/schema.ts`（Customer 契约）、路由与侧边栏
- 依赖：无新增第三方依赖
