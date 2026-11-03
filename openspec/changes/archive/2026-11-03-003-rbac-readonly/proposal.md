# 003 登录与只读角色

## Why

后台系统需要区分管理员与只读观察员。权限既是业务要求，也是验证"前端隐藏 + 接口拒绝"双层防线的场景。

## What Changes

- 新增 mock 登录、当前用户、登出接口。
- 路由守卫与菜单按角色过滤；viewer 不渲染写操作入口。
- 401 跳登录并保留 redirect；403 只提示不跳转。

## Impact

- 新增：`src/features/auth/**`、`src/pages/login/index.tsx`、`src/app/guard.tsx`
- 修改：布局、路由、client 的 401 处理
- 依赖：无新增
