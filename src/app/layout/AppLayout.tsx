import { Layout, Menu, Space, Tag, Button, Typography } from 'antd'
import { LogoutOutlined, ShoppingCartOutlined, TeamOutlined } from '@ant-design/icons'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser, useLogout } from '@/features/auth/hooks'

const { Header, Sider, Content } = Layout

export function AppLayout() {
  const location = useLocation()
  const { data } = useCurrentUser()
  const logout = useLogout()

  const selectedKey = location.pathname.startsWith('/orders') ? '/orders' : '/customers'
  const items = [
    { key: '/customers', icon: <TeamOutlined />, label: <Link to="/customers">客户</Link> },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: <Link to="/orders">订单</Link> },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" breakpoint="lg" collapsedWidth={64}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <Typography.Text strong>CRM</Typography.Text>
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={items} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingInline: 24,
          }}
        >
          <Space>
            <span>{data?.user.name ?? '未登录'}</span>
            <Tag color={data?.user.role === 'admin' ? 'blue' : 'default'}>
              {data?.user.role === 'admin' ? '管理员' : '只读'}
            </Tag>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => logout.mutate()}
              loading={logout.isPending}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
