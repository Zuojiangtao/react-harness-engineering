import { http } from 'msw'
import { loginBodySchema, loginResponseSchema, meResponseSchema } from '../../schema'
import { getDb } from '../db'
import {
  API_PREFIX,
  currentUser,
  fail,
  json,
  mockDelay,
  noContent,
  readJson,
  tokenFor,
  unauthorized,
  zodFields,
} from '../helpers'

export const authHandlers = [
  http.post(`${API_PREFIX}/auth/login`, async ({ request }) => {
    await mockDelay()
    const parsed = loginBodySchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return fail(422, 'VALIDATION_ERROR', '登录信息不合法', { fields: zodFields(parsed.error) })
    }
    const found = getDb().users.find(
      (user) => user.email === parsed.data.email && user.password === parsed.data.password,
    )
    if (!found) return fail(401, 'UNAUTHORIZED', '邮箱或密码不正确')
    return json(
      loginResponseSchema.parse({
        token: tokenFor(found),
        user: { id: found.id, name: found.name, role: found.role, email: found.email },
      }),
    )
  }),

  http.get(`${API_PREFIX}/auth/me`, async ({ request }) => {
    await mockDelay()
    const user = currentUser(request)
    if (!user) return unauthorized()
    return json(meResponseSchema.parse({ user }))
  }),

  http.post(`${API_PREFIX}/auth/logout`, async () => {
    await mockDelay()
    return noContent()
  }),
]
