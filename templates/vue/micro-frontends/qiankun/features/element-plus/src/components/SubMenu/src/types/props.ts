export interface subMenuRouteMetaType {
  title?: unknown
  [key: string]: unknown
}

export interface subMenuRouteType {
  path?: string
  name?: string | symbol
  meta?: subMenuRouteMetaType
  children?: subMenuRouteType[]
}

export interface propsType {
  routes: subMenuRouteType[]
  parentPath?: string
}
