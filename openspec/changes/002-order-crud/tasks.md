# Tasks

## 1. 契约与 Mock

- [x] 1.1 Order 实体、create/update/filters/transition schema
- [x] 1.2 mock handlers：list/get/create/update/delete/transition
- [x] 1.3 契约测试：非法流转、已收款删除、归档客户建单

## 2. 共享与复用

- [ ] 2.1 从客户模块抽取 `useResourceList`
- [ ] 2.2 客户模块改用共享 hook，回归测试通过

## 3. 页面

- [ ] 3.1 订单列表：状态/客户筛选、金额排序、分页
- [ ] 3.2 新建/编辑表单：异步客户搜索、元↔分
- [ ] 3.3 状态操作：按状态显示可用动作，失败回滚
- [ ] 3.4 空态、错误态

## 4. 验证

- [ ] 4.1 集成测试：创建、流转、删除限制
- [ ] 4.2 e2e：ORD-01、ORD-03
- [ ] 4.3 `npm run verify` 全绿
