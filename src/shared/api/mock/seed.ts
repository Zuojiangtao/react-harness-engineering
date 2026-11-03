import type { Customer, Member, Order, User } from '../schema'

const BASE = Date.UTC(2026, 0, 5, 8, 0, 0)
const MINUTE = 60_000
const DAY = 86_400_000

const iso = (offsetMinutes: number) => new Date(BASE + offsetMinutes * MINUTE).toISOString()
const pad = (value: number, length = 4) => String(value).padStart(length, '0')
const formatDay = (date: Date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1, 2)}${pad(date.getUTCDate(), 2)}`

export const usersSeed: Array<User & { password: string }> = [
  {
    id: 'usr_1',
    name: '张伟',
    role: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
  },
  {
    id: 'usr_2',
    name: '李娜',
    role: 'viewer',
    email: 'viewer@example.com',
    password: 'viewer123',
  },
]

export const membersSeed: Member[] = usersSeed.map(({ id, name, role }) => ({ id, name, role }))

const COMPANY_NAMES = [
  '远山科技',
  '北辰零售',
  '云杉金融',
  '恒川制造',
  '星野教育',
  '青禾医疗',
  '海岸物流',
  '长风能源',
  '白鹭文化',
  '明德咨询',
  '万象地产',
  '锐行汽车',
  '拾光传媒',
  '山海农业',
  '启明电子',
  '泰和保险',
  '景行旅游',
  '汇通贸易',
  '知行软件',
  '朗月生物',
  '松间家居',
  '潮汐网络',
  '麦田食品',
  '原点设计',
] as const

const INDUSTRIES = ['tech', 'retail', 'finance', 'manufacturing', 'other'] as const
const LEVELS = ['key', 'normal', 'potential'] as const

export const customersSeed: Customer[] = COMPANY_NAMES.map((name, index) => {
  const createdAt = iso(index * 180)
  return {
    id: `cus_${pad(index + 1, 3)}`,
    name,
    industry: INDUSTRIES[index % INDUSTRIES.length],
    level: LEVELS[index % LEVELS.length],
    status: index % 7 === 3 ? 'inactive' : 'active',
    ownerId: membersSeed[index % membersSeed.length].id,
    phone: `1380000${pad(index + 1, 4)}`,
    email: `contact${index + 1}@example.com`,
    note: index % 5 === 0 ? '重点跟进客户' : undefined,
    createdAt,
    updatedAt: createdAt,
  }
})

const ORDER_STATUSES = ['draft', 'paid', 'refunded', 'cancelled'] as const

export const ordersSeed: Order[] = Array.from({ length: 60 }, (_, index) => {
  const customerIndex = index % 20 // 后 4 个客户没有订单，便于演示"可删除"
  const customer = customersSeed[customerIndex]
  const createdAtDate = new Date(BASE + (index + 1) * DAY * 2)
  const createdAt = createdAtDate.toISOString()
  const status = ORDER_STATUSES[index % ORDER_STATUSES.length]
  const paidAt = status === 'paid' || status === 'refunded' ? iso(index * 60 + 30) : null

  return {
    id: `ord_${pad(index + 1, 3)}`,
    orderNo: `ORD-${formatDay(createdAtDate)}-${pad(index + 1)}`,
    customerId: customer.id,
    customer: { id: customer.id, name: customer.name },
    amountCents: 19900 + (index % 12) * 5000,
    status,
    paidAt,
    note: index % 6 === 0 ? '年度框架合同' : undefined,
    createdAt,
    updatedAt: paidAt ?? createdAt,
  }
})
