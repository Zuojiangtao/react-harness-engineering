import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AppErrorBoundary } from './error-boundary'
import { queryClient } from './query-client'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <AppErrorBoundary>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AppErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  )
}
