import { setupWorker } from 'msw/browser'
import { handlers } from '@/shared/api/mock/handlers'

export const worker = setupWorker(...handlers)
