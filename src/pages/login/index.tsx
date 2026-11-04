import { useState } from 'react'
import { Alert, App, Button, Card, Form, Input, Space, Typography } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isApiError } from '@/shared/api/errors'
import { loginBodySchema } from '@/shared/api/schema'
import { zodErrorToFields } from '@/shared/ui/resource-form/errors'
import { useLogin } from '@/features/auth/hooks'

type LoginValues = Record<string, string>

export default function LoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const login = useLogin()
  const { message } = App.useApp()
  const [form] = Form.useForm<LoginValues>()
  const [error, setError] = useState<string | null>(null)

  const redirect = params.get('redirect') || '/customers'

  async function submit(values: LoginValues): Promise<void> {
    setError(null)
    const parsed = loginBodySchema.safeParse({
      email: values.email ?? '',
      password: values.password ?? '',
    })
    if (!parsed.success) {
      form.setFields(zodErrorToFields(parsed.error))
      return
    }
    try {
      const result = await login.mutateAsync(parsed.data)
      message.success(`欢迎，${result.user.name}`)
      void navigate(redirect, { replace: true })
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : '登录失败，请稍后重试')
    }
  }

  async function quickLogin(role: 'admin' | 'viewer'): Promise<void> {
    form.setFieldsValue({
      email: role === 'admin' ? 'admin@example.com' : 'viewer@example.com',
      password: role === 'admin' ? 'admin123' : 'viewer123',
    })
    await form.submit()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}
    >
      <Card style={{ width: 380 }}>
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          CRM 管理后台
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          演示账号已预填，直接选择角色即可
        </Typography.Paragraph>

        {error ? <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} /> : null}

        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="email" label="邮箱" initialValue="admin@example.com">
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" initialValue="admin123">
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={login.isPending}>
            登录
          </Button>
        </Form>

        <Space style={{ marginTop: 16, justifyContent: 'center', width: '100%' }}>
          <Button size="small" onClick={() => void quickLogin('admin')}>
            管理员进入
          </Button>
          <Button size="small" onClick={() => void quickLogin('viewer')}>
            只读账号进入
          </Button>
        </Space>
      </Card>
    </div>
  )
}
