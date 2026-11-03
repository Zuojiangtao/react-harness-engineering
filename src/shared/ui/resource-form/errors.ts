import type { ZodError } from 'zod'

export type FieldError = { name: string; errors: string[] }

/** ZodError → antd form.setFields 需要的结构 */
export function zodErrorToFields(error: ZodError): FieldError[] {
  const grouped = new Map<string, string[]>()
  for (const issue of error.issues) {
    const name = issue.path.map(String).join('.') || '_'
    grouped.set(name, [...(grouped.get(name) ?? []), issue.message])
  }
  return [...grouped.entries()].map(([name, errors]) => ({ name, errors }))
}

/** 服务端 422 的 fields → antd form.setFields */
export function apiFieldsToForm(fields: Record<string, string>): FieldError[] {
  return Object.entries(fields).map(([name, message]) => ({ name, errors: [message] }))
}
