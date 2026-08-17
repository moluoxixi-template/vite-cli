/**
 * Ant Design application layout.
 */

import {
  BookOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { ConfigProvider, Layout, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import SubMenu from '@/components/SubMenu'
import type { MenuRouteType } from '@/components/SubMenu'

const { Content, Header } = Layout

const menuItems: MenuRouteType[] = [
  { key: '/', icon: <HomeOutlined />, label: 'Home' },
  { key: '/about', icon: <InfoCircleOutlined />, label: 'About' },
  {
    key: '/guide',
    icon: <BookOutlined />,
    label: '指南',
    children: [
      {
        key: '/guide/advanced',
        icon: <FolderOpenOutlined />,
        label: '进阶',
        children: [
          {
            key: '/guide/advanced/topic',
            icon: <FileTextOutlined />,
            label: '三级标题',
          },
        ],
      },
    ],
  },
]

const layoutTheme = {
  components: {
    Layout: {
      headerPadding: 0,
    },
  },
}

function App(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <ConfigProvider theme={layoutTheme}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ alignItems: 'center', display: 'flex' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: '0 32px 0 0' }}>
            React Template
          </Typography.Title>
          <SubMenu
            mode="horizontal"
            onClick={({ key }) => navigate(key)}
            routes={menuItems}
            selectedKeys={[location.pathname]}
            theme="dark"
          />
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default App
