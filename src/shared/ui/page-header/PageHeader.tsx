import { Space } from 'antd'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
      }}
    >
      <div>
        <h1 style={{ fontSize: 20, lineHeight: '28px', margin: 0 }}>{title}</h1>
        {description ? (
          <p style={{ margin: '4px 0 0', color: 'rgba(0, 0, 0, 0.45)' }}>{description}</p>
        ) : null}
      </div>
      {actions ? <Space wrap>{actions}</Space> : null}
    </div>
  )
}
