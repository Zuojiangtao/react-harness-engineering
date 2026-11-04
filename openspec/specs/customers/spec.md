# customers Specification

## Purpose

维护客户档案：分页查询与筛选、创建、编辑（乐观锁）、删除（订单关联保护），以及基于角色的写权限。客户是订单的前置依赖，因此删除必须被关联订单保护，且不做级联删除。

## Requirements

### Requirement: [CUS-01] 客户列表支持分页、筛选与排序

系统 SHALL 提供分页的客户列表，支持按关键词（匹配客户名称）、等级、状态筛选，并支持按创建时间与名称排序。
筛选、分页、排序条件 MUST 保存在 URL 查询参数中，刷新与分享链接后状态可还原。

#### Scenario: 按关键词与等级筛选

- **WHEN** 用户输入关键词「远山」并选择等级「重点」
- **THEN** 列表只显示名称包含「远山」且等级为 key 的客户
- **AND** URL 包含 `keyword` 与 `level` 参数

#### Scenario: 刷新后筛选条件保留

- **WHEN** 用户在筛选后的页面刷新浏览器
- **THEN** 列表使用相同的筛选、分页、排序参数重新请求

#### Scenario: 非法分页参数

- **WHEN** URL 中 `page=abc`
- **THEN** 前端回落到第 1 页而不是白屏

### Requirement: [CUS-02] 新建客户必须通过统一校验

系统 SHALL 校验客户名称（2–40 字）、手机号、邮箱，并在服务端返回字段级错误时回填到对应表单项。
名称与校验规则 MUST 只在 Zod schema 中定义一次，前端不重复实现。

#### Scenario: 名称为空

- **WHEN** 用户提交空名称
- **THEN** 表单阻止提交并在名称字段下显示「客户名称至少 2 个字」

#### Scenario: 服务端字段错误回填

- **WHEN** 服务端返回 422 且 `fields.email` 有值
- **THEN** 邮箱表单项显示该错误，抽屉不关闭

### Requirement: [CUS-03] 编辑客户必须处理并发冲突

系统 SHALL 使用 `updatedAt` 作为乐观锁。提交时携带读取到的 `updatedAt`，服务端不一致时返回 409 `STALE_WRITE`。

#### Scenario: 两个标签页同时编辑

- **WHEN** 用户在 A 标签页保存后，B 标签页用旧 `updatedAt` 提交
- **THEN** B 收到 409，提示「数据已被其他人修改，请刷新后重试」

### Requirement: [CUS-04] 删除客户必须被订单关联保护

系统 SHALL 在客户存在任意订单时拒绝删除，返回 409 `CUSTOMER_HAS_ORDERS` 与订单数，不做级联删除。
删除成功后，若当前页已空，前端 MUST 回退到上一页。

#### Scenario: 删除有订单的客户

- **WHEN** 用户删除一个有 3 个订单的客户
- **THEN** 接口返回 409，`details.orderCount = 3`
- **AND** 对话框展示「该客户有 3 个订单，不能删除；可将客户状态改为归档」
- **AND** 列表数据不变

#### Scenario: 删除无订单的客户

- **WHEN** 用户删除一个没有订单的客户
- **THEN** 接口返回 204，列表刷新后不再出现该客户

### Requirement: [CUS-05] 客户列表必须覆盖三种状态

系统 SHALL 为列表提供加载、空、错误三种状态；错误态 MUST 可重试。

#### Scenario: 请求失败

- **WHEN** 列表请求返回 500
- **THEN** 展示错误态与「重试」按钮，点击后重新请求

#### Scenario: 无数据

- **WHEN** 筛选结果为空
- **THEN** 展示空态与「清空筛选」操作

### Requirement: [CUS-06] 客户写操作仅限管理员

系统 SHALL 对 viewer 隐藏所有写操作入口，并在接口层返回 403。
隐藏按钮 MUST NOT 作为唯一防线。

#### Scenario: viewer 调用创建接口

- **WHEN** viewer 直接调用 `POST /api/customers`
- **THEN** 返回 403 `FORBIDDEN`
