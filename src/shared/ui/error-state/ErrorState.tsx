import { Button, Result } from 'antd'
import type { ApiError } from '@/shared/api/errors'

export function ErrorState({
  error,
  onRetry,
  title = '加载失败',
}: {
  error?: ApiError | Error | null
  onRetry?: () => void
  title?: string
}) {
  return (
    <Result
      status="error"
      title={title}
      subTitle={error?.message ?? '请稍后重试'}
      extra={
        onRetry ? (
          <Button type="primary" onClick={onRetry}>
            重试
          </Button>
        ) : undefined
      }
    />
  )
}
