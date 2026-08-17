import { Outlet } from 'react-router-dom'

function Advanced(): JSX.Element {
  return (
    <div className="advanced-page">
      <h2>进阶</h2>
      <p>这是二级菜单页面</p>
      <Outlet />
    </div>
  )
}

export default Advanced
