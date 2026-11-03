# auth Specification

## Purpose
管理员与只读观察员的登录、会话保持与权限边界：前端隐藏写入口，接口层仍然返回 403，确保“隐藏按钮”不是唯一防线，且 403 不打断当前会话。

## Requirements

### Requirement: [AUTH-01] 登录后保持会话

系统 SHALL 提供 mock 登录，返回 token 与用户信息；刷新页面后 MUST 通过 token 恢复会话。
token 失效时 MUST 清理并跳转登录页，登录后回到原地址。

#### Scenario: 刷新保持登录

- **WHEN** 用户登录后刷新页面
- **THEN** 仍处于登录态，直接进入原页面

#### Scenario: token 失效

- **WHEN** 接口返回 401
- **THEN** 清理 token 并跳转 `/login?redirect=<当前地址>`

### Requirement: [AUTH-02] viewer 只读

系统 SHALL 对 viewer 隐藏新建、编辑、删除、状态流转入口，并禁止其访问写操作路由。
接口层 MUST 返回 403，前端隐藏不是唯一防线。

#### Scenario: 直接访问受限路由

- **WHEN** viewer 在地址栏输入客户编辑地址
- **THEN** 被重定向到列表页并提示无权限

### Requirement: [AUTH-03] 403 不打断当前上下文

系统 SHALL 在收到 403 时只提示「当前角色无权限」，不得清空登录态或跳转。

#### Scenario: viewer 触发写操作

- **WHEN** viewer 通过非常规方式触发写请求并收到 403
- **THEN** 显示提示，页面与登录态保持不变
