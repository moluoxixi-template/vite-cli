/**
 * Pinia 状态管理配置
 */

import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

export const store = createPinia();

// 使用持久化插件
store.use(piniaPluginPersistedstate);

// 导出 store 模块
export * from './modules/user';
export * from './modules/system';

