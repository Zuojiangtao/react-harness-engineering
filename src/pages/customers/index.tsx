import { Empty } from 'antd'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="客户" description="客户档案的查询与维护" />
      <Empty description="客户模块即将接入（M4）" />
    </>
  )
}
