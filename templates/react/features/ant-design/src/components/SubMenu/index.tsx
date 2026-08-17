import type { ReactNode } from 'react'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'

export interface MenuRouteType {
  key: string
  label: string
  icon?: ReactNode
  children?: MenuRouteType[]
}

interface SubMenuProps extends Omit<MenuProps, 'items'> {
  routes: MenuRouteType[]
}

function SubMenu({ routes, ...menuProps }: SubMenuProps): JSX.Element {
  return <Menu {...menuProps} items={createMenuItems(routes)} />
}

function createMenuItems(routes: MenuRouteType[]): NonNullable<MenuProps['items']> {
  return routes.map((route) => {
    const menuItem = {
      key: route.key,
      label: route.label,
      icon: route.icon,
    }

    return route.children?.length
      ? { ...menuItem, children: createMenuItems(route.children) }
      : menuItem
  })
}

export default SubMenu
