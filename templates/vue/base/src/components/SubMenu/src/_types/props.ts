/**
 * SubMenu Props 类型定义
 */

import type { RouteRecordRaw } from 'vue-router';

export interface SubMenuProps {
  /** 菜单列表 */
  menuList: RouteRecordRaw[];
}

