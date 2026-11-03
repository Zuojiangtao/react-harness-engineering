import type { Customer, Member, Order, User } from '../schema'
import { customersSeed, membersSeed, ordersSeed, usersSeed } from './seed'

export type MockDb = {
  customers: Customer[]
  orders: Order[]
  members: Member[]
  users: Array<User & { password: string }>
}

let db: MockDb | null = null

export function resetDb(): void {
  db = structuredClone({
    customers: customersSeed,
    orders: ordersSeed,
    members: membersSeed,
    users: usersSeed,
  })
}

export function getDb(): MockDb {
  if (!db) resetDb()
  return db as MockDb
}
