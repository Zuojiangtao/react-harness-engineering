import { http } from 'msw'
import { getDb } from '../db'
import { API_PREFIX, json, mockDelay } from '../helpers'

export const memberHandlers = [
  http.get(`${API_PREFIX}/members`, async () => {
    await mockDelay()
    return json({ items: getDb().members })
  }),
]
