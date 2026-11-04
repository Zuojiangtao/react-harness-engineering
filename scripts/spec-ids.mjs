/**
 * 需求 ID 只接受 [PREFIX-NN]：前缀可以是 2–8 位大写字母/数字，
 * 不能假设只有 CUS/ORD 这种三字母前缀（AUTH 是四字母）。
 */
export function extractRequirementIds(text) {
  const pattern = /\[([A-Z][A-Z0-9]{1,7}-\d{2,3})\]/g
  return new Set(Array.from(text.matchAll(pattern), (match) => match[1]))
}
