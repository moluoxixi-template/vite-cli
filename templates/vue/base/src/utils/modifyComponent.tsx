/**
 * 组件修改工具
 * 用于修改组件的行为，特别是 Element Plus 组件在 qiankun 环境下的行为
 */

import type { ComponentInstance } from 'vue'
import { computed, defineComponent } from 'vue'

/**
 * 使用修改后的 props 包装组件
 * @param OriginalComponent 原始组件
 * @param modifier 属性修改函数
 * @returns 包装后的组件
 */
function withModifiedProps(
  OriginalComponent: ComponentInstance<any>,
  modifier = (v: any) => v,
) {
  return defineComponent({
    name: OriginalComponent.name,
    setup(_: any, { attrs, slots }) {
      const modifiedProps = computed(() => modifier(attrs))
      return () => <OriginalComponent {...modifiedProps.value} v-slots={slots} />
    },
  })
}

/**
 * 修改组件的行为
 * @param app Vue 应用实例
 * @param components 需要修改的组件数组
 * @param modifier 属性修改函数
 */
export function modifyComponents(
  app: any,
  components: ComponentInstance<any>[],
  modifier = (v: any) => v,
) {
  components.forEach((component) => {
    const newComponent = withModifiedProps(component, modifier)
    app.component(newComponent.name, newComponent)
  })
}
