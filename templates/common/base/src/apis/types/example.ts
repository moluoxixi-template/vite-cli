/**
 * 示例类型定义
 */

/**
 * 示例数据类型
 */
export interface ExampleItemType {
  /** 示例 ID */
  id: string
  /** 示例名称 */
  name: string
  /** 示例描述 */
  description: string
  /** 创建时间 */
  createdAt: string
}

/**
 * 创建示例参数类型
 * 排除 id 和 createdAt 字段
 */
export type CreateExampleParamsType = Omit<ExampleItemType, 'id' | 'createdAt'>

/**
 * 更新示例参数类型
 * 所有字段可选
 */
export type UpdateExampleParamsType = Partial<ExampleItemType>
