/**
 * Ant Design application layout.
 */

import {
  HomeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { Layout, Menu, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Content, Header } = Layout

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: 'Home' },
  { key: '/about', icon: <InfoCircleOutlined />, label: 'About' },
]

function App(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ alignItems: 'center', display: 'flex' }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: '0 32px 0 0' }}>
          React Template
        </Typography.Title>
        <Menu
          items={menuItems}
          mode="horizontal"
          onClick={({ key }) => navigate(key)}
          selectedKeys={[location.pathname]}
          theme="dark"
        />
      </Header>
      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default App
