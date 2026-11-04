import { InputNumber } from 'antd'

/**
 * 表单里按“元”展示，模型里按“分”存储。
 * Form.Item 会注入 value/onChange，所以这里只做单位换算。
 */
export function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value?: number
  onChange?: (value: number | undefined) => void
  placeholder?: string
}) {
  return (
    <InputNumber
      style={{ width: '100%' }}
      min={0}
      precision={2}
      prefix="¥"
      placeholder={placeholder ?? '0.00'}
      value={value === undefined || value === null ? undefined : value / 100}
      onChange={(next) => onChange?.(next === null ? undefined : Math.round(next * 100))}
    />
  )
}
