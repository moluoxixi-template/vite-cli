import { Outlet } from 'react-router-dom'

function Guide(): JSX.Element {
  return (
    <div className="guide-page">
      <h1>指南</h1>
      <p>这是一级菜单页面</p>
      <Outlet />
    </div>
  )
}

export default Guide
