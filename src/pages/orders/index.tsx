import { Empty } from 'antd'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'

export default function OrdersPage() {
  return (
    <>
      <PageHeader title="订单" description="订单跟进与状态流转" />
      <Empty description="订单模块即将接入（M5）" />
    </>
  )
}
