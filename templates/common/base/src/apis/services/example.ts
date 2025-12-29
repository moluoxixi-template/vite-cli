/**
 * 示例服务
 * 示例 API 接口
 */

import type {
  ApiResponseType,
  CreateExampleParamsType,
  ExampleItemType,
  ListResponseType,
  PaginationParamsType,
  UpdateExampleParamsType,
} from '../types'

import request from '../request'

/**
 * 获取示例列表
 * @param params 分页参数
 * @returns 示例列表响应
 */
export function getExampleList(params: PaginationParamsType): Promise<ListResponseType<ExampleItemType>> {
  return request.get('/example/list', { params })
}

/**
 * 获取示例详情
 * @param id 示例 ID
 * @returns 示例详情响应
 */
export function getExampleDetail(id: string): Promise<ApiResponseType<ExampleItemType>> {
  return request.get(`/example/${id}`)
}

/**
 * 创建示例
 * @param data 创建参数
 * @returns 创建结果响应
 */
export function createExample(data: CreateExampleParamsType): Promise<ApiResponseType<ExampleItemType>> {
  return request.post('/example', data)
}

/**
 * 更新示例
 * @param id 示例 ID
 * @param data 更新参数
 * @returns 更新结果响应
 */
export function updateExample(id: string, data: UpdateExampleParamsType): Promise<ApiResponseType<ExampleItemType>> {
  return request.put(`/example/${id}`, data)
}

/**
 * 删除示例
 * @param id 示例 ID
 * @returns 删除结果响应
 */
export function deleteExample(id: string): Promise<ApiResponseType<null>> {
  return request.delete(`/example/${id}`)
}
