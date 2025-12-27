/**
 * 通用类型定义
 * API 响应通用类型
 */

/** 分页参数类型 */
export interface PaginationParamsType {
  page: number
  pageSize: number
}

/** 分页响应类型 */
export interface PaginationResponseType<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 通用响应类型 */
export interface ApiResponseType<T = unknown> {
  code: number
  message: string
  data: T
}

/** 列表响应类型 */
export interface ListResponseType<T> extends ApiResponseType<PaginationResponseType<T>> {}
