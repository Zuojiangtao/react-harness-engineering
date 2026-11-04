import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import App from './App'
import { AppProviders } from '@/app/providers'
import { installUnauthorizedHandler } from '@/app/session'
import { env } from '@/shared/config/env'

installUnauthorizedHandler()

async function enableMocking(): Promise<void> {
  if (env.VITE_API_MODE !== 'mock') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  )
})
