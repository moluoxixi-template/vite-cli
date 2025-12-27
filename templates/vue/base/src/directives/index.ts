/**
 * 自定义指令
 * 全局指令注册
 */

import type { App } from 'vue';

/**
 * 注册全局指令
 * @param app Vue 应用实例
 */
export default function directives(app: App): void {
  // v-focus 自动聚焦指令
  app.directive('focus', {
    mounted(el: HTMLElement) {
      el.focus();
    },
  });

  // v-loading 加载状态指令
  app.directive('loading', {
    mounted(el: HTMLElement, binding) {
      if (binding.value) {
        el.classList.add('is-loading');
      }
    },
    updated(el: HTMLElement, binding) {
      if (binding.value) {
        el.classList.add('is-loading');
      } else {
        el.classList.remove('is-loading');
      }
    },
  });
}

