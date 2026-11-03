import { request } from './client'
import { membersResponseSchema } from './schema'

export const membersApi = {
  list: () => request('/members', membersResponseSchema),
}
