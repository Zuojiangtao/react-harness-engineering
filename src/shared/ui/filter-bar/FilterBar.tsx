import { Button, Space } from 'antd'
import type { ReactNode } from 'react'

export function FilterBar({
  children,
  onReset,
  extra,
}: {
  children: ReactNode
  onReset?: () => void
  extra?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <Space wrap size={12}>
        {children}
      </Space>
      <Space style={{ marginLeft: 'auto' }}>
        {extra}
        {onReset ? <Button onClick={onReset}>重置</Button> : null}
      </Space>
    </div>
  )
}
