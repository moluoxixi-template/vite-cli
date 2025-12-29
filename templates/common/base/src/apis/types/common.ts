/**
 * 通用类型定义
 * API 响应通用类型
 */

/**
 * 分页参数类型
 */
export interface PaginationParamsType {
  /** 页码 */
  page: number
  /** 每页数量 */
  pageSize: number
}

/**
 * 分页响应类型
 */
export interface PaginationResponseType<T> {
  /** 数据列表 */
  list: T[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
}

/**
 * 通用响应类型
 */
export interface ApiResponseType<T = unknown> {
  /** 响应码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: T
}

/** 列表响应类型 */
export interface ListResponseType<T> extends ApiResponseType<PaginationResponseType<T>> {}
