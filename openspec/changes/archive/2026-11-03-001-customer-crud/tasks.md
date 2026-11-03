# Tasks

## 1. 契约与 Mock

- [x] 1.1 在 `schema.ts` 定义 Customer 实体、create/update/filters
- [x] 1.2 实现客户 mock handlers（list/options/get/create/update/delete/bulk-delete）
- [x] 1.3 补齐契约测试：分页、筛选、401/403、409、STALE_WRITE

## 2. 共享组件

- [x] 2.1 `DataTable` 支持三态、工具栏、受控分页与排序
- [x] 2.2 `ResourceForm` 支持 FieldConfig、zod 提交校验、422 回填
- [x] 2.3 `useUrlState` 与 `FilterBar`

## 3. 页面

- [x] 3.1 客户列表页：搜索、筛选、排序、分页，全部进 URL
- [x] 3.2 新建/编辑抽屉
- [x] 3.3 删除确认与 409 文案
- [x] 3.4 空态、错误态、加载态

## 4. 验证

- [x] 4.1 集成测试：筛选、创建、删除冲突
- [ ] 4.2 e2e：CUS-01、CUS-04
- [x] 4.3 `npm run verify` 全绿
