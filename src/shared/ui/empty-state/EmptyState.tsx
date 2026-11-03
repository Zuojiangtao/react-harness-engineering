import { Empty } from 'antd'
import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div>
          <div>{title}</div>
          {description ? (
            <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>{description}</div>
          ) : null}
        </div>
      }
    >
      {action}
    </Empty>
  )
}
