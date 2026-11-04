import type { Customer, Member, Order, User } from '../schema'
import { customersSeed, membersSeed, ordersSeed, usersSeed } from './seed'

export type MockDb = {
  customers: Customer[]
  orders: Order[]
  members: Member[]
  users: Array<User & { password: string }>
  /** 每个自然日已发出的最大订单序号；删除订单不能让它回退 */
  orderSequences: Record<string, number>
}

let db: MockDb | null = null

export function resetDb(): void {
  db = structuredClone({
    customers: customersSeed,
    orders: ordersSeed,
    members: membersSeed,
    users: usersSeed,
    orderSequences: {},
  })
}

export function getDb(): MockDb {
  if (!db) resetDb()
  return db as MockDb
}
