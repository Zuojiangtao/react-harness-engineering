import { Card, Typography } from 'antd'

export default function App() {
  return (
    <Card style={{ margin: 24 }}>
      <Typography.Title level={3}>CRM · Harness Engineering</Typography.Title>
      <Typography.Paragraph>
        工程底座已就绪。客户与订单模块将在 M3–M5 接入，规格见 openspec/，门禁见
        AGENTS.md。
      </Typography.Paragraph>
    </Card>
  )
}
