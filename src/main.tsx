import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'antd/dist/reset.css'
import App from './App'
import { env } from '@/shared/config/env'

async function enableMocking(): Promise<void> {
  if (env.VITE_API_MODE !== 'mock') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConfigProvider locale={zhCN}>
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </StrictMode>,
  )
})
