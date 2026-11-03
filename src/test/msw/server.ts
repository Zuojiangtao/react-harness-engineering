import { setupServer } from 'msw/node'
import { handlers } from '@/shared/api/mock/handlers'

export const server = setupServer(...handlers)
