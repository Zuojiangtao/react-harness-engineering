import { useState } from 'react'
import { Alert, Button, Col, Form, Input, Row, Select, Space } from 'antd'
import type { ZodType } from 'zod'
import { isApiError } from '@/shared/api/errors'
import { apiFieldsToForm, zodErrorToFields } from './errors'
import { AsyncSelect } from './AsyncSelect'
import { MoneyInput } from './MoneyInput'
import type { FieldConfig, FormLayout } from './types'

export type ResourceFormProps<T extends Record<string, unknown>> = {
  schema: ZodType<T>
  fields: FieldConfig<T>[]
  initialValues?: Partial<T>
  onSubmit: (values: T) => Promise<void>
  layout?: FormLayout
  submitText?: string
  onCancel?: () => void
}

export function ResourceForm<T extends Record<string, unknown>>({
  schema,
  fields,
  initialValues,
  onSubmit,
  layout = 'two',
  submitText = '保存',
  onCancel,
}: ResourceFormProps<T>) {
  const [form] = Form.useForm<Record<string, unknown>>()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleFinish(raw: Record<string, unknown>): Promise<void> {
    setFormError(null)
    // 未填写的文本框 antd 给的是 undefined，归一化成 ''，让 Zod 的“必填”文案能命中
    const values = { ...raw }
    for (const field of fields) {
      if (field.kind === 'text' || field.kind === 'textarea') {
        if (values[field.name] === undefined) values[field.name] = ''
      }
    }
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      form.setFields(zodErrorToFields(parsed.error))
      return
    }
    try {
      setSubmitting(true)
      await onSubmit(parsed.data)
    } catch (error) {
      if (isApiError(error) && error.fields) {
        form.setFields(apiFieldsToForm(error.fields))
      }
      setFormError(isApiError(error) ? error.message : '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  function renderField(field: FieldConfig<T>) {
    switch (field.kind) {
      case 'text':
        return <Input placeholder={field.placeholder} allowClear />
      case 'textarea':
        return <Input.TextArea rows={field.rows ?? 3} placeholder={field.placeholder} />
      case 'money':
        return <MoneyInput placeholder={field.placeholder} />
      case 'select':
        return <Select options={field.options} placeholder={field.placeholder} allowClear />
      case 'asyncSelect':
        return (
          <AsyncSelect
            load={field.load}
            cacheKey={field.cacheKey}
            placeholder={field.placeholder}
            minChars={field.minChars}
          />
        )
      default:
        return null
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues as Record<string, unknown>}
      onFinish={handleFinish}
      requiredMark="optional"
    >
      {formError ? (
        <Alert type="error" showIcon title={formError} style={{ marginBottom: 16 }} />
      ) : null}

      <Row gutter={16}>
        {fields.map((field) => (
          <Col key={field.name} span={layout === 'two' && field.kind !== 'textarea' ? 12 : 24}>
            <Form.Item
              name={field.name as unknown as string}
              label={field.label}
              required={field.required}
            >
              {renderField(field)}
            </Form.Item>
          </Col>
        ))}
      </Row>

      <Space>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitText}
        </Button>
        {onCancel ? <Button onClick={onCancel}>取消</Button> : null}
      </Space>
    </Form>
  )
}
