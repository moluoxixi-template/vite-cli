/**
 * 根组件
 */

import { Outlet } from 'react-router-dom'

function App(): JSX.Element {
  return (
    <main>
      <Outlet />
    </main>
  )
}

export default App
