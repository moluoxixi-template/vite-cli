/**
 * 示例类型定义
 */

/** 示例数据类型 */
export interface ExampleItemType {
  id: string
  name: string
  description: string
  createdAt: string
}

/** 创建示例参数类型 */
export type CreateExampleParamsType = Omit<ExampleItemType, 'id' | 'createdAt'>

/** 更新示例参数类型 */
export type UpdateExampleParamsType = Partial<ExampleItemType>

