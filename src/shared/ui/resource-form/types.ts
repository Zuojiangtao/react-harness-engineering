export type Option = { label: string; value: string }

type BaseField<T> = {
  name: keyof T & string
  label: string
  required?: boolean
  placeholder?: string
}

export type FieldConfig<T> =
  | (BaseField<T> & { kind: 'text' })
  | (BaseField<T> & { kind: 'textarea'; rows?: number })
  | (BaseField<T> & { kind: 'money' })
  | (BaseField<T> & { kind: 'select'; options: Option[] })
  | (BaseField<T> & {
      kind: 'asyncSelect'
      load: (keyword: string) => Promise<Option[]>
      cacheKey: string
      minChars?: number
    })

export type FormLayout = 'one' | 'two'
