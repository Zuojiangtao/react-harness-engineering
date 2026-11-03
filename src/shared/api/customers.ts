import { request } from './client'
import { customerOptionsSchema } from './schema'

/** 跨模块只读的客户选项（订单表单的异步搜索也用这份） */
export async function loadCustomerOptions(
  keyword: string,
): Promise<Array<{ id: string; name: string; status: 'active' | 'inactive' }>> {
  const result = await request('/customers/options', customerOptionsSchema, {
    query: { keyword },
  })
  return result.items
}
