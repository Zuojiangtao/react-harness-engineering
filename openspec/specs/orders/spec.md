# orders Specification

## Purpose
为客户创建与跟进订单：列表筛选、整数分金额、只读客户快照，以及严格的状态机与删除限制。状态只能沿 draft→paid→refunded 等固定路径流转，终态只读。

## Requirements

### Requirement: [ORD-01] 订单列表支持按状态与客户筛选

系统 SHALL 提供分页订单列表，支持按状态、客户、关键词（订单号或客户名）筛选，支持按创建时间与金额排序。
列表项 MUST 内联客户名快照 `customer.name`，不得为每行单独请求客户。

#### Scenario: 按状态筛选

- **WHEN** 用户选择状态「已收款」
- **THEN** 列表只显示 paid 订单
- **AND** URL 包含 `status=paid`

### Requirement: [ORD-02] 创建订单必须校验客户与金额

系统 SHALL 要求 `customerId` 存在且客户为 active，金额为 1–100,000,000 的整数分。
客户已归档时 MUST 返回 422 `CUSTOMER_INACTIVE` 并定位到 customerId 字段。

#### Scenario: 给归档客户建单

- **WHEN** 提交 `customerId=cus_004`（inactive）
- **THEN** 返回 422，表单在客户字段显示「该客户已归档，不能新建订单」

#### Scenario: 金额输入 1234.56 元

- **WHEN** 用户在金额框输入 1234.56 并提交
- **THEN** 请求体为 `amountCents: 123456`

### Requirement: [ORD-03] 订单状态只能按状态机流转

系统 SHALL 只允许 draft→paid、draft→cancelled、paid→refunded；其余返回 409 `INVALID_TRANSITION`。
编辑接口 MUST NOT 接受 status 字段。前端 MUST 只展示当前状态允许的动作。

#### Scenario: 草稿单直接退款

- **WHEN** 对 draft 订单调用 `transition { to: 'refunded' }`
- **THEN** 返回 409 `INVALID_TRANSITION`，订单状态不变

#### Scenario: 收款

- **WHEN** 对 draft 订单调用 `transition { to: 'paid' }`
- **THEN** 状态变为 paid，`paidAt` 有值

### Requirement: [ORD-04] 已收款订单不可删除

系统 SHALL 拒绝删除 paid 订单并返回 409 `ORDER_PAID`；refunded / cancelled 终态订单也不可删除，返回 409 `CONFLICT`；终态订单只读。

#### Scenario: 删除已收款订单

- **WHEN** 用户删除 paid 订单
- **THEN** 返回 409，提示「已收款订单不可删除，请先退款」

#### Scenario: 删除已退款或已取消订单

- **WHEN** 用户删除 refunded 或 cancelled 订单
- **THEN** 返回 409 `CONFLICT`，订单仍然存在

### Requirement: [ORD-05] 订单写操作仅限管理员

系统 SHALL 对 viewer 隐藏所有写操作，并在接口层返回 403。

#### Scenario: viewer 创建订单

- **WHEN** viewer 调用 `POST /api/orders`
- **THEN** 返回 403 `FORBIDDEN`
