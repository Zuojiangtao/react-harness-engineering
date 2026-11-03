import { request, requestVoid } from '@/shared/api/client'
import { loginResponseSchema, meResponseSchema } from '@/shared/api/schema'

export const authApi = {
  login: (email: string, password: string) =>
    request('/auth/login', loginResponseSchema, {
      method: 'POST',
      body: { email, password },
    }),

  me: () => request('/auth/me', meResponseSchema),

  logout: () => requestVoid('/auth/logout', { method: 'POST' }),
}
